"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateDraft = handleCreateDraft;
exports.handleUpdateDraft = handleUpdateDraft;
exports.handleGetDraft = handleGetDraft;
exports.handleDeleteDraft = handleDeleteDraft;
exports.handleGetAllDrafts = handleGetAllDrafts;
const uuid_1 = require("uuid");
const draft_store_1 = require("../services/draft-store");
// POST /api/drafts - Create new draft
async function handleCreateDraft(req, res) {
    try {
        const { title, prompt, enhanced_prompt, outline } = req.body;
        // Validation
        if (!title || !prompt || !outline) {
            res.status(400).json({
                error: 'Missing required fields',
                message: 'title, prompt, and outline are required',
            });
            return;
        }
        if (!outline.title || !Array.isArray(outline.slides)) {
            res.status(400).json({
                error: 'Invalid outline structure',
                message: 'outline must have title and slides array',
            });
            return;
        }
        // Create draft
        const draft = {
            id: (0, uuid_1.v4)(),
            title,
            prompt,
            enhanced_prompt,
            outline,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const savedDraft = await draft_store_1.draftStore.save(draft);
        res.status(201).json({
            draft: savedDraft,
            message: 'Draft created successfully',
        });
    }
    catch (error) {
        console.error('Error creating draft:', error);
        res.status(500).json({
            error: 'Failed to create draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// PATCH /api/drafts/:id - Update existing draft
async function handleUpdateDraft(req, res) {
    try {
        const { id } = req.params;
        const { outline, title } = req.body;
        if (!id) {
            res.status(400).json({
                error: 'Missing draft ID',
                message: 'Draft ID is required in URL',
            });
            return;
        }
        // Check if draft exists
        const existingDraft = await draft_store_1.draftStore.get(id);
        if (!existingDraft) {
            res.status(404).json({
                error: 'Draft not found',
                message: `No draft found with ID: ${id}`,
            });
            return;
        }
        // Update outline (most common case for auto-save)
        if (outline) {
            const updatedDraft = await draft_store_1.draftStore.updateOutline(id, outline);
            res.json({
                draft: updatedDraft,
                message: 'Draft updated successfully',
            });
            return;
        }
        // Update title
        if (title) {
            const updatedDraft = await draft_store_1.draftStore.save({
                ...existingDraft,
                title,
            });
            res.json({
                draft: updatedDraft,
                message: 'Draft updated successfully',
            });
            return;
        }
        res.status(400).json({
            error: 'No updates provided',
            message: 'Provide outline or title to update',
        });
    }
    catch (error) {
        console.error('Error updating draft:', error);
        res.status(500).json({
            error: 'Failed to update draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// GET /api/drafts/:id - Get draft by ID
async function handleGetDraft(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                error: 'Missing draft ID',
                message: 'Draft ID is required in URL',
            });
            return;
        }
        const draft = await draft_store_1.draftStore.get(id);
        if (!draft) {
            res.status(404).json({
                error: 'Draft not found',
                message: `No draft found with ID: ${id}`,
            });
            return;
        }
        res.json({ draft });
    }
    catch (error) {
        console.error('Error fetching draft:', error);
        res.status(500).json({
            error: 'Failed to fetch draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// DELETE /api/drafts/:id - Delete draft
async function handleDeleteDraft(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                error: 'Missing draft ID',
                message: 'Draft ID is required in URL',
            });
            return;
        }
        const deleted = await draft_store_1.draftStore.delete(id);
        if (!deleted) {
            res.status(404).json({
                error: 'Draft not found',
                message: `No draft found with ID: ${id}`,
            });
            return;
        }
        res.json({
            message: 'Draft deleted successfully',
            id,
        });
    }
    catch (error) {
        console.error('Error deleting draft:', error);
        res.status(500).json({
            error: 'Failed to delete draft',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// GET /api/drafts - Get all drafts (for future dashboard)
async function handleGetAllDrafts(_req, res) {
    try {
        const drafts = await draft_store_1.draftStore.getAll();
        res.json({ drafts, count: drafts.length });
    }
    catch (error) {
        console.error('Error fetching drafts:', error);
        res.status(500).json({
            error: 'Failed to fetch drafts',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=drafts.js.map