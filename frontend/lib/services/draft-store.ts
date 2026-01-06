// Draft store with Supabase integration
// Falls back to in-memory storage if Supabase is not configured

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface Draft {
  id: string;
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
  created_at: string;
  updated_at: string;
}

interface Outline {
  title: string;
  slides: Array<{
    index: number;
    title: string;
    bullets: string[];
    type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
  }>;
}

class DraftStore {
  private drafts: Map<string, Draft> = new Map();

  // Create or update draft
  async save(draft: Draft): Promise<Draft> {
    const now = new Date().toISOString();

    const savedDraft: Draft = {
      ...draft,
      updated_at: now,
      created_at: draft.created_at || now,
    };

    // Use Supabase if configured
    // Use admin client to bypass RLS (drafts table requires service_role for INSERT/UPDATE)
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }
      
      const { data, error } = await supabaseAdmin
        .from('drafts')
        .upsert({
          id: savedDraft.id,
          title: savedDraft.title,
          prompt: savedDraft.prompt,
          enhanced_prompt: savedDraft.enhanced_prompt,
          outline: savedDraft.outline,
          created_at: savedDraft.created_at,
          updated_at: savedDraft.updated_at,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase save error:', error);
        throw new Error(`Failed to save draft: ${error.message}`);
      }

      return data as Draft;
    } catch (error) {
      // Fallback to in-memory if Supabase fails or not configured
      console.warn('Falling back to in-memory storage:', error);
      this.drafts.set(draft.id, savedDraft);
      return savedDraft;
    }
  }

  // Get draft by ID
  async get(id: string): Promise<Draft | null> {
    // Use Supabase if configured
    try {
      const supabase = await createServerSupabaseClient();
      
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Supabase get error:', error);
        throw new Error(`Failed to get draft: ${error.message}`);
      }

      return data as Draft;
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      return this.drafts.get(id) || null;
    }
  }

  // Delete draft
  async delete(id: string): Promise<boolean> {
    // Use Supabase if configured
    // Use admin client to bypass RLS for DELETE
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }
      
      const { error } = await supabaseAdmin.from('drafts').delete().eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Failed to delete draft: ${error.message}`);
      }

      return true;
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      return this.drafts.delete(id);
    }
  }

  // Update outline only (for auto-save)
  async updateOutline(id: string, outline: Outline): Promise<Draft | null> {
    // Use Supabase if configured
    // Use admin client to bypass RLS for UPDATE
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }
      
      const { data, error } = await supabaseAdmin
        .from('drafts')
        .update({
          outline,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        console.error('Supabase update error:', error);
        throw new Error(`Failed to update draft: ${error.message}`);
      }

      return data as Draft;
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      const draft = this.drafts.get(id);
      if (!draft) return null;

      const updatedDraft: Draft = {
        ...draft,
        outline,
        updated_at: new Date().toISOString(),
      };

      this.drafts.set(id, updatedDraft);
      return updatedDraft;
    }
  }

  // Get all drafts (for future dashboard)
  async getAll(): Promise<Draft[]> {
    // Use Supabase if configured
    try {
      const supabase = await createServerSupabaseClient();
      
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase getAll error:', error);
        throw new Error(`Failed to get drafts: ${error.message}`);
      }

      return data as Draft[];
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      return Array.from(this.drafts.values()).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }
  }

  // Clear all drafts (for testing)
  async clear(): Promise<void> {
    // Use Supabase if configured
    // Use admin client to bypass RLS for DELETE
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured');
      }
      
      const { error } = await supabaseAdmin.from('drafts').delete().neq('id', '');

      if (error) {
        console.error('Supabase clear error:', error);
        throw new Error(`Failed to clear drafts: ${error.message}`);
      }

      return;
    } catch (error) {
      // Fallback to in-memory
      console.warn('Falling back to in-memory storage:', error);
      this.drafts.clear();
    }
  }
}

// Export singleton instance
export const draftStore = new DraftStore();
export type { Draft, Outline };

