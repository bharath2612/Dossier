import { NextRequest } from 'next/server';
import { presentationStore } from '@/lib/services/presentation-store';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/presentations/:id/stream - SSE endpoint for real-time presentation status updates
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication (use getUser() for security)
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { id } = await params;
  const userId = req.nextUrl.searchParams.get('user_id') || user.id;

  // Verify user_id matches authenticated user
  if (userId !== user.id) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'Missing presentation ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(': SSE connection established\n\n'));

      console.log(`[SSE] Client connected for presentation ${id}`);

      // Poll and send updates
      let isClosed = false;
      const pollInterval = setInterval(async () => {
        // Check if controller is already closed
        if (isClosed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const presentation = await presentationStore.get(id, userId);

          if (!presentation) {
            if (!isClosed) {
              controller.enqueue(
                encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Presentation not found' })}\n\n`)
              );
            }
            clearInterval(pollInterval);
            if (!isClosed) {
              controller.close();
              isClosed = true;
            }
            return;
          }

          // Send presentation data (only if controller is still open)
          if (!isClosed) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(presentation)}\n\n`)
            );
          }

          // If generation is complete or failed, close the connection
          if (presentation.status === 'completed' || presentation.status === 'failed') {
            console.log(`[SSE] Presentation ${id} ${presentation.status}, closing connection`);
            clearInterval(pollInterval);
            if (!isClosed) {
              controller.enqueue(
                encoder.encode(`event: complete\ndata: ${JSON.stringify({ status: presentation.status })}\n\n`)
              );
              controller.close();
              isClosed = true;
            }
          }
        } catch (error) {
          console.error('[SSE] Error fetching presentation:', error);
          if (!isClosed) {
            try {
              controller.enqueue(
                encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch presentation' })}\n\n`)
              );
            } catch (enqueueError) {
              // Controller already closed, ignore
            }
          }
          clearInterval(pollInterval);
          if (!isClosed) {
            try {
              controller.close();
              isClosed = true;
            } catch (closeError) {
              // Already closed, ignore
            }
          }
        }
      }, 5000); // Check every 5 seconds

      // Clean up on client disconnect (handled by Next.js)
      req.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected for presentation ${id}`);
        clearInterval(pollInterval);
        if (!isClosed) {
          try {
            controller.close();
            isClosed = true;
          } catch (error) {
            // Controller already closed, ignore
          }
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    },
  });
}

