# Dossier AI - Architecture Documentation

## System Architecture Overview

Dossier AI is a full-stack application that generates research-backed AI presentations. The system consists of a Next.js frontend, an Express.js backend API, and integrates with Supabase for data persistence and authentication, Anthropic Claude for AI processing, and Brave Search for web research.

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js 16 App Router)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages & Routes                                       │   │
│  │  - Landing Page (/)                                  │   │
│  │  - Outline Editor (/outline)                        │   │
│  │  - Presentation Viewer/Editor (/presentation/[id])   │   │
│  │  - Dashboard (/dashboard)                           │   │
│  │  - Share Page (/share/[id])                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (Zustand)                          │   │
│  │  - Presentation Store (store/presentation.ts)       │   │
│  │  - Draft Store (store/draft.ts)                     │   │
│  │  - UI Store (store/ui.ts)                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Route Handlers (app/api/)                       │   │
│  │  - Proxy requests to backend Express API            │   │
│  │  - Handle authentication via Supabase               │   │
│  │  - Server-Sent Events (SSE) for streaming          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Client Libraries (lib/)                             │   │
│  │  - API Client (lib/api/client.ts)                    │   │
│  │  - Supabase Client (lib/supabase/)                   │   │
│  │  - Agent Utilities (lib/agents/)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express.js API Server)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Endpoints (src/api/)                            │   │
│  │  - POST /api/preprocess                              │   │
│  │  - POST /api/generate-outline                        │   │
│  │  - POST /api/generate-presentation                   │   │
│  │  - GET /api/presentations/:id/stream (SSE)          │   │
│  │  - CRUD: drafts, presentations, users                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Agents (src/agents/)                             │   │
│  │  1. Pre-processor Agent → validates/enhances prompt │   │
│  │  2. Research Agent → web search (Brave API)         │   │
│  │  3. Outline Agent → generates slide outline          │   │
│  │  4. Slide Generator Agent → full content             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services (src/services/)                             │   │
│  │  - Draft Store (draft-store.ts)                      │   │
│  │  - Presentation Store (presentation-store.ts)         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Utilities (src/utils/)                               │   │
│  │  - Anthropic Client (anthropic.ts)                   │   │
│  │  - Brave Search Client (brave-search.ts)             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┬─────────────┐
         ↓             ↓             ↓             ↓
   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Supabase │  │  Claude  │  │  Brave   │  │   GCP    │
   │ Postgres │  │  Sonnet  │  │  Search  │  │  Secret  │
   │   Auth   │  │   4.5    │  │   API    │  │  Manager │
   └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## Technology Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript (strict mode)
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui (Radix UI primitives)
- **State Management:** Zustand 5.0.9
- **Drag & Drop:** @dnd-kit
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **PDF Export:** jsPDF + html2canvas

### Backend
- **Runtime:** Node.js >= 18.0.0
- **Framework:** Express.js 5.2.1
- **Language:** TypeScript
- **AI SDK:** @anthropic-ai/sdk 0.71.2
- **Database Client:** @supabase/supabase-js 2.89.0
- **HTTP Client:** Axios 1.13.2
- **CORS:** cors 2.8.5

### Infrastructure
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **AI Provider:** Anthropic Claude Sonnet 4.5
- **Search API:** Brave Search API
- **Secrets:** GCP Secret Manager
- **Deployment:** 
  - Frontend: Vercel
  - Backend: GCP Cloud Run (or Express server)

## Data Flow

### 1. Prompt to Outline Generation
```
User Input (Frontend)
  ↓
POST /api/preprocess (Backend)
  → Pre-processor Agent (validates + enhances prompt)
  → Returns enhanced prompt
  ↓
User Approval (Frontend)
  ↓
POST /api/generate-outline (Backend)
  → Research Agent (Brave Search API)
  → Outline Agent (generates slide structure)
  → Save to drafts table (Supabase)
  → Return outline to Frontend
  ↓
Outline Editor (Frontend - Zustand Draft Store)
```

