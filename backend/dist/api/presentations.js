"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGeneratePresentation = handleGeneratePresentation;
exports.handleGetPresentation = handleGetPresentation;
exports.handleGetAllPresentations = handleGetAllPresentations;
exports.handleUpdatePresentation = handleUpdatePresentation;
exports.handleDeletePresentation = handleDeletePresentation;
exports.handleDuplicatePresentation = handleDuplicatePresentation;
exports.handlePresentationStream = handlePresentationStream;
const uuid_1 = require("uuid");
const slide_generator_1 = require("../agents/slide-generator");
const presentation_store_1 = require("../services/presentation-store");
const draft_store_1 = require("../services/draft-store");
// Background slide generation (fire and forget)
async function generateSlidesInBackground(presentationId, draft_id, outline, citation_style, theme, user_id) {
    try {
        console.log(`[Background] Starting slide generation for presentation ${presentationId}`);
        // Get the original draft to retrieve prompt and research data
        const draft = await draft_store_1.draftStore.get(draft_id);
        // Generate slides using Slide Generator Agent
        const slidesResult = await (0, slide_generator_1.generateSlides)({
            outlineSlides: outline.slides,
            citationStyle: citation_style,
            researchData: null, // TODO: Store research data in draft for citation context
        });
        if (!slidesResult.success || !slidesResult.data) {
            console.error(`[Background] Slide generation failed for ${presentationId}:`, slidesResult.error);
            // Update presentation with error status
            await presentation_store_1.presentationStore.update(presentationId, {
                status: 'failed',
                error_message: slidesResult.error || 'Slide generation failed',
            }, user_id);
            return;
        }
        console.log(`[Background] Slides generated successfully for ${presentationId}`);
        // Update presentation with generated slides
        await presentation_store_1.presentationStore.update(presentationId, {
            slides: slidesResult.data,
            status: 'completed',
            token_usage: {
                preprocessor: 0,
                research: 0,
                outline: 0,
                slides: slidesResult.token_usage || 0,
                total: slidesResult.token_usage || 0,
            },
        }, user_id);
        console.log(`[Background] Presentation ${presentationId} completed and saved`);
    }
    catch (error) {
        console.error(`[Background] Error generating slides for ${presentationId}:`, error);
        try {
            await presentation_store_1.presentationStore.update(presentationId, {
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error',
            }, user_id);
        }
        catch (updateError) {
            console.error(`[Background] Failed to update error status:`, updateError);
        }
    }
}
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
        // Get the original draft to retrieve prompt
        const draft = await draft_store_1.draftStore.get(draft_id);
        const presentationId = (0, uuid_1.v4)();
        console.log(`Creating presentation ${presentationId} with status 'generating' for user ${user_id}`);
        // Create presentation object with "generating" status and empty slides
        const presentation = {
            id: presentationId,
            user_id,
            title: outline.title,
            prompt: draft?.prompt || '',
            enhanced_prompt: draft?.enhanced_prompt,
            outline,
            slides: [], // Empty initially
            citation_style,
            theme,
            status: 'generating',
            token_usage: {
                preprocessor: 0,
                research: 0,
                outline: 0,
                slides: 0,
                total: 0,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        // Save to database with "generating" status
        try {
            await presentation_store_1.presentationStore.create(presentation);
            console.log(`Presentation ${presentationId} created with status 'generating'`);
        }
        catch (saveError) {
            console.error('Failed to save presentation:', saveError);
            res.status(500).json({
                error: 'Failed to save presentation',
                message: saveError instanceof Error ? saveError.message : 'Unknown error',
            });
            return;
        }
        // Start background slide generation (fire and forget)
        generateSlidesInBackground(presentationId, draft_id, outline, citation_style, theme, user_id).catch((error) => {
            console.error(`[Background] Unhandled error in background generation:`, error);
        });
        // Return immediately with presentation ID and generating status
        res.json({
            presentation_id: presentationId,
            status: 'generating',
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
// SSE endpoint for real-time presentation status updates
async function handlePresentationStream(req, res) {
    const { id } = req.params;
    const userId = req.query.user_id;
    if (!id) {
        res.status(400).json({ error: 'Missing presentation ID' });
        return;
    }
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx
    // CORS headers for SSE
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    console.log(`[SSE] Client connected for presentation ${id}`);
    // Send initial connection message
    res.write(`: SSE connection established\n\n`);
    // Poll and send updates
    const pollInterval = setInterval(async () => {
        try {
            const presentation = await presentation_store_1.presentationStore.get(id, userId);
            if (!presentation) {
                res.write(`event: error\ndata: ${JSON.stringify({ error: 'Presentation not found' })}\n\n`);
                clearInterval(pollInterval);
                res.end();
                return;
            }
            // Send presentation data
            res.write(`data: ${JSON.stringify(presentation)}\n\n`);
            // If generation is complete or failed, close the connection
            if (presentation.status === 'completed' || presentation.status === 'failed') {
                console.log(`[SSE] Presentation ${id} ${presentation.status}, closing connection`);
                clearInterval(pollInterval);
                res.write(`event: complete\ndata: ${JSON.stringify({ status: presentation.status })}\n\n`);
                res.end();
            }
        }
        catch (error) {
            console.error('[SSE] Error fetching presentation:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch presentation' })}\n\n`);
            clearInterval(pollInterval);
            res.end();
        }
    }, 5000); // Check every 5 seconds
    // Clean up on client disconnect
    req.on('close', () => {
        console.log(`[SSE] Client disconnected for presentation ${id}`);
        clearInterval(pollInterval);
        res.end();
    });
}
//# sourceMappingURL=presentations.js.map