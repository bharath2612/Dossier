"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokens = estimateTokens;
exports.callClaude = callClaude;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
// Initialize Anthropic client with custom fetch that handles SSL
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    // Add timeout and better error handling
    maxRetries: 2,
    timeout: 60000, // 60 seconds
});
exports.default = anthropic;
// Helper function to count tokens (rough estimate)
function estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
}
// Helper function to call Claude with retry logic
async function callClaude(systemPrompt, userPrompt, options = {}) {
    const { model = 'claude-sonnet-4-5-20250929', maxTokens = 4096, temperature = 0.7, retries = 1, } = options;
    let lastError = null;
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
        }
        catch (error) {
            lastError = error;
            console.error(`Claude API call failed (attempt ${attempt + 1}/${retries + 1}):`, error);
            if (attempt < retries) {
                // Wait before retrying (exponential backoff)
                await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    throw new Error(`Claude API call failed after ${retries + 1} attempts: ${lastError?.message}`);
}
//# sourceMappingURL=anthropic.js.map