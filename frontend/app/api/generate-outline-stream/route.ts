import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { streamClaude } from '@/lib/utils/anthropic';
import { preprocessPrompt } from '@/lib/agents/preprocessor';
import { braveSearch, extractDomain } from '@/lib/utils/brave-search';
import { callClaude } from '@/lib/utils/anthropic';
import { draftStore } from '@/lib/services/draft-store';
import type { GeneratedSlide } from '@/store/types';

// Extended SSE Event types for streaming
type StreamSSEEvent =
  | { type: 'preprocessing'; status: 'start' | 'complete'; enhanced_prompt?: string; original_prompt?: string }
  | { type: 'research_query'; query: string }
  | { type: 'research_source'; source: { domain: string; favicon: string } }
  | { type: 'research_complete'; sourceCount: number }
  | { type: 'content_chunk'; chunk: string } // NEW: Stream raw chunks
  | { type: 'slide_complete'; index: number; parsed: GeneratedSlide } // NEW: Emitted when slide separator detected
  | { type: 'draft_created'; draftId: string }
  | { type: 'complete'; slideCount: number }
  | { type: 'error'; message: string };

// System prompt for markdown outline generation
const OUTLINE_SYSTEM_PROMPT = `You are a presentation outline architect for Dossier AI.

Your role is to create compelling, well-structured slide outlines from a topic or research data.

Guidelines:
- Create 8-12 slides (flexible 5-20 range based on topic complexity)
- Each slide must have a STRONG, SPECIFIC title (never generic like "Introduction" or "Overview")
- Each slide should answer "why this matters" in its bullets
- 2-4 bullet points per slide
- Make every title specific and compelling
- Ensure logical flow from slide to slide

Output format (MARKDOWN ONLY - NO JSON):
## Specific, action-oriented slide title
- Specific bullet point with data or insight
- Another concrete point
- Third point if needed
---
## Next Slide Title
- Bullet 1
- Bullet 2
---

CRITICAL RULES:
- Use ## for slide titles (H2 format)
- Use - for bullet points
- Use --- as slide separator between slides
- NEVER use generic titles like "Introduction", "Overview", "Conclusion"
- Output ONLY markdown, no JSON, no code blocks, no explanations
- Start immediately with the first slide title`;

const OUTLINE_WITH_RESEARCH_PROMPT = `You are a presentation outline architect for Dossier AI.

Create a compelling outline based on the provided research data.

Guidelines:
- Create 8-12 slides incorporating the research findings
- Each slide must have a STRONG, SPECIFIC title (never generic)
- Include stats and data from the research when relevant
- 2-4 bullet points per slide with specific insights
- Make every title specific and compelling

Output format (MARKDOWN ONLY):
## Specific, action-oriented slide title
- Specific bullet point with data or insight
- Another concrete point
---
## Next Slide Title
- Bullet 1
- Bullet 2
---

CRITICAL: Output ONLY markdown. No JSON, no code blocks. Start with the first slide.`;

// Helper to parse slide markdown
function parseSlideMarkdown(md: string): GeneratedSlide | null {
  const lines = md.trim().split('\n').filter(l => l.trim());
  const titleLine = lines.find(l => l.startsWith('## '));
  if (!titleLine) return null;

  const title = titleLine.replace('## ', '').trim();
  const bullets = lines
    .filter(l => l.startsWith('- '))
    .map(l => l.replace(/^-\s*/, '').trim())
    .filter(b => b.length > 0);

  if (!title) return null;

  return { index: 0, title, bullets: bullets.length > 0 ? bullets : [''] };
}

