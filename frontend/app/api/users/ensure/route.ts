import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface EnsureUserRequest {
  user_id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

/**
 * Ensure user exists in public.users table
 * Creates user if not exists using auth.users data
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, email, name, avatar_url } = body as EnsureUserRequest;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // If Supabase not configured, just return success (development mode)
    if (!supabaseAdmin) {
      console.log('[ensureUser] Supabase admin not configured, skipping user creation');
      return NextResponse.json({ success: true, user_id, created: false });
    }

    console.log(`[ensureUser] Checking user ${user_id}...`);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar_url, created_at')
      .eq('id', user_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[ensureUser] Error checking user:', checkError);
      return NextResponse.json(
        {
          error: 'Failed to check user existence',
          message: checkError.message,
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log(`[ensureUser] User ${user_id} already exists`);
      return NextResponse.json({
        success: true,
        user_id,
        created: false,
        user: existingUser,
      });
    }

    // User doesn't exist, fetch from auth.users
    console.log(`[ensureUser] User not found in public.users, fetching from auth...`);

    const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (authError) {
      console.error('[ensureUser] Error fetching auth user:', authError);
      return NextResponse.json(
        {
          error: 'Failed to fetch auth user',
          message: authError.message,
        },
        { status: 500 }
      );
    }

    const authUser = authUserData.user;
    if (!authUser) {
      console.error('[ensureUser] Auth user not found');
      return NextResponse.json(
        { error: 'Auth user not found' },
        { status: 404 }
      );
    }

    console.log(`[ensureUser] Found auth user, creating public.users record...`);

    // Create user in public.users
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: user_id,
        email: email || authUser.email || `user-${user_id.slice(0, 8)}@placeholder.com`,
        name: name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
        avatar_url: avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate key error (race condition)
      if (insertError.code === '23505') {
        console.log(`[ensureUser] User ${user_id} was created by another request (race condition)`);
        // Fetch the existing user
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user_id)
          .single();

        return NextResponse.json({
          success: true,
          user_id,
          created: false,
          user: existingUser,
        });
      }

      console.error('[ensureUser] Error inserting user:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to create user',
          message: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    console.log(`[ensureUser] User ${user_id} created successfully`);
    return NextResponse.json({
      success: true,
      user_id,
      created: true,
      user: newUser,
    });
  } catch (err) {
    console.error('[ensureUser] Unexpected error:', err);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}




