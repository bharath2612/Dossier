import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// CORS Middleware - MUST be before routes
const corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '*' : '*');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
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
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'dossier-backend',
    version: '0.1.0',
  });
});

// Hello World endpoint
app.get('/', (_req: Request, res: Response) => {
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
      'GET /api/presentations/:id/stream - SSE stream for presentation status',
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
import { handlePreprocess } from './api/preprocess';
import { handleGenerateOutline } from './api/generate-outline';
import {
  handleCreateDraft,
  handleUpdateDraft,
  handleGetDraft,
  handleDeleteDraft,
  handleGetAllDrafts,
} from './api/drafts';
import {
  handleGeneratePresentation,
  handleGetPresentation,
  handleGetAllPresentations,
  handleUpdatePresentation,
  handleDeletePresentation,
  handleDuplicatePresentation,
  handlePresentationStream,
} from './api/presentations';
import { handleEnsureUser } from './api/users';

// API Routes
app.post('/api/preprocess', handlePreprocess);
app.post('/api/generate-outline', handleGenerateOutline);

// Draft endpoints
app.post('/api/drafts', handleCreateDraft);
app.patch('/api/drafts/:id', handleUpdateDraft);
app.get('/api/drafts/:id', handleGetDraft);
app.delete('/api/drafts/:id', handleDeleteDraft);
app.get('/api/drafts', handleGetAllDrafts);

// Presentation endpoints
app.post('/api/generate-presentation', handleGeneratePresentation);
app.get('/api/presentations/:id/stream', handlePresentationStream); // SSE endpoint
app.get('/api/presentations/:id', handleGetPresentation);
app.get('/api/presentations', handleGetAllPresentations);
app.patch('/api/presentations/:id', handleUpdatePresentation);
app.delete('/api/presentations/:id', handleDeletePresentation);
app.post('/api/presentations/:id/duplicate', handleDuplicatePresentation);

// User endpoints
app.post('/api/users/ensure', handleEnsureUser);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
export default app;
module.exports = app;
