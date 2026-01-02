# Changelog

All notable changes to Dossier AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.2.0] - 2025-12-30

### Added - Phase 2: Agent Pipeline (Major Update)

#### Backend Infrastructure
- Created GCP Cloud Run function template
  - Express server with TypeScript
  - Health check and API endpoints
  - Dockerfile for Cloud Run deployment
  - Environment configuration (.env.example)
- Set up Supabase with Docker Compose
  - PostgreSQL database with full schema
  - Users, drafts, and presentations tables
  - Proper indexes and triggers for updated_at
  - Migration files for version control

#### AI Agents Implementation
- **Pre-processor Agent** (`agents/preprocessor.ts`)
  - Validates and enhances user prompts
  - Rejects inappropriate/harmful content
  - Adds research-friendly context and structure
  - Few-shot examples for consistency
  - Retry logic for robustness
- **Research Agent** (`agents/research.ts`)
  - Brave Search API integration with fallback to mock data
  - Adaptive query generation (1 query for simple, 3 for complex topics)
  - Domain prioritization (.edu, .gov, reputable sources)
  - Structured data extraction (findings + frameworks)
  - Source citation with URLs and domains
- **Outline Agent** (`agents/outline.ts`)
  - Generates 8-12 slide outlines (flexible 5-20 range)
  - Strong, specific slide titles (no generic ones)
  - Assigns slide types (intro, content, data, quote, conclusion)
  - Flexible structure based on topic
  - JSON validation and retry logic

#### API Endpoints
- `POST /api/preprocess` - Validate and enhance prompts
- `POST /api/generate-outline` - Full pipeline (research + outline)
  - Orchestrates all 3 agents
  - Token usage tracking
  - Partial results on failure
  - Draft ID generation

#### Utilities
- Anthropic SDK integration (`utils/anthropic.ts`)
  - Claude Sonnet 4.5 configuration
  - Retry logic with exponential backoff
  - Token estimation utilities
- Brave Search utilities (`utils/brave-search.ts`)
  - API integration with error handling
  - Domain extraction and prioritization
  - Mock data fallback for development

#### Dependencies Added
- @anthropic-ai/sdk - Claude API client
- axios - HTTP requests for Brave Search
- uuid - Draft ID generation
- express, cors, dotenv - Server infrastructure
- TypeScript and type definitions

### Build Status
✅ Backend compiles successfully
✅ All agents implemented with proper error handling
✅ API endpoints tested and functional
✅ Database schema ready for deployment

## [0.1.0] - 2025-12-30

### Added - Phase 1: Foundation

#### Project Setup
- Created Next.js 14 project with App Router
- Configured TypeScript in strict mode
- Set up Tailwind CSS with custom design system
- Initialized shadcn/ui component library
- Created project structure (`frontend/` and `backend/` directories)

#### Dependencies Installed
- **UI Components:**
  - shadcn/ui (button, input, textarea, card, dialog)
  - lucide-react (icon library)

- **State Management:**
  - zustand (lightweight state management)

- **Interactions:**
  - framer-motion (subtle animations)
  - @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (drag-and-drop)

#### Documentation
- Created `overview.md` - Project overview and current status
- Created `architecture.md` - System architecture and data models
- Created `changelog.md` - This file
- Maintained `dossier_spec.md` - Comprehensive specification

#### Configuration
- TypeScript: strict mode enabled
- Import alias: `@/*` configured
- ESLint: Next.js recommended config
- Tailwind: v4 with shadcn/ui integration

#### State Management (Zustand)
- Created `store/types.ts` - Shared TypeScript types (Presentation, Draft, Outline, Slide, etc.)
- Created `store/presentation.ts` - Presentation state management
  - CRUD operations for presentations
  - Optimistic updates for slides, title, theme, citations
  - Auto-save with debouncing
- Created `store/draft.ts` - Draft/outline state management
  - Outline editing (add, remove, reorder slides)
  - Auto-save with 2.5s debounce
  - Drag-and-drop support
- Created `store/ui.ts` - UI state management
  - Presenter mode with keyboard navigation
  - Fullscreen control
  - Modal states
  - Slide navigation

#### Landing Page UI
- Created `app/page.tsx` - Main landing page
  - Apple/Tesla-level design sophistication
  - Gradient background with subtle decoration
  - Large, centered prompt input
  - Featured examples section
  - Clean feature showcase (3 columns)
- Created `components/landing/prompt-input.tsx` - Prompt input component
  - Auto-rotating placeholder prompts (5 variations, 3s interval)
  - Soft character limit validation (min 10 chars)
  - Keyboard shortcut support (⌘/Ctrl + Enter)
  - Loading states
- Created `components/landing/example-prompts.tsx` - Example prompts component
  - 4 pre-defined examples (Pitch, Sales, Training, Product Launch)
  - Clickable chips to populate prompt input
- Updated `app/layout.tsx`
  - Inter font integration
  - Updated metadata for SEO
  - OpenGraph tags

### Project Structure
```
dossier/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── landing/
│   │   │   ├── prompt-input.tsx
│   │   │   └── example-prompts.tsx
│   │   └── ui/                   # shadcn/ui components
│   ├── store/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── presentation.ts
│   │   ├── draft.ts
│   │   └── ui.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── package.json
│   └── tsconfig.json
├── backend/                      # Empty, ready for GCP Cloud Run
├── dossier_spec.md               # Comprehensive specification
├── architecture.md               # System architecture docs
├── changelog.md                  # This file
└── overview.md                   # Project overview
```

### In Progress
- Creating GCP Cloud Run function template

### Next Steps
- Complete GCP Cloud Run function template (hello world)
- Set up Supabase (local + cloud)

---

## Version History

### Phase 1: Foundation (Week 1) - IN PROGRESS
**Goal:** Set up project scaffolding and core dependencies

**Tasks:**
1. ✅ Next.js 14 project scaffold (App Router, TypeScript, Tailwind)
2. ✅ Install shadcn/ui components
3. ✅ Set up Zustand store structure
4. ✅ Landing page UI (minimal, prompt input, examples)
5. 🔨 GCP Cloud Run function template (hello world)
6. 📋 Supabase setup (local + cloud)

**Status:** 4/6 complete (67%)

---

## Legend
- ✅ Completed
- 🔨 In Progress
- 📋 Planned
- ⏸️ Paused
- ❌ Cancelled

---

Last updated: 2025-12-30
