import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { draftStore } from '../services/draft-store';
import { Draft, CreateDraftRequest, UpdateDraftRequest } from '../types/draft';

// POST /api/drafts - Create new draft
export async function handleCreateDraft(req: Request, res: Response): Promise<void> {
  try {
    const { title, prompt, enhanced_prompt, outline } = req.body as CreateDraftRequest;

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
    const draft: Draft = {
      id: uuidv4(),
      title,
      prompt,
      enhanced_prompt,
      outline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const savedDraft = await draftStore.save(draft);

    res.status(201).json({
      draft: savedDraft,
      message: 'Draft created successfully',
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({
      error: 'Failed to create draft',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// PATCH /api/drafts/:id - Update existing draft
export async function handleUpdateDraft(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { outline, title } = req.body as UpdateDraftRequest;

    if (!id) {
      res.status(400).json({
        error: 'Missing draft ID',
        message: 'Draft ID is required in URL',
      });
      return;
    }

    // Check if draft exists
    const existingDraft = await draftStore.get(id);
    if (!existingDraft) {
      res.status(404).json({
        error: 'Draft not found',
        message: `No draft found with ID: ${id}`,
      });
      return;
    }

    // Update outline (most common case for auto-save)
    if (outline) {
      const updatedDraft = await draftStore.updateOutline(id, outline);
      res.json({
        draft: updatedDraft,
        message: 'Draft updated successfully',
      });
      return;
    }

    // Update title
    if (title) {
      const updatedDraft = await draftStore.save({
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
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({
      error: 'Failed to update draft',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// GET /api/drafts/:id - Get draft by ID
export async function handleGetDraft(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Missing draft ID',
        message: 'Draft ID is required in URL',
      });
      return;
    }

    const draft = await draftStore.get(id);

    if (!draft) {
      res.status(404).json({
        error: 'Draft not found',
        message: `No draft found with ID: ${id}`,
      });
      return;
    }

    res.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({
      error: 'Failed to fetch draft',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// DELETE /api/drafts/:id - Delete draft
export async function handleDeleteDraft(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Missing draft ID',
        message: 'Draft ID is required in URL',
      });
      return;
    }

    const deleted = await draftStore.delete(id);

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
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      error: 'Failed to delete draft',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// GET /api/drafts - Get all drafts (for future dashboard)
export async function handleGetAllDrafts(_req: Request, res: Response): Promise<void> {
  try {
    const drafts = await draftStore.getAll();
    res.json({ drafts, count: drafts.length });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      error: 'Failed to fetch drafts',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
