// Presentation store with Supabase integration
// Handles CRUD operations for authenticated users

import { Presentation } from '../types/presentation';
import { supabase, isSupabaseConfigured } from '../config/supabase';

// Ensure user exists in public.users table
async function ensureUserExists(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log('[ensureUserExists] Supabase not configured, skipping');
    return;
  }

  console.log(`[ensureUserExists] Processing user ${userId}`);

  try {
    // Get user info from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.log(`[ensureUserExists] Auth lookup error:`, authError.message);
    }
    
    const email = authData?.user?.email || `user-${userId.slice(0, 8)}@placeholder.com`;
    const name = authData?.user?.user_metadata?.name || authData?.user?.user_metadata?.full_name || null;
    const avatarUrl = authData?.user?.user_metadata?.avatar_url || null;
    
    console.log(`[ensureUserExists] User info: email=${email}`);

    // Try upsert - this handles both insert and update
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        name: name,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.log(`[ensureUserExists] Upsert error:`, upsertError.message, upsertError.code);
    } else {
      console.log(`[ensureUserExists] User ensured successfully`);
    }
  } catch (err) {
    console.error('[ensureUserExists] Unexpected error:', err);
  }
}

class PresentationStore {
  private presentations: Map<string, Presentation> = new Map();

  // Create presentation
  async create(presentation: Presentation): Promise<Presentation> {
    console.log(`[PresentationStore.create] Starting for user: ${presentation.user_id}`);
    
    const now = new Date().toISOString();

    const newPresentation: Presentation = {
      ...presentation,
      created_at: now,
      updated_at: now,
    };

    // Use Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      console.log(`[PresentationStore.create] Supabase configured, ensuring user exists...`);
      // Ensure user exists first
      await ensureUserExists(presentation.user_id);
      console.log(`[PresentationStore.create] User check complete, inserting presentation...`);

      const { data, error } = await supabase
        .from('presentations')
        .insert({
          id: newPresentation.id,
          user_id: newPresentation.user_id,
          title: newPresentation.title,
          prompt: newPresentation.prompt,
          enhanced_prompt: newPresentation.enhanced_prompt,
          outline: newPresentation.outline,
          slides: newPresentation.slides,
          citation_style: newPresentation.citation_style,
          theme: newPresentation.theme,
          status: newPresentation.status,
          error_message: newPresentation.error_message,
          token_usage: newPresentation.token_usage,
          created_at: newPresentation.created_at,
          updated_at: newPresentation.updated_at,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to create presentation: ${error.message}`);
      }

      return data as Presentation;
    }

    // Fallback to in-memory
    this.presentations.set(presentation.id, newPresentation);
    return newPresentation;
  }

  // Get presentation by ID
  async get(id: string, userId?: string): Promise<Presentation | null> {
    // Use Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('presentations').select('*').eq('id', id);

      // If userId provided, filter by user (for RLS compliance)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Supabase get error:', error);
        throw new Error(`Failed to get presentation: ${error.message}`);
      }

      return data as Presentation;
    }

    // Fallback to in-memory
    return this.presentations.get(id) || null;
  }

  // Get all presentations for a user
  async getAllForUser(userId: string): Promise<Presentation[]> {
    // Use Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase getAllForUser error:', error);
        throw new Error(`Failed to get presentations: ${error.message}`);
      }

      return data as Presentation[];
    }

    // Fallback to in-memory
    return Array.from(this.presentations.values())
      .filter((p) => p.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  // Update presentation
  async update(
    id: string,
    updates: Partial<Presentation>,
    userId?: string
  ): Promise<Presentation | null> {
    // Use Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('presentations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      // If userId provided, filter by user (for RLS compliance)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Supabase update error:', error);
        throw new Error(`Failed to update presentation: ${error.message}`);
      }

      return data as Presentation;
    }

    // Fallback to in-memory
    const existing = this.presentations.get(id);
    if (!existing) return null;

    // Check user permission in memory mode
    if (userId && existing.user_id !== userId) {
      return null;
    }

    const updated: Presentation = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.presentations.set(id, updated);
    return updated;
  }

  // Delete presentation
  async delete(id: string, userId?: string): Promise<boolean> {
    // Use Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('presentations').delete().eq('id', id);

      // If userId provided, filter by user (for RLS compliance)
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete presentation: ${error.message}`);
      }

      return true;
    }

    // Fallback to in-memory
    const existing = this.presentations.get(id);
    if (!existing) return false;

    // Check user permission in memory mode
    if (userId && existing.user_id !== userId) {
      return false;
    }

    return this.presentations.delete(id);
  }

  // Duplicate presentation
  async duplicate(id: string, userId: string): Promise<Presentation | null> {
    const original = await this.get(id, userId);
    if (!original) return null;

    const { v4: uuidv4 } = await import('uuid');
    const duplicated: Presentation = {
      ...original,
      id: uuidv4(),
      title: `${original.title} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return this.create(duplicated);
  }

  // Search presentations by title (for dashboard)
  async search(userId: string, query: string): Promise<Presentation[]> {
    const all = await this.getAllForUser(userId);
    const lowerQuery = query.toLowerCase();

    return all.filter((p) => p.title.toLowerCase().includes(lowerQuery));
  }
}

// Singleton instance
export const presentationStore = new PresentationStore();
