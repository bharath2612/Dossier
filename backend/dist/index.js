"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables with explicit path
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Middleware
app.use(express_1.default.json());
// CORS Middleware - MUST be before routes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});
// Request logging middleware
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'dossier-backend',
        version: '0.1.0',
    });
});
// Hello World endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'Dossier AI Backend - GCP Cloud Run Functions',
        endpoints: [
            'GET /health - Health check',
            'POST /api/preprocess - Validate and enhance prompt',
            'POST /api/generate-outline - Generate outline from prompt',
            'POST /api/drafts - Create draft',
            'PATCH /api/drafts/:id - Update draft',
            'GET /api/drafts/:id - Get draft',
            'DELETE /api/drafts/:id - Delete draft',
            'GET /api/drafts - Get all drafts',
            'POST /api/generate-presentation - Generate full presentation',
            'GET /api/presentations/:id - Get presentation',
            'GET /api/presentations - Get all presentations for user',
            'PATCH /api/presentations/:id - Update presentation',
            'DELETE /api/presentations/:id - Delete presentation',
            'POST /api/presentations/:id/duplicate - Duplicate presentation',
            'POST /api/users/ensure - Ensure user exists in public.users',
        ],
        status: 'ready',
    });
});
// Import API handlers
const preprocess_1 = require("./api/preprocess");
const generate_outline_1 = require("./api/generate-outline");
const drafts_1 = require("./api/drafts");
const presentations_1 = require("./api/presentations");
const users_1 = require("./api/users");
// API Routes
app.post('/api/preprocess', preprocess_1.handlePreprocess);
app.post('/api/generate-outline', generate_outline_1.handleGenerateOutline);
// Draft endpoints
app.post('/api/drafts', drafts_1.handleCreateDraft);
app.patch('/api/drafts/:id', drafts_1.handleUpdateDraft);
app.get('/api/drafts/:id', drafts_1.handleGetDraft);
app.delete('/api/drafts/:id', drafts_1.handleDeleteDraft);
app.get('/api/drafts', drafts_1.handleGetAllDrafts);
// Presentation endpoints
app.post('/api/generate-presentation', presentations_1.handleGeneratePresentation);
app.get('/api/presentations/:id', presentations_1.handleGetPresentation);
app.get('/api/presentations', presentations_1.handleGetAllPresentations);
app.patch('/api/presentations/:id', presentations_1.handleUpdatePresentation);
app.delete('/api/presentations/:id', presentations_1.handleDeletePresentation);
app.post('/api/presentations/:id/duplicate', presentations_1.handleDuplicatePresentation);
// User endpoints
app.post('/api/users/ensure', users_1.handleEnsureUser);
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});
// Start server (only in non-serverless environment)
if (!process.env.VERCEL) {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Dossier AI Backend running on port ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    // Graceful shutdown
    process.on('SIGTERM', () => {
        server.close(() => {
            console.log('Server closed');
        });
    });
}
// Export for Vercel - both ES6 and CommonJS
exports.default = app;
module.exports = app;
//# sourceMappingURL=index.js.map