const express = require('express');

const app = express();

// Manual CORS middleware
const corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '*' : '*');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

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
const { handlePreprocess } = require('../dist/api/preprocess');
const { handleGenerateOutline } = require('../dist/api/generate-outline');
const { handleCreateDraft, handleUpdateDraft, handleGetDraft, handleDeleteDraft, handleGetAllDrafts } = require('../dist/api/drafts');
const { handleGeneratePresentation, handleGetPresentation, handleGetAllPresentations, handleUpdatePresentation, handleDeletePresentation, handleDuplicatePresentation } = require('../dist/api/presentations');
const { handleEnsureUser } = require('../dist/api/users');

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

module.exports = app;
