import { NextRequest } from 'next/server';
import { generateSlidesStream } from '@/lib/agents/slide-generator';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { presentationStore } from '@/lib/services/presentation-store';
import { draftStore } from '@/lib/services/draft-store';

/**
 * Streaming endpoint for slide generation
 * Streams slide-by-slide updates as they're generated
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      presentation_id,
      draft_id,
      outline,
      citation_style = 'inline',
      theme = 'minimal',
      user_id,
    } = body;

    // Verify user_id matches session
    const userId = user_id || session.user.id;
    if (userId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!presentation_id || !draft_id || !outline || !userId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: presentation_id, draft_id, outline, user_id',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the original draft to retrieve prompt and research data
    const draft = await draftStore.get(draft_id);

    // Start streaming slide generation
    const stream = await generateSlidesStream({
      outlineSlides: outline.slides,
      citationStyle: citation_style,
      researchData: null, // TODO: Store research data in draft for citation context
    });

    // Create a transform stream to parse and update slides as they come in
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Pass through the chunk (Vercel AI SDK format)
        controller.enqueue(chunk);

        // Note: Full parsing of slides from stream would require more complex logic
        // For now, we'll use the background generation pattern and this stream
        // can be used for progress updates
      },
      async flush(controller) {
        // After stream completes, the background generation will update the presentation
        controller.terminate();
      },
    });

    return new Response(
      stream.pipeThrough(transformStream),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('Streaming endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

