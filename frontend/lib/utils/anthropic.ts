import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('⚠️  ANTHROPIC_API_KEY not found in environment variables');
}

const anthropic = new Anthropic({
  apiKey: apiKey || '',
  maxRetries: 2,
  timeout: 60000, // 60 seconds
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

  // Check if API key is available (re-read from env in case it wasn't loaded at module init)
  const runtimeApiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!runtimeApiKey || runtimeApiKey.trim() === '') {
    throw new Error('ANTHROPIC_API_KEY is not set. Please add it to your .env.local file and restart the dev server.');
  }

  if (runtimeApiKey.length < 20) {
    console.warn(`⚠️  ANTHROPIC_API_KEY appears to be invalid (length: ${runtimeApiKey.length}). Expected length: ~100+ characters.`);
    console.warn(`⚠️  NOTE: If you have ANTHROPIC_API_KEY set in your shell environment, it will override .env.local. Unset it with: unset ANTHROPIC_API_KEY`);
  }

  // Create a new client instance with the runtime API key to ensure it's fresh
  // Check for custom base URL (for testing/proxy scenarios)
  // IMPORTANT: Ignore baseURL if it points to localhost (common misconfiguration)
  const baseURL = process.env.ANTHROPIC_BASE_URL;
  const isValidBaseURL = baseURL && !baseURL.includes('localhost') && !baseURL.includes('127.0.0.1');
  
  const clientConfig: any = {
    apiKey: runtimeApiKey,
    maxRetries: 0, // We handle retries manually
    timeout: 60000,
  };
  
  // Only add baseURL if it's valid (not localhost)
  if (isValidBaseURL) {
    clientConfig.baseURL = baseURL;
  }
  
  const runtimeClient = new Anthropic(clientConfig);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const message = await runtimeClient.messages.create({
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

  // Check if API key is available
  const runtimeApiKey = process.env.ANTHROPIC_API_KEY;

  if (!runtimeApiKey || runtimeApiKey.trim() === '') {
    throw new Error('ANTHROPIC_API_KEY is not set. Please add it to your .env.local file and restart the dev server.');
  }

  // Create client config
  const baseURL = process.env.ANTHROPIC_BASE_URL;
  const isValidBaseURL = baseURL && !baseURL.includes('localhost') && !baseURL.includes('127.0.0.1');

  const clientConfig: { apiKey: string; maxRetries: number; timeout: number; baseURL?: string } = {
    apiKey: runtimeApiKey,
    maxRetries: 0,
    timeout: 120000, // 2 minutes for streaming
  };

  if (isValidBaseURL) {
    clientConfig.baseURL = baseURL;
  }

  const runtimeClient = new Anthropic(clientConfig);

  try {
    const stream = runtimeClient.messages.stream({
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

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          yield delta.text;
        }
      }
    }
  } catch (error) {
    console.error('Stream Claude error:', error);
    throw new Error(`Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

