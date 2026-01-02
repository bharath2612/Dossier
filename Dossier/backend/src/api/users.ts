import { Request, Response } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';

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
export async function handleEnsureUser(req: Request, res: Response): Promise<void> {
  try {
    const { user_id, email, name, avatar_url } = req.body as EnsureUserRequest;

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }

    // If Supabase not configured, just return success (development mode)
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[ensureUser] Supabase not configured, skipping user creation');
      res.json({ success: true, user_id, created: false });
      return;
    }

    console.log(`[ensureUser] Checking user ${user_id}...`);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, created_at')
      .eq('id', user_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[ensureUser] Error checking user:', checkError);
      res.status(500).json({
        error: 'Failed to check user existence',
        message: checkError.message
      });
      return;
    }

    if (existingUser) {
      console.log(`[ensureUser] User ${user_id} already exists`);
      res.json({
        success: true,
        user_id,
        created: false,
        user: existingUser
      });
      return;
    }

    // User doesn't exist, fetch from auth.users
    console.log(`[ensureUser] User not found in public.users, fetching from auth...`);

    const { data: authUserData, error: authError } = await supabase.auth.admin.getUserById(user_id);

    if (authError) {
      console.error('[ensureUser] Error fetching auth user:', authError);
      res.status(500).json({
        error: 'Failed to fetch auth user',
        message: authError.message
      });
      return;
    }

    const authUser = authUserData.user;
    if (!authUser) {
      console.error('[ensureUser] Auth user not found');
      res.status(404).json({ error: 'Auth user not found' });
      return;
    }

    console.log(`[ensureUser] Found auth user, creating public.users record...`);

    // Create user in public.users
    const { data: newUser, error: insertError } = await supabase
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
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user_id)
          .single();

        res.json({
          success: true,
          user_id,
          created: false,
          user: existingUser
        });
        return;
      }

      console.error('[ensureUser] Error inserting user:', insertError);
      res.status(500).json({
        error: 'Failed to create user',
        message: insertError.message,
        code: insertError.code
      });
      return;
    }

    console.log(`[ensureUser] User ${user_id} created successfully`);
    res.json({
      success: true,
      user_id,
      created: true,
      user: newUser
    });

  } catch (err) {
    console.error('[ensureUser] Unexpected error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
