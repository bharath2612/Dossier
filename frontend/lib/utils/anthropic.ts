import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';

// Helper function to count tokens (rough estimate)
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Helper to get Anthropic client
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('ANTHROPIC_API_KEY is not set. Please add it to your .env.local file and restart the dev server.');
  }

  if (apiKey.length < 20) {
    console.warn(`⚠️  ANTHROPIC_API_KEY appears to be invalid (length: ${apiKey.length}). Expected length: ~100+ characters.`);
    console.warn(`⚠️  NOTE: If you have ANTHROPIC_API_KEY set in your shell environment, it will override .env.local. Unset it with: unset ANTHROPIC_API_KEY`);
  }

  return createAnthropic({
    apiKey,
  });
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
  const anthropic = getAnthropicClient();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await generateText({
        model: anthropic(model),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens,
        temperature,
      });

      return {
        content: result.text,
        tokens: result.usage.promptTokens + result.usage.completionTokens,
      };
    } catch (error) {
      lastError = error as Error;

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          console.error(`Claude API call failed (attempt ${attempt + 1}/${retries + 1}): Connection refused. Check your network connection and API key.`);
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error(`Claude API call failed (attempt ${attempt + 1}/${retries + 1}): Invalid API key. Please check your ANTHROPIC_API_KEY.`);
        } else {
          console.error(`Claude API call failed (attempt ${attempt + 1}/${retries + 1}):`, error.message);
        }
      } else {
        console.error(`Claude API call failed (attempt ${attempt + 1}/${retries + 1}):`, error);
      }

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new Error(`Claude API call failed after ${retries + 1} attempts: ${lastError?.message}`);
}

// Streaming version of callClaude for SSE-based outline generation
export async function* streamClaude(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = 'claude-sonnet-4-5-20250929',
    maxTokens = 4096,
    temperature = 0.7,
  } = options;

  const anthropic = getAnthropicClient();

  try {
    const result = await streamText({
      model: anthropic(model),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens,
      temperature,
    });

    // Stream text chunks
    for await (const textPart of result.textStream) {
      yield textPart;
    }
  } catch (error) {
    console.error('Stream Claude error:', error);
    throw new Error(`Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
