import { NextRequest, NextResponse } from 'next/server';
import { presentationStore } from '@/lib/services/presentation-store';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateSlides } from '@/lib/agents/slide-generator';
import { draftStore } from '@/lib/services/draft-store';
import { v4 as uuidv4 } from 'uuid';

// GET /api/presentations/:id - Get presentation by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('user_id') || session.user.id;

    // Verify user_id matches session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing presentation ID' },
        { status: 400 }
      );
    }

    const presentation = await presentationStore.get(id, userId);

    if (!presentation) {
      return NextResponse.json(
        { error: 'Presentation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ presentation });
  } catch (error) {
    console.error('Get presentation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get presentation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/presentations/:id - Update presentation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('user_id') || session.user.id;
    const updates = await req.json();

    // Verify user_id matches session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing presentation ID' },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const updated = await presentationStore.update(id, updates, userId);

    if (!updated) {
      return NextResponse.json(
        { error: 'Presentation not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      presentation: updated,
      message: 'Presentation updated successfully',
    });
  } catch (error) {
    console.error('Update presentation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update presentation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/presentations/:id - Delete presentation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const userId = req.nextUrl.searchParams.get('user_id') || session.user.id;

    // Verify user_id matches session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing presentation ID' },
        { status: 400 }
      );
    }

    const deleted = await presentationStore.delete(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Presentation not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Presentation deleted successfully' });
  } catch (error) {
    console.error('Delete presentation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete presentation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

