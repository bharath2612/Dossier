# Dossier AI - Project Overview

## What is Dossier AI?

Dossier AI is a research-backed AI presentation generator that creates professional, Chronicle-level designed slides with non-generic, cited content in under 5 minutes.

## Core Value Proposition

Transform a simple prompt into a fully-researched, well-structured, beautifully designed presentation with minimal effort.

## Key Features (MVP)

### 1. Intelligent Research
- Web search integration (Brave/Serper API)
- Prioritizes reputable sources (.edu, .gov, major publications)
- Adaptive search: 1 query for simple topics, 3 for complex ones

### 2. Smart Outline Generation
- AI-powered outline with 8-12 slides (flexible 5-20 range)
- Editable with drag-and-drop reordering
- Live preview as you edit
- Auto-save with 2-3 second debounce

### 3. Full Presentation Generation
- Progressive disclosure (see slides as they're created)
- Multiple citation styles (inline, footnote, speaker notes only)
- 5 slide types with unique layouts (intro, content, data, quote, conclusion)
- Concise speaker notes (2-3 points per slide)

### 4. Presenter Mode
- Full keyboard navigation (arrows, number keys, escape)
- Instant transitions (no animations)
- Collapsible speaker notes
- Clean, distraction-free fullscreen

### 5. Sharing & Export
- Public sharing via read-only links
- PDF export (Puppeteer-rendered)
- Social media cards (Vercel OG)
- Duplicate presentations

## User Flow

```
1. User enters prompt (no auth)
   ↓
2. Pre-processor enhances prompt (show for approval)
   ↓
3. Research + Outline generation (10s)
   ↓
4. User edits outline (drag-and-drop, inline editing)
   ↓
5. User clicks "Generate" → Auth gate (Google sign-in)
   ↓
6. Full presentation generation (30s)
   ↓
7. Present, edit, share, or export PDF
```

## Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **shadcn/ui** (component library)
- **Zustand** (state management)
- **dnd-kit** (drag-and-drop)
- **Framer Motion** (subtle animations)

### Backend
- **GCP Cloud Run Functions** (API + AI orchestration)
- **Supabase** (Postgres + Auth)
- **Claude Sonnet 4.5** (all AI agents)
- **Brave Search API** (web research)

### Infrastructure
- **Vercel** (frontend deployment)
- **GCP Cloud Run** (backend functions)
- **GCP Secret Manager** (secrets)
- **Cloudflare** (rate limiting + CAPTCHA)

## Design Philosophy

**Apple/Tesla-level sophistication:**
- Modern, clean typography (Inter/SF Pro)
- Generous whitespace
- Minimal UI chrome
- Smooth, subtle interactions
- Focus on content quality

## Current Status

**Phase:** Agent Pipeline (Phase 2) - 83% Complete
**Started:** 2025-12-30
**Last Updated:** 2025-12-30

### Phase 1: Foundation ✅ COMPLETE
✅ Next.js 14 project scaffold
✅ shadcn/ui components (5 components)
✅ Zustand store structure (3 stores)
✅ Landing page UI (Apple/Tesla-level design)
✅ GCP Cloud Run function template
✅ Supabase setup with Docker Compose
✅ Documentation (3 files)

### Phase 2: Agent Pipeline 🔨 IN PROGRESS (5/6 tasks complete)
✅ Pre-processor Agent - Validates and enhances prompts
✅ Brave Search API integration - Adaptive queries, domain prioritization
✅ Research Agent - Structured data extraction with citations
✅ Outline Agent - 8-12 slide outlines with strong titles
✅ `/api/generate-outline` endpoint - Full pipeline orchestration

### In Progress
🔨 Progressive disclosure UI (streaming slides)

### Next Up
📋 Phase 3: Outline Editing (drag-and-drop, inline editing)
📋 Phase 4: Auth & Full Generation (Google OAuth, Slide Generator)

## Project Structure

```
dossier/
├── frontend/              # Next.js app
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Custom components
│   ├── lib/             # Utilities
│   └── store/           # Zustand stores
├── backend/              # GCP Cloud Run functions
│   ├── src/
│   │   ├── agents/      # AI agent implementations
│   │   └── api/         # API endpoints
│   └── ...
├── dossier_spec.md       # Full specification
├── architecture.md       # Architecture documentation
├── changelog.md          # Change log
└── overview.md           # This file
```

## Success Metrics (Post-Launch)

- Outline generation success rate: >95%
- Full presentation completion: >90%
- Average generation time: <25s
- User retention (7-day): >40%
- Token cost per presentation: <$0.50

## Development Guidelines

1. Follow the spec strictly - don't add features outside the document
2. Build incrementally, one feature at a time
3. Test each feature before moving to the next
4. Prioritize design sophistication in all UI work
5. Maintain documentation (changelog, architecture)

---

Last updated: 2025-12-30
