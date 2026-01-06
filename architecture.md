# Dossier AI - Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              FULL-STACK (Vercel - Next.js App Router)        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (Next.js 16 App Router)                    │   │
│  │  - Landing Page                                      │   │
│  │  - Outline Editor                                    │   │
│  │  - Presentation Viewer/Editor                        │   │
│  │  - Dashboard                                         │   │
│  │  - Share Page                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State Management (Zustand)                          │   │
│  │  - Presentation Store                                │   │
│  │  - Draft Store                                       │   │
│  │  - UI Store                                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Route Handlers (app/api/)                       │   │
│  │  - POST /api/preprocess                              │   │
│  │  - POST /api/generate-outline                        │   │
│  │  - POST /api/generate-presentation                   │   │
│  │  - GET /api/presentations/:id/stream (SSE)          │   │
│  │  - CRUD endpoints for drafts & presentations         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AI Agents (lib/agents/)                             │   │
│  │  1. Pre-processor Agent → validates/enhances prompt  │   │
│  │  2. Research Agent → web search (Brave API)          │   │
│  │  3. Outline Agent → generates slide outline          │   │
│  │  4. Slide Generator Agent → full content             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Services (lib/services/)                            │   │
│  │  - Draft Store (Supabase)                            │   │
│  │  - Presentation Store (Supabase)                     │   │
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

## Data Flow

### 1. Prompt to Outline
```
User Input
  → Pre-processor Agent (validate + enhance)
  → User Approval
  → Research Agent (Brave Search)
  → Outline Agent
  → Save to drafts table
  → Return to UI (progressive disclosure)
```

### 2. Outline to Presentation
```
User confirms outline
  → Google OAuth (auth gate)
  → Slide Generator Agent
  → Save to presentations table
  → Return to UI (progressive disclosure)
```

### 3. Presentation Editing
```
User edits slide
  → Update Zustand store
  → Debounce (2-3s)
  → PATCH /api/presentations/:id
  → Update Supabase
  → Confirm to UI
```

## Database Schema

### Tables

#### users
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
  token_usage JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_presentations_created_at ON presentations(created_at DESC);
```

## AI Agent Architecture

### Agent Communication Pattern
```
Separate system + user messages with few-shot examples
```

### Pre-processor Agent
- **Input:** Raw user prompt
- **Output:** Enhanced prompt OR validation error
- **Token budget:** ~100-200 tokens
- **Timeout:** 3s

### Research Agent
- **Input:** Enhanced prompt
- **Output:** Structured JSON (findings + sources)
- **Token budget:** ~200-300 tokens per finding
- **Timeout:** 10s
- **Retry:** Once on search failure

### Outline Agent
- **Input:** Research JSON
- **Output:** Slide outline (8-12 slides)
- **Token budget:** ~800-1000 tokens
- **Timeout:** 10s
- **Retry:** Once on malformed JSON

### Slide Generator Agent
- **Input:** User-edited outline
- **Output:** Full slides with speaker notes
- **Token budget:** ~2000-3000 tokens
- **Timeout:** 30s
- **Retry:** Once on malformed JSON
- **Streaming:** Progressive disclosure at slide level

## State Management (Zustand)

### Presentation Store
```typescript
interface PresentationStore {
  currentPresentation: Presentation | null;
  presentations: Presentation[];
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentPresentation: (p: Presentation) => void;
  updateSlide: (slideIndex: number, updates: Partial<Slide>) => void;
  updateTitle: (title: string) => void;
  setTheme: (theme: Theme) => void;
  setCitationStyle: (style: CitationStyle) => void;
  fetchPresentations: () => Promise<void>;
  duplicatePresentation: (id: string) => Promise<void>;
  deletePresentation: (id: string) => Promise<void>;
}
```

### Draft Store
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

## API Integration

### Authentication Flow
```
1. User clicks "Generate Presentation"
2. Check auth status (Supabase Auth)
3. If not authenticated:
   - Show Google OAuth modal
   - Redirect to Google
   - Callback to app
   - Store JWT token
4. Proceed with generation
```

### Error Handling Strategy
- **Agent malformed JSON:** Retry once with error context
- **API rate limit:** Show partial results, allow retry
- **API timeout:** Fail gracefully, no recovery
- **Network error:** Auto-save prevents data loss
- **Auth error:** Clear token, re-authenticate

## Performance Optimizations

### Frontend
- Lazy loading routes (Next.js automatic)
- Component code splitting
- Debounced auto-save (2-3s)
- Optimistic UI updates
- Progressive image loading

### Backend
- Streaming responses (progressive disclosure)
- Connection pooling (Supabase)
- Cloud Run auto-scaling
- Response compression

### Caching Strategy (MVP: None)
- No Cloudflare KV cache in MVP
- Focus on generation speed optimization
- Add caching post-launch based on usage data

## Security Measures

### Input Validation
- Pre-processor validates all prompts
- SQL injection: Supabase parameterized queries
- XSS: React auto-escapes, no dangerouslySetInnerHTML
- Rate limiting: Cloudflare (10 req/hour per IP)

### Authentication
- Google OAuth only (no passwords)
- JWT tokens with expiration
- HTTPS everywhere
- Secure cookie flags

### Secrets Management
- GCP Secret Manager (centralized)
- Runtime secret retrieval
- No .env files in production
- Rotation: manual for MVP

## Deployment Architecture

### Frontend (Vercel)
- **Main branch:** Auto-deploy to production
- **Preview:** Per-PR deployments
- **Domain:** TBD
- **CDN:** Vercel Edge Network

### Backend (Next.js API Routes on Vercel)
- **Platform:** Vercel Serverless Functions
- **Runtime:** Node.js (default)
- **Timeout:** 60s (Hobby), 300s (Pro) - background generation pattern used for longer operations
- **Region:** Global (Vercel Edge Network)
- **Scaling:** Automatic based on traffic

### Database (Supabase)
- **Plan:** Free tier initially
- **Region:** us-east-1
- **Backups:** Daily automatic
- **Monitoring:** Supabase dashboard

## Monitoring & Logging

### Error Tracking
- **Sentry:** All exceptions and errors
- **Log level:** Error + Warning
- **Sampling:** 100% in MVP

### Custom Metrics
- Total presentations generated
- Average generation time
- Success rate (outline + full)
- Token usage per request
- API error rates

### Alerts
- API costs > $100/day
- Error rate > 5%
- Average latency > 40s
- Database connection pool > 80%

---

Last updated: 2025-12-30
