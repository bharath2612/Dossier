import { NextRequest, NextResponse } from 'next/server';
import { presentationStore } from '@/lib/services/presentation-store';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/presentations/:id/duplicate - Duplicate presentation
export async function POST(
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
    const body = await req.json();
    const userId = body.user_id || session.user.id;

    // Verify user_id matches session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Missing presentation ID or user_id' },
        { status: 400 }
      );
    }

    const duplicated = await presentationStore.duplicate(id, userId);

    if (!duplicated) {
      return NextResponse.json(
        { error: 'Presentation not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      presentation_id: duplicated.id,
      message: 'Presentation duplicated successfully',
    });
  } catch (error) {
    console.error('Duplicate presentation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to duplicate presentation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}




