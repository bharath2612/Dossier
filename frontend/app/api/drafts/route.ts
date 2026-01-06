import { NextRequest, NextResponse } from 'next/server';
import { draftStore } from '@/lib/services/draft-store';
import { v4 as uuidv4 } from 'uuid';

// GET /api/drafts - Get all drafts
export async function GET() {
  try {
    const drafts = await draftStore.getAll();
    return NextResponse.json({ drafts, count: drafts.length });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch drafts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/drafts - Create new draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, prompt, enhanced_prompt, outline } = body;

    // Validation
    if (!title || !prompt || !outline) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'title, prompt, and outline are required',
        },
        { status: 400 }
      );
    }

    if (!outline.title || !Array.isArray(outline.slides)) {
      return NextResponse.json(
        {
          error: 'Invalid outline structure',
          message: 'outline must have title and slides array',
        },
        { status: 400 }
      );
    }

    // Create draft
    const draft = {
      id: uuidv4(),
      title,
      prompt,
      enhanced_prompt,
      outline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const savedDraft = await draftStore.save(draft);

    return NextResponse.json(
      {
        draft: savedDraft,
        message: 'Draft created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      {
        error: 'Failed to create draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

