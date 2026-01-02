"use strict";
// Presentation store with Supabase integration
// Handles CRUD operations for authenticated users
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentationStore = void 0;
const supabase_1 = require("../config/supabase");
// Ensure user exists in public.users table
async function ensureUserExists(userId) {
    if (!(0, supabase_1.isSupabaseConfigured)() || !supabase_1.supabase) {
        console.log('[ensureUserExists] Supabase not configured, skipping');
        return;
    }
    console.log(`[ensureUserExists] Processing user ${userId}`);
    try {
        // Get user info from auth.users
        const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.getUserById(userId);
        if (authError) {
            console.log(`[ensureUserExists] Auth lookup error:`, authError.message);
        }
        const email = authData?.user?.email || `user-${userId.slice(0, 8)}@placeholder.com`;
        const name = authData?.user?.user_metadata?.name || authData?.user?.user_metadata?.full_name || null;
        const avatarUrl = authData?.user?.user_metadata?.avatar_url || null;
        console.log(`[ensureUserExists] User info: email=${email}`);
        // Try upsert - this handles both insert and update
        const { error: upsertError } = await supabase_1.supabase
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
        }
        else {
            console.log(`[ensureUserExists] User ensured successfully`);
        }
    }
    catch (err) {
        console.error('[ensureUserExists] Unexpected error:', err);
    }
}
class PresentationStore {
    constructor() {
        this.presentations = new Map();
    }
    // Create presentation
    async create(presentation) {
        console.log(`[PresentationStore.create] Starting for user: ${presentation.user_id}`);
        const now = new Date().toISOString();
        const newPresentation = {
            ...presentation,
            created_at: now,
            updated_at: now,
        };
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            console.log(`[PresentationStore.create] Supabase configured, ensuring user exists...`);
            // Ensure user exists first
            await ensureUserExists(presentation.user_id);
            console.log(`[PresentationStore.create] User check complete, inserting presentation...`);
            const { data, error } = await supabase_1.supabase
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
            return data;
        }
        // Fallback to in-memory
        this.presentations.set(presentation.id, newPresentation);
        return newPresentation;
    }
    // Get presentation by ID
    async get(id, userId) {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            let query = supabase_1.supabase.from('presentations').select('*').eq('id', id);
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
            return data;
        }
        // Fallback to in-memory
        return this.presentations.get(id) || null;
    }
    // Get all presentations for a user
    async getAllForUser(userId) {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            const { data, error } = await supabase_1.supabase
                .from('presentations')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });
            if (error) {
                console.error('Supabase getAllForUser error:', error);
                throw new Error(`Failed to get presentations: ${error.message}`);
            }
            return data;
        }
        // Fallback to in-memory
        return Array.from(this.presentations.values())
            .filter((p) => p.user_id === userId)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    // Update presentation
    async update(id, updates, userId) {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            let query = supabase_1.supabase
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
            return data;
        }
        // Fallback to in-memory
        const existing = this.presentations.get(id);
        if (!existing)
            return null;
        // Check user permission in memory mode
        if (userId && existing.user_id !== userId) {
            return null;
        }
        const updated = {
            ...existing,
            ...updates,
            updated_at: new Date().toISOString(),
        };
        this.presentations.set(id, updated);
        return updated;
    }
    // Delete presentation
    async delete(id, userId) {
        // Use Supabase if configured
        if ((0, supabase_1.isSupabaseConfigured)() && supabase_1.supabase) {
            let query = supabase_1.supabase.from('presentations').delete().eq('id', id);
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
        if (!existing)
            return false;
        // Check user permission in memory mode
        if (userId && existing.user_id !== userId) {
            return false;
        }
        return this.presentations.delete(id);
    }
    // Duplicate presentation
    async duplicate(id, userId) {
        const original = await this.get(id, userId);
        if (!original)
            return null;
        const { v4: uuidv4 } = await Promise.resolve().then(() => __importStar(require('uuid')));
        const duplicated = {
            ...original,
            id: uuidv4(),
            title: `${original.title} (Copy)`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        return this.create(duplicated);
    }
    // Search presentations by title (for dashboard)
    async search(userId, query) {
        const all = await this.getAllForUser(userId);
        const lowerQuery = query.toLowerCase();
        return all.filter((p) => p.title.toLowerCase().includes(lowerQuery));
    }
}
// Singleton instance
exports.presentationStore = new PresentationStore();
//# sourceMappingURL=presentation-store.js.map