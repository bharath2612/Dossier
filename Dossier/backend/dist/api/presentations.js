"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGeneratePresentation = handleGeneratePresentation;
exports.handleGetPresentation = handleGetPresentation;
exports.handleGetAllPresentations = handleGetAllPresentations;
exports.handleUpdatePresentation = handleUpdatePresentation;
exports.handleDeletePresentation = handleDeletePresentation;
exports.handleDuplicatePresentation = handleDuplicatePresentation;
const uuid_1 = require("uuid");
const slide_generator_1 = require("../agents/slide-generator");
const presentation_store_1 = require("../services/presentation-store");
const draft_store_1 = require("../services/draft-store");
// Generate full presentation from outline
async function handleGeneratePresentation(req, res) {
    try {
        const { draft_id, outline, citation_style = 'inline', theme = 'minimal', user_id, } = req.body;
        if (!draft_id || !outline || !user_id) {
            res.status(400).json({
                error: 'Missing required fields: draft_id, outline, user_id',
            });
            return;
        }
        if (!outline.slides || outline.slides.length === 0) {
            res.status(400).json({
                error: 'Outline must contain at least one slide',
            });
            return;
        }
        // Get the original draft to retrieve prompt and research data
        const draft = await draft_store_1.draftStore.get(draft_id);
        console.log(`Generating presentation for user ${user_id}...`);
        // Generate slides using Slide Generator Agent
        const slidesResult = await (0, slide_generator_1.generateSlides)({
            outlineSlides: outline.slides,
            citationStyle: citation_style,
            researchData: null, // TODO: Store research data in draft for citation context
        });
        if (!slidesResult.success || !slidesResult.data) {
            res.status(500).json({
                error: 'Slide generation failed',
                message: slidesResult.error,
            });
            return;
        }
        const presentationId = (0, uuid_1.v4)();
        // Create presentation object
        const presentation = {
            id: presentationId,
            user_id,
            title: outline.title,
            prompt: draft?.prompt || '',
            enhanced_prompt: draft?.enhanced_prompt,
            outline,
            slides: slidesResult.data,
            citation_style,
            theme,
            token_usage: {
                preprocessor: 0,
                research: 0,
                outline: 0,
                slides: slidesResult.token_usage || 0,
                total: slidesResult.token_usage || 0,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        // Save to database
        try {
            await presentation_store_1.presentationStore.create(presentation);
            console.log(`Presentation saved successfully with ID: ${presentationId}`);
        }
        catch (saveError) {
            console.error('Failed to save presentation:', saveError);
            res.status(500).json({
                error: 'Failed to save presentation',
                message: saveError instanceof Error ? saveError.message : 'Unknown error',
            });
            return;
        }
        // Return response
        res.json({
            presentation_id: presentationId,
            slides: slidesResult.data,
            token_usage: {
                slides: slidesResult.token_usage || 0,
                total: slidesResult.token_usage || 0,
            },
        });
    }
    catch (error) {
        console.error('Generate presentation endpoint error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// Get presentation by ID
async function handleGetPresentation(req, res) {
    try {
        const { id } = req.params;
        const userId = req.query.user_id;
        if (!id) {
            res.status(400).json({ error: 'Missing presentation ID' });
            return;
        }
        const presentation = await presentation_store_1.presentationStore.get(id, userId);
        if (!presentation) {
            res.status(404).json({ error: 'Presentation not found' });
            return;
        }
        res.json({ presentation });
    }
    catch (error) {
        console.error('Get presentation error:', error);
        res.status(500).json({
            error: 'Failed to get presentation',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// Get all presentations for a user
async function handleGetAllPresentations(req, res) {
    try {
        const userId = req.query.user_id;
        const searchQuery = req.query.q;
        if (!userId) {
            res.status(400).json({ error: 'Missing user_id query parameter' });
            return;
        }
        let presentations;
        if (searchQuery) {
            presentations = await presentation_store_1.presentationStore.search(userId, searchQuery);
        }
        else {
            presentations = await presentation_store_1.presentationStore.getAllForUser(userId);
        }
        res.json({ presentations });
    }
    catch (error) {
        console.error('Get all presentations error:', error);
        res.status(500).json({
            error: 'Failed to get presentations',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// Update presentation
async function handleUpdatePresentation(req, res) {
    try {
        const { id } = req.params;
        const userId = req.query.user_id;
        const updates = req.body;
        if (!id) {
            res.status(400).json({ error: 'Missing presentation ID' });
            return;
        }
        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: 'No updates provided' });
            return;
        }
        const updated = await presentation_store_1.presentationStore.update(id, updates, userId);
        if (!updated) {
            res.status(404).json({ error: 'Presentation not found or unauthorized' });
            return;
        }
        res.json({
            presentation: updated,
            message: 'Presentation updated successfully',
        });
    }
    catch (error) {
        console.error('Update presentation error:', error);
        res.status(500).json({
            error: 'Failed to update presentation',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// Delete presentation
async function handleDeletePresentation(req, res) {
    try {
        const { id } = req.params;
        const userId = req.query.user_id;
        if (!id) {
            res.status(400).json({ error: 'Missing presentation ID' });
            return;
        }
        const deleted = await presentation_store_1.presentationStore.delete(id, userId);
        if (!deleted) {
            res.status(404).json({ error: 'Presentation not found or unauthorized' });
            return;
        }
        res.json({ message: 'Presentation deleted successfully' });
    }
    catch (error) {
        console.error('Delete presentation error:', error);
        res.status(500).json({
            error: 'Failed to delete presentation',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// Duplicate presentation
async function handleDuplicatePresentation(req, res) {
    try {
        const { id } = req.params;
        const userId = req.body.user_id;
        if (!id || !userId) {
            res.status(400).json({ error: 'Missing presentation ID or user_id' });
            return;
        }
        const duplicated = await presentation_store_1.presentationStore.duplicate(id, userId);
        if (!duplicated) {
            res.status(404).json({ error: 'Presentation not found or unauthorized' });
            return;
        }
        res.json({
            presentation_id: duplicated.id,
            message: 'Presentation duplicated successfully',
        });
    }
    catch (error) {
        console.error('Duplicate presentation error:', error);
        res.status(500).json({
            error: 'Failed to duplicate presentation',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=presentations.js.map