### 2. Outline to Full Presentation
```
User confirms outline (Frontend)
  ↓
Google OAuth check (Supabase Auth)
  ↓
POST /api/generate-presentation (Backend)
  → Slide Generator Agent (expands outline to full slides)
  → Save to presentations table (Supabase)
  → Stream progress via SSE
  ↓
Presentation Viewer (Frontend - Zustand Presentation Store)
```

### 3. Presentation Editing & Auto-Save
```
User edits slide (Frontend)
  ↓
Update Zustand Presentation Store (optimistic update)
  ↓
Debounce (2-3 seconds)
  ↓
PATCH /api/presentations/:id (Backend)
  ↓
Update Supabase presentations table
  ↓
Confirm save to UI
```

## Database Schema

### Tables

#### users
Stores user information from Google OAuth authentication.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  google_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### drafts
Stores outline drafts (pre-authentication, anonymous).

```sql
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500),
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  outline JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### presentations
Stores complete presentations (post-authentication).

```sql
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  outline JSONB NOT NULL,
  slides JSONB NOT NULL,
  citation_style VARCHAR(50) DEFAULT 'inline',
  theme VARCHAR(50) DEFAULT 'minimal',
  status VARCHAR(50) DEFAULT 'completed',
  token_usage JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_presentations_created_at ON presentations(created_at DESC);
```

## AI Agent Architecture

### Agent Communication Pattern
All agents use a consistent pattern:
- **System Prompt:** Defines role and guidelines
- **Few-shot Examples:** Provides context for expected output
- **User Message:** Contains the actual input
- **Response Parsing:** Validates and extracts structured data

### 1. Pre-processor Agent
**Location:** `backend/src/agents/preprocessor.ts`

**Purpose:** Validate and enhance user prompts before research

**Input:** Raw user prompt (string)

**Output:** Enhanced prompt OR validation error

**Responsibilities:**
- Validate inappropriate/off-topic prompts
- Expand vague prompts with research context
- Clarify ambiguous language
- Add structure cues for downstream agents

**Token Budget:** ~100-200 tokens

**Timeout:** 3 seconds

**Error Handling:**
- Invalid prompts: return clear error with suggestions
- Malformed output: retry once with error context

### 2. Research Agent
**Location:** `backend/src/agents/research.ts`

**Purpose:** Find high-quality, cited research via web search

**Input:** Enhanced prompt from Pre-processor

**Output:** Structured research JSON with findings and sources

**Responsibilities:**
- Generate 1-3 search queries (adaptive based on topic complexity)
- Execute Brave Search API calls
- Filter and prioritize reputable domains (.edu, .gov, major publications)
- Extract stats, frameworks, examples, quotes
- Structure findings as bullet points

**Token Budget:** ~200-300 tokens per finding

**Timeout:** 10 seconds

**Error Handling:**
- API rate limit: show partial results with clear error
- API unavailable: fall back to Claude's base knowledge
- Invalid search results: retry once with refined query

### 3. Outline Agent
**Location:** `backend/src/agents/outline.ts`

**Purpose:** Convert research into structured slide outline

**Input:** Research JSON from Research Agent

**Output:** Slide outline with 8-12 slides (flexible 5-20 range)

**Responsibilities:**
- Generate strong, specific slide titles (no generic ones)
- Assign slide types: intro, content, data, quote, conclusion
- Structure: flexible based on topic (not rigid template)
- Bullet points for each slide (2-4 bullets)

**Token Budget:** ~800-1000 tokens

**Timeout:** 10 seconds

**Error Handling:**
- Malformed JSON: retry once with validation error
- Second failure: return partial results if possible

### 4. Slide Generator Agent
**Location:** `backend/src/agents/slide-generator.ts`

**Purpose:** Expand outline into full presentation content

**Input:** Confirmed outline (user-edited)

**Output:** Complete slide deck with speaker notes

**Responsibilities:**
- Expand bullets into full slide content (3-4 bullets max per slide)
- Add concise speaker notes (2-3 bullet points per slide)
- Generate visual hints (stored, not rendered in MVP)
- Cite sources based on user preference (inline, footnote, or speaker notes only)
- Adapt layout based on slide type

**Token Budget:** ~2000-3000 tokens

**Timeout:** 30 seconds

**Error Handling:**
- Malformed JSON: retry once with validation error
- Discard all progress on failure (no partial saves)

**Streaming:** Progressive disclosure at slide level via Server-Sent Events (SSE)

## State Management (Zustand)

### Presentation Store
**Location:** `frontend/store/presentation.ts`

Manages the current presentation state, editing, and persistence.

```typescript
interface PresentationStore {
  // State
  currentPresentation: Presentation | null;
  presentations: Presentation[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  userId: string | null;

  // Actions
  setCurrentPresentation: (p: Presentation | null) => void;
  updateSlide: (slideIndex: number, updates: Partial<Slide>) => Promise<void>;
  updateTitle: (title: string) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setCitationStyle: (style: CitationStyle) => Promise<void>;
  savePresentation: () => Promise<void>;
  fetchPresentations: () => Promise<void>;
  fetchPresentation: (id: string) => Promise<void>;
  duplicatePresentation: (id: string) => Promise<void>;
  deletePresentation: (id: string) => Promise<void>;
}
```

**Auto-save:** Debounced (2-3 seconds) after any edit

### Draft Store
**Location:** `frontend/store/draft.ts`

Manages outline editing state before full presentation generation.

```typescript
interface DraftStore {
  currentDraft: Draft | null;
  outline: Outline | null;
  isGenerating: boolean;
  progress: number;

