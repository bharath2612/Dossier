import { NextRequest, NextResponse } from 'next/server';
import { presentationStore } from '@/lib/services/presentation-store';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/presentations - Get all presentations for a user
export async function GET(req: NextRequest) {
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

    const userId = req.nextUrl.searchParams.get('user_id') || session.user.id;
    const searchQuery = req.nextUrl.searchParams.get('q');

    // Verify user_id matches session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    let presentations;

    if (searchQuery) {
      presentations = await presentationStore.search(userId, searchQuery);
    } else {
      presentations = await presentationStore.getAllForUser(userId);
    }

    return NextResponse.json({ presentations });
  } catch (error) {
    console.error('Get all presentations error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get presentations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}




