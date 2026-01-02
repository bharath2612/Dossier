"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGenerateOutline = handleGenerateOutline;
const uuid_1 = require("uuid");
const research_1 = require("../agents/research");
const outline_1 = require("../agents/outline");
const draft_store_1 = require("../services/draft-store");
async function handleGenerateOutline(req, res) {
    try {
        const { enhanced_prompt } = req.body;
        if (!enhanced_prompt) {
            res.status(400).json({
                error: 'Missing required field: enhanced_prompt',
            });
            return;
        }
        // Track progress and token usage
        let totalTokens = 0;
        const progress = {
            preprocessing: 0,
            research: 0,
            outline: 0,
        };
        // Step 1: Research (10-50% progress)
        console.log('Starting research...');
        const researchResult = await (0, research_1.conductResearch)(enhanced_prompt);
        if (!researchResult.success || !researchResult.data) {
            res.status(500).json({
                error: 'Research failed',
                message: researchResult.error,
            });
            return;
        }
        totalTokens += researchResult.token_usage || 0;
        progress.research = 50;
        console.log(`Research complete. Tokens: ${researchResult.token_usage}`);
        // Step 2: Generate Outline (50-100% progress)
        console.log('Generating outline...');
        const outlineResult = await (0, outline_1.generateOutline)(enhanced_prompt, researchResult.data);
        if (!outlineResult.success || !outlineResult.data) {
            // If outline generation fails but we have research, return partial results
            if (researchResult.data) {
                res.status(206).json({
                    error: 'Outline generation failed, showing partial results',
                    message: outlineResult.error,
                    research: researchResult.data,
                    token_usage: {
                        preprocessor: 0,
                        research: researchResult.token_usage || 0,
                        outline: 0,
                    },
                });
                return;
            }
            res.status(500).json({
                error: 'Outline generation failed',
                message: outlineResult.error,
            });
            return;
        }
        totalTokens += outlineResult.token_usage || 0;
        progress.outline = 100;
        console.log(`Outline complete. Tokens: ${outlineResult.token_usage}`);
        // Generate draft ID and save to database
        const draft_id = (0, uuid_1.v4)();
        try {
            // Save draft to database (Supabase or in-memory)
            await draft_store_1.draftStore.save({
                id: draft_id,
                title: outlineResult.data.title,
                prompt: req.body.original_prompt || enhanced_prompt,
                enhanced_prompt: enhanced_prompt,
                outline: outlineResult.data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            console.log(`Draft saved successfully with ID: ${draft_id}`);
        }
        catch (saveError) {
            console.error('Failed to save draft to database:', saveError);
            // Continue anyway - draft can still be used in-session
        }
        // Return complete response
        res.json({
            draft_id,
            title: outlineResult.data.title,
            outline: outlineResult.data,
            research: researchResult.data,
            token_usage: {
                preprocessor: 0,
                research: researchResult.token_usage || 0,
                outline: outlineResult.token_usage || 0,
                total: totalTokens,
            },
        });
    }
    catch (error) {
        console.error('Generate outline endpoint error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=generate-outline.js.map