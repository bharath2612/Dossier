import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateSlides } from '../agents/slide-generator';
import { presentationStore } from '../services/presentation-store';
import { draftStore } from '../services/draft-store';
import type {
  GeneratePresentationRequest,
  UpdatePresentationRequest,
  Presentation,
} from '../types/presentation';

// Background slide generation (fire and forget)
async function generateSlidesInBackground(
  presentationId: string,
  draft_id: string,
  outline: any,
  citation_style: any,
  theme: any,
  user_id: string
): Promise<void> {
  try {
    console.log(`[Background] Starting slide generation for presentation ${presentationId}`);

    // Get the original draft to retrieve prompt and research data
    const draft = await draftStore.get(draft_id);

    // Generate slides using Slide Generator Agent
    const slidesResult = await generateSlides({
      outlineSlides: outline.slides,
      citationStyle: citation_style,
      researchData: null, // TODO: Store research data in draft for citation context
    });

    if (!slidesResult.success || !slidesResult.data) {
      console.error(`[Background] Slide generation failed for ${presentationId}:`, slidesResult.error);
      
      // Update presentation with error status
      await presentationStore.update(presentationId, {
        status: 'failed',
        error_message: slidesResult.error || 'Slide generation failed',
      }, user_id);
      return;
    }

    console.log(`[Background] Slides generated successfully for ${presentationId}`);

    // Update presentation with generated slides
    await presentationStore.update(presentationId, {
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
  } catch (error) {
    console.error(`[Background] Error generating slides for ${presentationId}:`, error);
    
    try {
      await presentationStore.update(presentationId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      }, user_id);
    } catch (updateError) {
      console.error(`[Background] Failed to update error status:`, updateError);
    }
  }
}

// Generate full presentation from outline
export async function handleGeneratePresentation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      draft_id,
      outline,
      citation_style = 'inline',
      theme = 'minimal',
      user_id,
    }: GeneratePresentationRequest = req.body;

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
    const draft = await draftStore.get(draft_id);

    const presentationId = uuidv4();

    console.log(`Creating presentation ${presentationId} with status 'generating' for user ${user_id}`);

    // Create presentation object with "generating" status and empty slides
    const presentation: Presentation = {
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
      await presentationStore.create(presentation);
      console.log(`Presentation ${presentationId} created with status 'generating'`);
    } catch (saveError) {
      console.error('Failed to save presentation:', saveError);
      res.status(500).json({
        error: 'Failed to save presentation',
        message: saveError instanceof Error ? saveError.message : 'Unknown error',
      });
      return;
    }

    // Start background slide generation (fire and forget)
    generateSlidesInBackground(
      presentationId,
      draft_id,
      outline,
      citation_style,
      theme,
      user_id
    ).catch((error) => {
      console.error(`[Background] Unhandled error in background generation:`, error);
    });

    // Return immediately with presentation ID and generating status
    res.json({
      presentation_id: presentationId,
      status: 'generating',
    });
  } catch (error) {
    console.error('Generate presentation endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Get presentation by ID
export async function handleGetPresentation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string | undefined;

    if (!id) {
      res.status(400).json({ error: 'Missing presentation ID' });
      return;
    }

    const presentation = await presentationStore.get(id, userId);

    if (!presentation) {
      res.status(404).json({ error: 'Presentation not found' });
      return;
    }

    res.json({ presentation });
  } catch (error) {
    console.error('Get presentation error:', error);
    res.status(500).json({
      error: 'Failed to get presentation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Get all presentations for a user
export async function handleGetAllPresentations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.query.user_id as string;
    const searchQuery = req.query.q as string | undefined;

    if (!userId) {
      res.status(400).json({ error: 'Missing user_id query parameter' });
      return;
    }

    let presentations;

    if (searchQuery) {
      presentations = await presentationStore.search(userId, searchQuery);
    } else {
      presentations = await presentationStore.getAllForUser(userId);
    }

    res.json({ presentations });
  } catch (error) {
    console.error('Get all presentations error:', error);
    res.status(500).json({
      error: 'Failed to get presentations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Update presentation
export async function handleUpdatePresentation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string | undefined;
    const updates: UpdatePresentationRequest = req.body;

    if (!id) {
      res.status(400).json({ error: 'Missing presentation ID' });
      return;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }

    const updated = await presentationStore.update(id, updates, userId);

    if (!updated) {
      res.status(404).json({ error: 'Presentation not found or unauthorized' });
      return;
    }

    res.json({
      presentation: updated,
      message: 'Presentation updated successfully',
    });
  } catch (error) {
    console.error('Update presentation error:', error);
    res.status(500).json({
      error: 'Failed to update presentation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Delete presentation
export async function handleDeletePresentation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.query.user_id as string | undefined;

    if (!id) {
      res.status(400).json({ error: 'Missing presentation ID' });
      return;
    }

    const deleted = await presentationStore.delete(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Presentation not found or unauthorized' });
      return;
    }

    res.json({ message: 'Presentation deleted successfully' });
  } catch (error) {
    console.error('Delete presentation error:', error);
    res.status(500).json({
      error: 'Failed to delete presentation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Duplicate presentation
export async function handleDuplicatePresentation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.body.user_id as string;

    if (!id || !userId) {
      res.status(400).json({ error: 'Missing presentation ID or user_id' });
      return;
    }

    const duplicated = await presentationStore.duplicate(id, userId);

    if (!duplicated) {
      res.status(404).json({ error: 'Presentation not found or unauthorized' });
      return;
    }

    res.json({
      presentation_id: duplicated.id,
      message: 'Presentation duplicated successfully',
    });
  } catch (error) {
    console.error('Duplicate presentation error:', error);
    res.status(500).json({
      error: 'Failed to duplicate presentation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
