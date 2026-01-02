import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export default anthropic;

// Helper function to count tokens (rough estimate)
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Helper function to call Claude with retry logic
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    retries?: number;
  } = {}
): Promise<{ content: string; tokens: number }> {
  const {
    model = 'claude-sonnet-4-5-20250929',
    maxTokens = 4096,
    temperature = 0.7,
    retries = 1,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return {
        content: content.text,
        tokens: message.usage.input_tokens + message.usage.output_tokens,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`Claude API call failed (attempt ${attempt + 1}/${retries + 1}):`, error);

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new Error(`Claude API call failed after ${retries + 1} attempts: ${lastError?.message}`);
}
