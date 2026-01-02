"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlides = generateSlides;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const client = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const SYSTEM_PROMPT = `You are a professional presentation content generator. Your role is to expand outline slides into full, polished presentation content.

CRITICAL RULES:
1. Create 3-4 concise bullet points maximum per slide (2-3 for intro/conclusion)
2. Each bullet should be 1-2 sentences, impactful and specific
3. Add 2-3 speaker notes per slide - these are talking points for the presenter
4. Speaker notes should be actionable insights, not just repeating the slide content
5. Keep titles under 60 characters
6. Keep each bullet under 120 characters (soft limit, can exceed if necessary)
7. Focus on "why it matters" - make content actionable and specific
8. Avoid generic statements - use frameworks, data points, and specific examples
9. For 'data' slides, structure bullets as stat + context
10. For 'quote' slides, create a single powerful statement with attribution

SLIDE TYPE GUIDELINES:
- intro: Hook the audience, establish context, create urgency ("why now")
- content: Frameworks, strategies, step-by-step processes
- data: Stats-heavy, each bullet = data point + brief interpretation
- quote: Single powerful statement, large text format
- conclusion: Call-to-action, next steps, key takeaways

OUTPUT FORMAT: Return valid JSON only, no markdown formatting.

{
  "slides": [
    {
      "index": 0,
      "title": "Strong, Specific Title",
      "body": ["Bullet 1", "Bullet 2", "Bullet 3"],
      "speakerNotes": ["Talking point 1", "Talking point 2"],
      "type": "intro",
      "citations": [
        {
          "text": "Source Name 2024",
          "source": {
            "title": "Article Title",
            "url": "https://...",
            "domain": "example.com",
            "date": "2024-01-01"
          }
        }
      ]
    }
  ]
}`;
async function generateSlides(input) {
    try {
        const { outlineSlides, citationStyle, researchData } = input;
        // Build user prompt with outline and citation instructions
        const userPrompt = `Generate full presentation content from this outline:

${JSON.stringify(outlineSlides, null, 2)}

${researchData ? `Research context for citations:\n${JSON.stringify(researchData, null, 2)}\n` : ''}

Citation style: ${citationStyle}
${citationStyle === 'inline' ? '- Add [Source 2024] inline citations in bullet points where appropriate' : ''}
${citationStyle === 'footnote' ? '- Add numbered footnotes and list citations separately' : ''}
${citationStyle === 'speaker_notes' ? '- Only include citations in speaker notes, not on slides' : ''}

Generate complete slide content following the system rules. Return valid JSON only.`;
        console.log('Calling Slide Generator Agent...');
        const startTime = Date.now();
        const response = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8000,
            temperature: 0.7,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
        });
        const duration = Date.now() - startTime;
        console.log(`Slide Generator completed in ${duration}ms`);
        // Extract text content
        const textContent = response.content.find((block) => block.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text content in response');
        }
        // Parse JSON response
        const rawText = textContent.text.trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }
        const result = JSON.parse(jsonMatch[0]);
        // Validate response structure
        if (!result.slides || !Array.isArray(result.slides)) {
            throw new Error('Invalid response structure: missing slides array');
        }
        // Validate each slide
        const slides = result.slides.map((slide, index) => {
            if (!slide.title || !slide.body || !Array.isArray(slide.body)) {
                throw new Error(`Invalid slide structure at index ${index}`);
            }
            return {
                index: slide.index ?? index,
                title: slide.title,
                body: slide.body,
                speakerNotes: slide.speakerNotes || [],
                visualHint: slide.visualHint,
                citations: slide.citations || [],
                type: slide.type || outlineSlides[index]?.type || 'content',
            };
        });
        // Calculate token usage
        const tokenUsage = response.usage.input_tokens + response.usage.output_tokens;
        return {
            success: true,
            data: slides,
            token_usage: tokenUsage,
        };
    }
    catch (error) {
        console.error('Slide Generator error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in slide generation',
        };
    }
}
//# sourceMappingURL=slide-generator.js.map