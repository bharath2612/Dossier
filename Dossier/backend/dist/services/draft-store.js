"use strict";
// Draft store with Supabase integration
// Falls back to in-memory storage if Supabase is not configured
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftStore = void 0;
const supabase_1 = require("../config/supabase");
class DraftStore {
    constructor() {
        this.drafts = new Map();
    }
    // Create or update draft
    async save(draft) {
        const now = new Date().toISOString();
        const savedDraft = {
            ...draft,
            updated_at: now,
            created_at: draft.created_at || now,
        };
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { data, error } = await supabase_1.supabase
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
            return data;
        }
        // Fallback to in-memory
        this.drafts.set(draft.id, savedDraft);
        return savedDraft;
    }
    // Get draft by ID
    async get(id) {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { data, error } = await supabase_1.supabase
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
            return data;
        }
        // Fallback to in-memory
        return this.drafts.get(id) || null;
    }
    // Delete draft
    async delete(id) {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { error } = await supabase_1.supabase.from('drafts').delete().eq('id', id);
            if (error) {
                console.error('Supabase delete error:', error);
                throw new Error(`Failed to delete draft: ${error.message}`);
            }
            return true;
        }
        // Fallback to in-memory
        return this.drafts.delete(id);
    }
    // Update outline only (for auto-save)
    async updateOutline(id, outline) {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { data, error } = await supabase_1.supabase
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
            return data;
        }
        // Fallback to in-memory
        const draft = this.drafts.get(id);
        if (!draft)
            return null;
        const updatedDraft = {
            ...draft,
            outline,
            updated_at: new Date().toISOString(),
        };
        this.drafts.set(id, updatedDraft);
        return updatedDraft;
    }
    // Get all drafts (for future dashboard)
    async getAll() {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { data, error } = await supabase_1.supabase
                .from('drafts')
                .select('*')
                .order('updated_at', { ascending: false });
            if (error) {
                console.error('Supabase getAll error:', error);
                throw new Error(`Failed to get drafts: ${error.message}`);
            }
            return data;
        }
        // Fallback to in-memory
        return Array.from(this.drafts.values()).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    // Clear all drafts (for testing)
    async clear() {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { error } = await supabase_1.supabase.from('drafts').delete().neq('id', '');
            if (error) {
                console.error('Supabase clear error:', error);
                throw new Error(`Failed to clear drafts: ${error.message}`);
            }
            return;
        }
        // Fallback to in-memory
        this.drafts.clear();
    }
}
// Singleton instance
exports.draftStore = new DraftStore();
//# sourceMappingURL=draft-store.js.map