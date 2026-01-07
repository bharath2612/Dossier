import { NextRequest, NextResponse } from 'next/server';
import { draftStore } from '@/lib/services/draft-store';

// GET /api/drafts/:id - Get draft by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Missing draft ID',
          message: 'Draft ID is required in URL',
        },
        { status: 400 }
      );
    }

    const draft = await draftStore.get(id);

    if (!draft) {
      return NextResponse.json(
        {
          error: 'Draft not found',
          message: `No draft found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/drafts/:id - Update existing draft
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { outline, title } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Missing draft ID',
          message: 'Draft ID is required in URL',
        },
        { status: 400 }
      );
    }

    // Check if draft exists
    const existingDraft = await draftStore.get(id);
    if (!existingDraft) {
      return NextResponse.json(
        {
          error: 'Draft not found',
          message: `No draft found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    // Update outline (most common case for auto-save)
    if (outline) {
      const updatedDraft = await draftStore.updateOutline(id, outline);
      return NextResponse.json({
        draft: updatedDraft,
        message: 'Draft updated successfully',
      });
    }

    // Update title
    if (title) {
      const updatedDraft = await draftStore.save({
        ...existingDraft,
        title,
      });
      return NextResponse.json({
        draft: updatedDraft,
        message: 'Draft updated successfully',
      });
    }

    return NextResponse.json(
      {
        error: 'No updates provided',
        message: 'Provide outline or title to update',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      {
        error: 'Failed to update draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/drafts/:id - Delete draft
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Missing draft ID',
          message: 'Draft ID is required in URL',
        },
        { status: 400 }
      );
    }

    const deleted = await draftStore.delete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          error: 'Draft not found',
          message: `No draft found with ID: ${id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Draft deleted successfully',
      id,
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}




