import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { generateSlides } from '@/lib/agents/slide-generator';
import { presentationStore } from '@/lib/services/presentation-store';
import { draftStore } from '@/lib/services/draft-store';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      draft_id,
      outline,
      citation_style = 'inline',
      theme = 'minimal',
      user_id,
    } = body;

    // Verify user_id matches session
    const userId = user_id || session.user.id;
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!draft_id || !outline || !userId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: draft_id, outline, user_id',
        },
        { status: 400 }
      );
    }

    if (!outline.slides || outline.slides.length === 0) {
      return NextResponse.json(
        {
          error: 'Outline must contain at least one slide',
        },
        { status: 400 }
      );
    }

    // Get the original draft to retrieve prompt
    const draft = await draftStore.get(draft_id);

    const presentationId = uuidv4();

    console.log(`Creating presentation ${presentationId} with status 'generating' for user ${userId}`);

    // Create presentation object with "generating" status and empty slides
    const presentation = {
      id: presentationId,
      user_id: userId,
      title: outline.title,
      prompt: draft?.prompt || '',
      enhanced_prompt: draft?.enhanced_prompt,
      outline,
      slides: [], // Empty initially
      citation_style,
      theme,
      status: 'generating' as const,
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
      return NextResponse.json(
        {
          error: 'Failed to save presentation',
          message: saveError instanceof Error ? saveError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Start background slide generation (fire and forget)
    generateSlidesInBackground(
      presentationId,
      draft_id,
      outline,
      citation_style,
      theme,
      userId
    ).catch((error) => {
      console.error(`[Background] Unhandled error in background generation:`, error);
    });

    // Return immediately with presentation ID and generating status
    return NextResponse.json({
      presentation_id: presentationId,
      status: 'generating',
    });
  } catch (error) {
    console.error('Generate presentation endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

