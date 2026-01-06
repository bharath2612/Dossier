import { NextRequest, NextResponse } from 'next/server';
import { preprocessPrompt } from '@/lib/agents/preprocessor';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Note: Preprocess doesn't require auth - it's a public endpoint
    // Auth is only required for presentation generation

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        {
          error: 'Missing required field: prompt',
        },
        { status: 400 }
      );
    }

    // Call Pre-processor agent
    const result = await preprocessPrompt(prompt);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          suggestions: result.data?.validation.warnings || [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Preprocess endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