// Helper to create SSE message
function createSSEMessage(event: StreamSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

// Generate search queries for research mode
async function generateSearchQueries(enhancedPrompt: string): Promise<string[]> {
  const wordCount = enhancedPrompt.split(' ').length;
  const isComplex = wordCount > 20 || enhancedPrompt.includes(',');

  if (!isComplex) {
    return [enhancedPrompt];
  }

  try {
    const { content } = await callClaude(
      'You are a search query optimizer. Generate diverse, specific search queries.',
      `Generate 3 diverse search queries for this topic that will return complementary information:
"${enhancedPrompt}"

Return as JSON array of strings (no markdown):
["query 1", "query 2", "query 3"]`,
      { maxTokens: 200, temperature: 0.5 }
    );

    const queries = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
    return Array.isArray(queries) ? queries : [enhancedPrompt];
  } catch {
    return [enhancedPrompt];
  }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await req.json();
    const { prompt, mode = 'fast' } = body;

    if (!prompt || prompt.trim().length < 20) {
      return new Response(
        createSSEMessage({ type: 'error', message: 'Prompt must be at least 20 characters' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: StreamSSEEvent) => {
          controller.enqueue(encoder.encode(createSSEMessage(event)));
        };

        try {
          // Step 1: Preprocess prompt
          emit({ type: 'preprocessing', status: 'start' });

          const preprocessResult = await preprocessPrompt(prompt);

          if (!preprocessResult.success || !preprocessResult.data) {
            emit({
              type: 'error',
              message: preprocessResult.error || 'Failed to process prompt',
            });
            controller.close();
            return;
          }

          const enhancedPrompt = preprocessResult.data.enhanced_prompt;
          emit({
            type: 'preprocessing',
            status: 'complete',
            enhanced_prompt: enhancedPrompt,
            original_prompt: prompt,
          });

          // Step 2: Research (if research mode)
          let researchContext = '';
          let sourceCount = 0;

          if (mode === 'research') {
            const queries = await generateSearchQueries(enhancedPrompt);

            for (const query of queries) {
              emit({ type: 'research_query', query });

              try {
                const results = await braveSearch(query, 5);

                for (const result of results) {
                  const domain = extractDomain(result.url);
                  emit({
                    type: 'research_source',
                    source: {
                      domain,
                      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                    },
                  });
                  sourceCount++;

                  // Build research context
                  researchContext += `\n[${domain}] ${result.title}\n${result.description}\n`;
                }

                // Rate limit between queries
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (searchError) {
                console.error(`Search failed for query "${query}":`, searchError);
              }
            }

            emit({ type: 'research_complete', sourceCount });
          }

          // Step 3: Generate outline with streaming
          const userPrompt = mode === 'research' && researchContext
            ? `Topic: "${enhancedPrompt}"\n\nResearch Findings:\n${researchContext}\n\nCreate a compelling 8-12 slide outline incorporating these findings. Start with the first slide title (## format):`
            : `Topic: "${enhancedPrompt}"\n\nCreate a compelling 8-12 slide outline. Start with the first slide title (## format):`;

          const systemPrompt = mode === 'research' && researchContext
            ? OUTLINE_WITH_RESEARCH_PROMPT
            : OUTLINE_SYSTEM_PROMPT;

          let buffer = '';
          let slideIndex = 0;
          const slides: GeneratedSlide[] = [];
          let currentSlideBuffer = '';

          // Stream from Claude - emit each chunk for real-time display
          for await (const chunk of streamClaude(systemPrompt, userPrompt, {
            maxTokens: 4000,
            temperature: 0.7,
          })) {
            // Emit each chunk immediately for streaming effect
            emit({ type: 'content_chunk', chunk });

            buffer += chunk;
            currentSlideBuffer += chunk;

            // Check for slide separator
            while (buffer.includes('\n---\n') || buffer.includes('\n---')) {
              let separatorIndex = buffer.indexOf('\n---\n');
              let separatorLength = 5;

              if (separatorIndex === -1) {
                separatorIndex = buffer.indexOf('\n---');
                if (separatorIndex !== -1 && separatorIndex + 4 < buffer.length && buffer[separatorIndex + 4] !== '\n') {
                  break;
                }
                separatorLength = 4;
              }

              if (separatorIndex === -1) break;

              const slideMarkdown = buffer.slice(0, separatorIndex);
              buffer = buffer.slice(separatorIndex + separatorLength);
              currentSlideBuffer = buffer;

              const slide = parseSlideMarkdown(slideMarkdown);
              if (slide) {
                slide.index = slideIndex;
                slides.push(slide);
                // Emit slide_complete when separator is found
                emit({
                  type: 'slide_complete',
                  index: slideIndex,
                  parsed: slide,
                });
                slideIndex++;
              }
            }
          }

          // Flush remaining buffer (last slide)
          if (buffer.trim()) {
            const slide = parseSlideMarkdown(buffer);
            if (slide) {
              slide.index = slideIndex;
              slides.push(slide);
              emit({
                type: 'slide_complete',
                index: slideIndex,
                parsed: slide,
              });
            }
          }

          // Step 4: Save draft
          const draftId = uuidv4();
          const outlineTitle = slides[0]?.title || 'Untitled Presentation';

          try {
            await draftStore.save({
              id: draftId,
              title: outlineTitle,
              prompt: prompt,
              enhanced_prompt: enhancedPrompt,
              outline: {
                title: outlineTitle,
                slides: slides.map((s, idx) => ({
                  index: idx,
                  title: s.title,
                  bullets: s.bullets,
                  type: idx === 0 ? 'intro' : idx === slides.length - 1 ? 'conclusion' : 'content',
                })),
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            emit({ type: 'draft_created', draftId });
          } catch (saveError) {
            console.error('Failed to save draft:', saveError);
            // Still emit draft_created with the ID, storage failed but outline is generated
            emit({ type: 'draft_created', draftId });
          }

          // Step 5: Complete
          emit({ type: 'complete', slideCount: slides.length });
          controller.close();
        } catch (error) {
          console.error('Stream generation error:', error);
          emit({
            type: 'error',
            message: error instanceof Error ? error.message : 'Generation failed',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
