const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS
app.use(cors({
  origin: 'https://beautiful-pptx.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'dossier-backend',
    version: '0.1.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Dossier AI Backend',
    status: 'ready'
  });
});

// Import handlers
const { handlePreprocess } = require('./dist/api/preprocess');
const { handleGenerateOutline } = require('./dist/api/generate-outline');
const { handleCreateDraft, handleUpdateDraft, handleGetDraft, handleDeleteDraft, handleGetAllDrafts } = require('./dist/api/drafts');
const { handleGeneratePresentation, handleGetPresentation, handleGetAllPresentations, handleUpdatePresentation, handleDeletePresentation, handleDuplicatePresentation } = require('./dist/api/presentations');
const { handleEnsureUser } = require('./dist/api/users');

// Routes
app.post('/api/preprocess', handlePreprocess);
app.post('/api/generate-outline', handleGenerateOutline);
app.post('/api/drafts', handleCreateDraft);
app.patch('/api/drafts/:id', handleUpdateDraft);
app.get('/api/drafts/:id', handleGetDraft);
app.delete('/api/drafts/:id', handleDeleteDraft);
app.get('/api/drafts', handleGetAllDrafts);
app.post('/api/generate-presentation', handleGeneratePresentation);
app.get('/api/presentations/:id', handleGetPresentation);
app.get('/api/presentations', handleGetAllPresentations);
app.patch('/api/presentations/:id', handleUpdatePresentation);
app.delete('/api/presentations/:id', handleDeletePresentation);
app.post('/api/presentations/:id/duplicate', handleDuplicatePresentation);
app.post('/api/users/ensure', handleEnsureUser);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message, err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dossier AI Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

