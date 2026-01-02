"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupabaseConfigured = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase credentials not found. Using in-memory storage.');
    console.warn('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}
// Create Supabase client with service role key for backend operations
// This bypasses Row Level Security (RLS) - use carefully!
exports.supabase = supabaseUrl && supabaseServiceKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;
const isSupabaseConfigured = () => exports.supabase !== null;
exports.isSupabaseConfigured = isSupabaseConfigured;
//# sourceMappingURL=supabase.js.map