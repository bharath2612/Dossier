import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { conductResearch } from '@/lib/agents/research';
import { generateOutline } from '@/lib/agents/outline';
import { draftStore } from '@/lib/services/draft-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enhanced_prompt } = body;

    if (!enhanced_prompt) {
      return NextResponse.json(
        {
          error: 'Missing required field: enhanced_prompt',
        },
        { status: 400 }
      );
    }

    // Track progress and token usage
    let totalTokens = 0;
    const progress = {
      preprocessing: 0,
      research: 0,
      outline: 0,
    };

    // Step 1: Research (10-50% progress)
    console.log('Starting research...');
    const researchResult = await conductResearch(enhanced_prompt);

    if (!researchResult.success || !researchResult.data) {
      return NextResponse.json(
        {
          error: 'Research failed',
          message: researchResult.error,
        },
        { status: 500 }
      );
    }

    totalTokens += researchResult.token_usage || 0;
    progress.research = 50;
    console.log(`Research complete. Tokens: ${researchResult.token_usage}`);

    // Step 2: Generate Outline (50-100% progress)
    console.log('Generating outline...');
    const outlineResult = await generateOutline(enhanced_prompt, researchResult.data);

    if (!outlineResult.success || !outlineResult.data) {
      // If outline generation fails but we have research, return partial results
      if (researchResult.data) {
        return NextResponse.json(
          {
            error: 'Outline generation failed, showing partial results',
            message: outlineResult.error,
            research: researchResult.data,
            token_usage: {
              preprocessor: 0,
              research: researchResult.token_usage || 0,
              outline: 0,
            },
          },
          { status: 206 }
        );
      }

      return NextResponse.json(
        {
          error: 'Outline generation failed',
          message: outlineResult.error,
        },
        { status: 500 }
      );
    }

    totalTokens += outlineResult.token_usage || 0;
    progress.outline = 100;
    console.log(`Outline complete. Tokens: ${outlineResult.token_usage}`);

    // Generate draft ID and save to database
    const draft_id = uuidv4();

    try {
      // Save draft to database (Supabase or in-memory)
      await draftStore.save({
        id: draft_id,
        title: outlineResult.data.title,
        prompt: body.original_prompt || enhanced_prompt,
        enhanced_prompt: enhanced_prompt,
        outline: outlineResult.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`Draft saved successfully with ID: ${draft_id}`);
    } catch (saveError) {
      console.error('Failed to save draft to database:', saveError);
      // Continue anyway - draft can still be used in-session
    }

    // Return complete response
    return NextResponse.json({
      draft_id,
      title: outlineResult.data.title,
      outline: outlineResult.data,
      research: researchResult.data,
      token_usage: {
        preprocessor: 0,
        research: researchResult.token_usage || 0,
        outline: outlineResult.token_usage || 0,
        total: totalTokens,
      },
    });
  } catch (error) {
    console.error('Generate outline endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