  // Actions
  setOutline: (outline: Outline) => void;
  updateOutlineSlide: (index: number, updates: Partial<OutlineSlide>) => void;
  reorderSlides: (oldIndex: number, newIndex: number) => void;
  addSlide: (afterIndex: number) => void;
  removeSlide: (index: number) => void;
  saveDraft: () => Promise<void>;
}
```

### UI Store
**Location:** `frontend/store/ui.ts`

Manages UI state for presentation viewing and navigation.

```typescript
interface UIStore {
  isPresenterMode: boolean;
  currentSlideIndex: number;
  showSpeakerNotes: boolean;
  isFullscreen: boolean;

  // Actions
  setPresenterMode: (enabled: boolean) => void;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  toggleSpeakerNotes: () => void;
  toggleFullscreen: () => void;
}
```

## API Endpoints

### Backend API (Express Server)

#### Prompt Processing
- `POST /api/preprocess` - Validate and enhance user prompt
- `POST /api/generate-outline` - Generate research + outline

#### Drafts Management
- `POST /api/drafts` - Create draft
- `GET /api/drafts/:id` - Get draft
- `GET /api/drafts` - Get all drafts
- `PATCH /api/drafts/:id` - Update draft
- `DELETE /api/drafts/:id` - Delete draft

#### Presentations Management
- `POST /api/generate-presentation` - Generate full presentation
- `GET /api/presentations/:id` - Get presentation
- `GET /api/presentations` - Get all presentations for user
- `GET /api/presentations/:id/stream` - SSE stream for presentation status
- `PATCH /api/presentations/:id` - Update presentation
- `DELETE /api/presentations/:id` - Delete presentation
- `POST /api/presentations/:id/duplicate` - Duplicate presentation

#### Users
- `POST /api/users/ensure` - Ensure user exists in database

#### Health
- `GET /health` - Health check endpoint
- `GET /` - API information endpoint

### Frontend API Routes (Next.js)
**Location:** `frontend/app/api/`

The frontend includes Next.js API route handlers that proxy requests to the backend Express API and handle authentication. These routes mirror the backend endpoints and add Supabase authentication middleware.

## Authentication Flow

```
1. User clicks "Generate Presentation" (after outline confirmation)
2. Check auth status (Supabase Auth)
3. If not authenticated:
   - Show Google OAuth modal
   - Redirect to Google OAuth
   - Callback to /auth/callback
   - Store JWT token in Supabase session
   - Ensure user exists in public.users table
4. Proceed with presentation generation
```

**Implementation:**
- **Frontend:** `frontend/hooks/useAuth.ts` - React hook for auth state
- **Backend:** `backend/src/api/users.ts` - User creation/validation
- **Middleware:** Supabase SSR helpers in `frontend/lib/supabase/`

## Error Handling Strategy

### Agent Errors
- **Malformed JSON:** Retry once with validation error context
- **Second failure:** Discard all progress, show clear error message
- **API timeout:** Fail gracefully (no job queue in MVP)

### Search API Errors
- **Rate limited:** Show partial results with error message
- **API unavailable:** Fall back to Claude's base knowledge, notify user

### User Errors
- **Empty prompt:** Disable submit, show validation message
- **Too short prompt (<10 chars):** Soft warning, allow proceed
- **Network failure during editing:** Auto-save prevents data loss (Zustand + Supabase sync)

### Edge Cases
- **User closes tab during generation:** Data lost (acceptable for MVP)
- **Duplicate titles:** Allowed, IDs are unique
- **Exceeded token limits:** Log warning, reduce research depth dynamically

## Performance Optimizations

### Frontend
- **Lazy loading:** Next.js automatic route-based code splitting
- **Component code splitting:** Dynamic imports for heavy components
- **Debounced auto-save:** 2-3 second delay prevents excessive API calls
- **Optimistic UI updates:** Immediate feedback before server confirmation
- **Progressive image loading:** Lazy load images as needed

### Backend
- **Streaming responses:** Server-Sent Events (SSE) for progressive disclosure
- **Connection pooling:** Supabase client manages database connections
- **Response compression:** Express compression middleware
- **Efficient queries:** Indexed database queries, minimal data transfer

### Caching Strategy (MVP: None)
- No Cloudflare KV cache in MVP
- Focus on generation speed optimization
- Add caching post-launch based on usage data

## Security Measures

### Input Validation
- **Pre-processor agent:** Validates all prompts before processing
- **SQL injection:** Supabase parameterized queries prevent injection
- **XSS:** React auto-escapes, no `dangerouslySetInnerHTML` usage
- **Rate limiting:** Cloudflare (10 req/hour per IP) - planned

### Authentication
- **Google OAuth only:** No password storage or management
- **JWT tokens:** Supabase handles token generation and validation
- **HTTPS everywhere:** All production traffic encrypted
- **Secure cookie flags:** HttpOnly, Secure, SameSite

### Secrets Management
- **GCP Secret Manager:** Centralized secret storage (planned)
- **Runtime secret retrieval:** Secrets fetched at runtime, not in code
- **No .env in production:** Environment variables only in deployment config
- **Rotation:** Manual for MVP, automated post-launch

## Deployment Architecture

### Frontend (Vercel)
- **Platform:** Vercel
- **Framework:** Next.js 16 App Router
- **Main branch:** Auto-deploy to production
- **Preview:** Per-PR deployments
- **CDN:** Vercel Edge Network
- **Region:** Global edge locations

### Backend (Express Server)
- **Platform Options:**
  - GCP Cloud Run (containerized Express app)
  - Railway/Render (traditional Express deployment)
  - Vercel Serverless Functions (if refactored)
- **Runtime:** Node.js >= 18.0.0
- **Timeout:** 
  - Cloud Run: 60 minutes max
  - Vercel: 60s (Hobby), 300s (Pro)
- **Scaling:** Automatic based on traffic
- **Health Check:** `/health` endpoint for monitoring

### Database (Supabase)
- **Plan:** Free tier initially, scale as needed
- **Region:** us-east-1 (or configured region)
- **Backups:** Daily automatic backups
- **Monitoring:** Supabase dashboard + custom metrics
- **Connection Pooling:** Supabase handles connection management

## Monitoring & Logging

### Error Tracking
- **Sentry/LogSnag:** All exceptions and errors (planned)
- **Log level:** Error + Warning
- **Sampling:** 100% in MVP

### Custom Metrics
- Total presentations generated
- Average generation time (per agent and total)
- Success rate (outline + full presentation)
- Token usage per request (tracked in database)
- API error rates (by endpoint)

### Alerts (Planned)
- API costs > $100/day
- Error rate > 5%
- Average latency > 40s
- Database connection pool > 80%

## Project Structure

```
dossier/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── agents/            # AI agent implementations
│   │   │   ├── preprocessor.ts
│   │   │   ├── research.ts
│   │   │   ├── outline.ts
│   │   │   └── slide-generator.ts
│   │   ├── api/               # API route handlers
│   │   │   ├── preprocess.ts
│   │   │   ├── generate-outline.ts
│   │   │   ├── drafts.ts
│   │   │   ├── presentations.ts
│   │   │   └── users.ts
│   │   ├── config/            # Configuration
│   │   │   └── supabase.ts
│   │   ├── services/          # Business logic services
│   │   │   ├── draft-store.ts
│   │   │   └── presentation-store.ts
│   │   ├── types/             # TypeScript types
│   │   │   ├── draft.ts
│   │   │   ├── presentation.ts
│   │   │   └── index.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── anthropic.ts
│   │   │   └── brave-search.ts
│   │   └── index.ts           # Express app entry point
│   ├── dist/                  # Compiled JavaScript
│   ├── server.js              # Production server entry
│   ├── Dockerfile             # Container definition
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js application
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API route handlers (proxy to backend)
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── outline/           # Outline editor
│   │   ├── presentation/      # Presentation viewer/editor
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── editor/
│   │   ├── landing/
│   │   ├── outline/
│   │   ├── presentation/
│   │   ├── ui/                # shadcn/ui components
│   │   └── theme-provider.tsx
│   ├── lib/                   # Client libraries
│   │   ├── agents/            # Client-side agent utilities
│   │   ├── api/               # API client
│   │   ├── export/            # PDF export utilities
│   │   ├── services/          # Client services
│   │   ├── supabase/          # Supabase client helpers
│   │   ├── themes/            # Theme definitions
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── store/                 # Zustand state stores
│   │   ├── draft.ts
│   │   ├── presentation.ts
│   │   ├── ui.ts
│   │   └── types.ts
│   ├── hooks/                 # React hooks
│   │   └── useAuth.ts
│   ├── public/                # Static assets
│   ├── package.json
│   └── next.config.ts
│
├── supabase/
│   └── migrations/            # Database migration files
│       ├── 001_initial_schema.sql
│       ├── 001_create_drafts_table.sql
│       ├── 002_create_presentations_table.sql
│       ├── 003_create_users_table.sql
│       └── 004_add_presentation_status.sql
│
├── architecture.md            # This file
├── dossier_spec.md            # Product specification
├── README.md                  # Project README
├── CONTRIBUTING.md            # Contribution guidelines
├── DEPLOYMENT-CHECKLIST.md    # Deployment guide
└── docker-compose.yml         # Local development setup
```

## Development Workflow

### Local Development
1. **Backend:** `cd backend && npm run dev` (runs on port 8080)
2. **Frontend:** `cd frontend && npm run dev` (runs on port 3000)
3. **Database:** Supabase local instance or cloud project
4. **Environment:** Configure `.env` files in both directories

### Build Process
1. **Backend:** `npm run build` (TypeScript → JavaScript in `dist/`)
2. **Frontend:** `npm run build` (Next.js production build)
3. **Deployment:** Push to main branch triggers auto-deploy

### Testing Strategy
- **Manual Testing:** Primary method for MVP
- **E2E Tests:** Playwright for critical paths (planned)
- **No Unit Tests:** Focus on shipping MVP, add coverage post-launch

## Future Considerations

### Post-MVP Features
- Collaborative editing (real-time multiplayer)
- Template marketplace
- Advanced theming (custom colors, fonts)
- Presentation analytics
- Image generation integration
- PPTX export
- Mobile creation experience
- Public API for developers

### Known Limitations
- Desktop-only creation (mobile viewing only)
- No offline support
- Single user ownership (no shared decks)
- Public shares are fully public (no password protection)
- PDF export may timeout for very large decks (>30 slides)

---

**Last updated:** 2025-12-30  
**Version:** 0.2.0
