"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessPrompt = preprocessPrompt;
const anthropic_1 = require("../utils/anthropic");
const SYSTEM_PROMPT = `You are a prompt enhancement specialist for an AI presentation generator called Dossier AI.

Your role is to:
1. Validate user prompts for appropriateness and clarity
2. Enhance vague or short prompts with research-friendly detail
3. Reject harmful, off-topic, or inappropriate prompts
4. Add structure cues that help downstream research and outline agents

Guidelines:
- Reject prompts about: illegal activities, harmful content, personal attacks, spam
- Reject prompts that are completely off-topic for presentations (e.g., "write me a virus", "hack this system")
- Enhance vague prompts by adding: target audience, key objectives, context, actionable frameworks
- Keep the core intent of the user's prompt intact
- Output should be a clear, research-friendly prompt (2-4 sentences max)

Output format:
- If valid: Return ONLY the enhanced prompt as plain text
- If invalid: Return "INVALID:" followed by a brief reason and 1-2 suggestions

Examples:

Input: "sales tips"
Output: "10 data-driven sales strategies for B2B SaaS companies in 2025, including case studies, proven frameworks, and actionable tactics for improving conversion rates"

Input: "how to hack passwords"
Output: "INVALID: This topic involves illegal activities. Suggestions: (1) 'Best practices for password security in organizations' (2) 'How to implement secure authentication systems'"

Input: "leadership"
Output: "Effective leadership principles for managing remote teams in 2025, featuring research-backed frameworks, real-world examples from successful companies, and practical implementation strategies"`;
const FEW_SHOT_EXAMPLES = `Here are some examples:

User: "climate change"
Assistant: "The impact of climate change on global business strategy: data-driven insights, sustainable practices from leading companies, and actionable steps for reducing corporate carbon footprint in 2025"

User: "make a presentation about dogs"
Assistant: "The evolution of dog breeds: historical context, genetic science behind breed development, popular breeds and their characteristics, and responsible pet ownership guidelines"

User: "teach me to phish people"
Assistant: "INVALID: This involves illegal activities and social engineering attacks. Suggestions: (1) 'How to protect your organization from phishing attacks' (2) 'Cybersecurity awareness training for employees'"`;
async function preprocessPrompt(rawPrompt) {
    try {
        // Basic validation
        if (!rawPrompt || rawPrompt.trim().length < 3) {
            return {
                success: false,
                error: 'Prompt too short. Please provide more detail (at least 3 characters).',
            };
        }
        if (rawPrompt.length > 1000) {
            return {
                success: false,
                error: 'Prompt too long. Please keep it under 1000 characters.',
            };
        }
        // Call Claude to validate and enhance
        const userPrompt = `${FEW_SHOT_EXAMPLES}

Now process this user prompt:
User: "${rawPrompt}"
Assistant:`;
        const { content, tokens } = await (0, anthropic_1.callClaude)(SYSTEM_PROMPT, userPrompt, {
            maxTokens: 500,
            temperature: 0.7,
            retries: 1,
        });
        // Check if invalid
        if (content.startsWith('INVALID:')) {
            const parts = content.split('Suggestions:');
            const reason = parts[0].replace('INVALID:', '').trim();
            const suggestionsText = parts[1] || '';
            const suggestions = suggestionsText
                .split(/\(\d+\)/)
                .slice(1)
                .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
                .filter((s) => s.length > 0);
            return {
                success: false,
                error: `Invalid prompt: ${reason}`,
                data: {
                    enhanced_prompt: '',
                    validation: {
                        is_valid: false,
                        warnings: suggestions,
                    },
                },
                token_usage: tokens,
            };
        }
        // Valid and enhanced
        const enhanced_prompt = content.trim();
        return {
            success: true,
            data: {
                enhanced_prompt,
                validation: {
                    is_valid: true,
                    warnings: [],
                },
            },
            token_usage: tokens,
        };
    }
    catch (error) {
        console.error('Preprocessor error:', error);
        return {
            success: false,
            error: `Preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
//# sourceMappingURL=preprocessor.js.map