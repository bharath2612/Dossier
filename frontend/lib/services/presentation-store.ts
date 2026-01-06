// Presentation store with Supabase integration
// Handles CRUD operations for authenticated users

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

interface Presentation {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  enhanced_prompt?: string;
  outline: {
    title: string;
    slides: Array<{
      index: number;
      title: string;
      bullets: string[];
      type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
    }>;
  };
  slides: Array<{
    index: number;
    title: string;
    body: string[];
    speakerNotes: string[];
    visualHint?: string;
    citations?: Array<{
      text: string;
      source: {
        title: string;
        url: string;
        domain: string;
        date?: string;
      };
    }>;
    type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
  }>;
  citation_style: 'inline' | 'footnote' | 'speaker_notes';
  theme: 'minimal' | 'corporate' | 'bold' | 'modern' | 'classic';
  status: 'generating' | 'completed' | 'failed';
  error_message?: string;
  token_usage?: {
    preprocessor: number;
    research: number;
    outline: number;
    slides: number;
    total: number;
  };
  created_at: string;
  updated_at: string;
}

// Ensure user exists in public.users table
async function ensureUserExists(userId: string): Promise<void> {
  try {
    if (!supabaseAdmin) {
      console.warn('[ensureUserExists] Supabase admin not configured, skipping');
      return;
    }
    
    // Get user info from auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError) {
      console.log(`[ensureUserExists] Auth lookup error:`, authError.message);
    }
    
    const email = authData?.user?.email || `user-${userId.slice(0, 8)}@placeholder.com`;
    const name = authData?.user?.user_metadata?.name || authData?.user?.user_metadata?.full_name || null;
    const avatarUrl = authData?.user?.user_metadata?.avatar_url || null;
    
    console.log(`[ensureUserExists] User info: email=${email}`);

    // Try upsert - this handles both insert and update
    const { error: upsertError } = await supabaseAdmin!
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
    try {
      const supabase = await createServerSupabaseClient();
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
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      this.presentations.set(presentation.id, newPresentation);
      return newPresentation;
    }
  }

  // Get presentation by ID
  async get(id: string, userId?: string): Promise<Presentation | null> {
    // Use Supabase if configured
    try {
      const supabase = await createServerSupabaseClient();
      
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
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      return this.presentations.get(id) || null;
    }
  }

  // Get all presentations for a user
  async getAllForUser(userId: string): Promise<Presentation[]> {
    // Use Supabase if configured
    try {
      const supabase = await createServerSupabaseClient();
      
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
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      return Array.from(this.presentations.values())
        .filter((p) => p.user_id === userId)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
  }

  // Update presentation
  async update(
    id: string,
    updates: Partial<Presentation>,
    userId?: string
  ): Promise<Presentation | null> {
    // Use Supabase if configured
    try {
      const supabase = await createServerSupabaseClient();
      
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
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
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
  }

  // Delete presentation
  async delete(id: string, userId?: string): Promise<boolean> {
    // Use Supabase if configured
    try {
      const supabase = await createServerSupabaseClient();
      
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
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      const existing = this.presentations.get(id);
      if (!existing) return false;

      // Check user permission in memory mode
      if (userId && existing.user_id !== userId) {
        return false;
      }

      return this.presentations.delete(id);
    }
  }

  // Duplicate presentation
  async duplicate(id: string, userId: string): Promise<Presentation | null> {
    const original = await this.get(id, userId);
    if (!original) return null;

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
export type { Presentation };

