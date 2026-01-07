import { callClaude } from '@/lib/utils/anthropic';
import type { AgentResponse, Outline, ResearchData, SlideType } from '@/lib/types/agents';

const SYSTEM_PROMPT = `You are a presentation outline architect for Dossier AI.

Your role is to create compelling, well-structured slide outlines from research data.

Guidelines:
- Create 8-12 slides (flexible 5-20 range based on topic complexity)
- Each slide must have a STRONG, SPECIFIC title (never generic like "Introduction" or "Overview")
- Each slide should answer "why this matters" in its bullets
- Assign appropriate slide types: intro, content, data, quote, conclusion
- Structure should be flexible based on the topic (not rigid template)
- 2-4 bullet points per slide

Slide Type Definitions:
- intro: Hook, context, "why now" statements
- content: Frameworks, strategies, explanations
- data: Stats-heavy, chart/graph worthy content
- quote: Key insight, expert opinion (use sparingly)
- conclusion: Next steps, call-to-action, summary

Output format (JSON only, no markdown):
{
  "title": "Compelling presentation title",
  "slides": [
    {
      "index": 0,
      "title": "Specific, action-oriented slide title",
      "bullets": [
        "Specific bullet point with data or insight",
        "Another concrete point"
      ],
      "type": "intro|content|data|quote|conclusion"
    }
  ]
}

Important:
- Return ONLY valid JSON, no markdown code blocks
- NEVER use generic titles like "Introduction", "Overview", "Conclusion"
- Make every title specific and compelling
- Ensure logical flow from slide to slide`;

const FEW_SHOT_EXAMPLES = `Example 1:
Topic: "B2B SaaS Sales Strategies"
Research: [Data about conversion rates, sales cycles, frameworks]

Good Output:
{
  "title": "Proven Strategies to 2x Your B2B SaaS Conversion Rate",
  "slides": [
    {
      "index": 0,
      "title": "Why 40% of B2B Sales Reps Miss Quota (And How to Fix It)",
      "bullets": [
        "Feature-focused selling sees 60% lower win rates than value-based approaches",
        "Average enterprise deal takes 84 days, requiring sustained multi-stakeholder engagement",
        "Top performers spend 65% of time on discovery vs 35% on pitching"
      ],
      "type": "intro"
    },
    {
      "index": 1,
      "title": "The MEDDIC Framework: How to Qualify Deals That Close",
      "bullets": [
        "Metrics: Quantify the economic impact for your buyer",
        "Economic Buyer: Identify who controls the budget",
        "Decision Criteria: Understand how they'll evaluate options"
      ],
      "type": "content"
    }
  ]
}

Bad Output (Generic Titles):
{
  "title": "B2B SaaS Sales",
  "slides": [
    {"title": "Introduction", ...},  // Too generic!
    {"title": "Overview of Strategies", ...},  // Vague!
    {"title": "Conclusion", ...}  // Boring!
  ]
}`;

export async function generateOutline(
  enhancedPrompt: string,
  researchData: ResearchData
): Promise<AgentResponse<Outline>> {
  try {
    // Format research data for Claude
    const findingsText = researchData.findings
      .map((f) => `• ${f.stat}\n  Context: ${f.context}\n  Source: ${f.source.title}`)
      .join('\n\n');

    const frameworksText = researchData.frameworks
      .map((fw) => `• ${fw.name}: ${fw.description}`)
      .join('\n');

    const userPrompt = `${FEW_SHOT_EXAMPLES}

Now create a compelling presentation outline:

Topic: "${enhancedPrompt}"

Research Findings:
${findingsText}

${frameworksText ? `Frameworks:\n${frameworksText}\n` : ''}

Create 8-12 slides with STRONG, SPECIFIC titles (never generic!). Return ONLY valid JSON (no markdown):`;

    const { content, tokens } = await callClaude(SYSTEM_PROMPT, userPrompt, {
      maxTokens: 3000,
      temperature: 0.7,
      retries: 1,
    });

    // Parse Claude's response
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    let outline: Outline;

    try {
      outline = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse outline JSON:', cleanContent);
      throw new Error('Invalid JSON response from Outline Agent');
    }

    // Validate outline structure
    if (!outline.title || !outline.slides || !Array.isArray(outline.slides)) {
      throw new Error('Invalid outline structure');
    }

    // Validate slide count
    if (outline.slides.length < 5) {
      throw new Error('Outline must have at least 5 slides');
    }

    if (outline.slides.length > 20) {
      // Trim to 20 slides
      outline.slides = outline.slides.slice(0, 20);
    }

    // Ensure slide indices are correct
    outline.slides = outline.slides.map((slide, idx) => ({
      ...slide,
      index: idx,
    }));

    // Validate slide types
    const validTypes: SlideType[] = ['intro', 'content', 'data', 'quote', 'conclusion'];
    outline.slides.forEach((slide) => {
      if (!validTypes.includes(slide.type)) {
        slide.type = 'content'; // Default to content if invalid
      }
    });

    return {
      success: true,
      data: outline,
      token_usage: tokens,
    };
  } catch (error) {
    console.error('Outline generation error:', error);

    // Retry once if JSON parsing failed
    if (error instanceof Error && error.message.includes('Invalid JSON')) {
      console.log('Retrying outline generation...');

      try {
        const { content, tokens } = await callClaude(
          SYSTEM_PROMPT + '\n\nCRITICAL: Return ONLY valid JSON. No markdown, no explanations, ONLY JSON.',
          `Create outline for: "${enhancedPrompt}"\n\nResearch: ${JSON.stringify(researchData, null, 2)}\n\nReturn ONLY JSON:`,
          {
            maxTokens: 3000,
            temperature: 0.5,
          }
        );

        const outline = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());

        return {
          success: true,
          data: outline,
          token_usage: tokens,
        };
      } catch (retryError) {
        return {
          success: false,
          error: 'Failed to generate valid outline after retry',
        };
      }
    }

    return {
      success: false,
      error: `Outline generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}




