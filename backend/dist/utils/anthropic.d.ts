import Anthropic from '@anthropic-ai/sdk';
declare const anthropic: Anthropic;
export default anthropic;
export declare function estimateTokens(text: string): number;
export declare function callClaude(systemPrompt: string, userPrompt: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    retries?: number;
}): Promise<{
    content: string;
    tokens: number;
}>;
//# sourceMappingURL=anthropic.d.ts.map