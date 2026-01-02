# Dossier AI — Comprehensive MVP Specification

> **Purpose of this document**
> This is a detailed, execution-ready specification for building Dossier AI with Claude Code.
> It defines architecture, implementation details, UI/UX decisions, and technical constraints.
> Design philosophy: **Apple/Tesla-level sophistication** — modern, clean typography, generous whitespace, inspired by Supabase, Cluely, Chronicle.ai.

---

## 1. Product Overview

**Dossier AI** is a research-backed AI presentation generator that produces **Chronicle-level designed slides** with **non-generic, cited content**.

**Core promise:**
> Turn a prompt into a professional, well-structured presentation in under 5 minutes.

**MVP focus:**
- Quality > features
- Speed > configurability
- Design sophistication (Apple/Tesla level polish)
- Single-player workflow initially

---

## 2. Complete User Flow (Updated)

### Phase 1: Prompt Input (No Auth Required)
1. User lands on minimal, elegant homepage
2. Sees rotating placeholder prompts in input field
3. Can type custom prompt OR click static example prompts
4. Smart suggestions appear as user types
5. Pre-processor agent enhances prompt
6. **User sees enhanced prompt with approval step** before proceeding

### Phase 2: Outline Generation (No Auth Required)
1. Simple progress bar shows estimated percentage
2. Research Agent searches web (Brave/Serper API)
   - Prioritizes reputable domains (.edu, .gov, major publications)
   - Adaptive: 1 query for simple topics, 3 for complex
   - Shows partial results with error if search fails
3. Outline Agent generates 8-12 slide outline (flexible 5-20 range)
4. Outline saved to `drafts` table in Supabase
5. User sees editable outline with drag-and-drop reordering
6. User can edit titles, bullets, slide types directly in cards
7. Auto-save with 2-3 second debounce

### Phase 3: Auth Gate (Required to Generate Full Presentation)
1. User clicks "Generate Presentation"
2. System prompts Google sign-in
3. After auth, re-uses outline from state (doesn't migrate old drafts)
4. Proceeds to full generation

### Phase 4: Full Presentation Generation (Auth Required)
1. Progressive disclosure: show slides as each completes
2. Slide Generator Agent expands outline
   - Concise bullet points for speaker notes (2-3 per slide)
   - Visual hints stored but not rendered in MVP
   - Different layouts per slide type (intro/content/data/quote/conclusion)
3. User can select citation style: inline, footnote, or speaker notes only
4. Presentation saved to `presentations` table
5. Agent-generated title, fully editable by user

### Phase 5: Present & Share
1. Full presenter mode with keyboard navigation
   - Arrow keys: next/previous
   - Number keys: jump to specific slide
   - Escape: exit fullscreen
   - Instant transitions (no animations)
2. Full inline editing: click to edit any text
3. Auto-save changes with 2-3 second debounce
4. Share via separate read-only route: `/share/[id]`
5. Export PDF (slides only, no speaker notes)
   - Format: `presentation-title-YYYY-MM-DD.pdf`
   - Puppeteer/Playwright renders HTML to PDF
6. Social sharing with dynamic og:image (Vercel OG)
7. Duplicate presentations from dashboard or in-deck

❌ **Explicitly excluded from MVP:**
- Team features, collaboration
- PPTX export
- Brand customization/logo uploads
- Analytics dashboards
- Caching (Cloudflare KV skipped)

---

## 3. Tech Stack (Final)

### Frontend
- **Next.js 14 (App Router)**
- **TypeScript (strict mode)**
- **Tailwind CSS** (custom design system, not default theme)
- **shadcn/ui** (buttons, dialogs, inputs, cards)
- **Framer Motion** (subtle, minimal transitions)
- **Zustand** (state management for presentations, outline editing)
- **dnd-kit** (drag-and-drop for outline reordering)
- **Lucide Icons** (for UI, not rendering visual hints on slides)

### Backend / Infrastructure
- **GCP Cloud Run Functions** (API + AI orchestration)
  - Chosen over Supabase Edge Functions for performance and timeout flexibility
- **Supabase**
  - Postgres (primary DB)
  - Auth (Google OAuth)
  - No Storage or other features in MVP
- **Cloudflare** (rate limiting + CAPTCHA for suspicious traffic)
- **GCP Secret Manager** (centralized secrets for all environments)

### AI
- **Anthropic Claude Sonnet 4.5** (all agents)
- **Brave Search API** (or Serper) for web research
  - Fallback: use Claude's base knowledge if API unavailable
- **Agent flow:**
  1. Pre-processor Agent (prompt enhancement + validation)
  2. Research Agent (web search, structured findings)
  3. Outline Agent (8-12 slide outline)
  4. Slide Generator Agent (full content + speaker notes)

### Deployment
- **Vercel** (Next.js frontend with preview deployments)
- **GCP Cloud Run** (backend functions)
- **Vercel OG** (dynamic og:image generation for social sharing)

### Monitoring & Logging
- **Sentry or LogSnag** (error tracking, exceptions)
- **Custom logging** (token usage per request, latencies, success rates)
- No full analytics/metrics platform in MVP

---

## 4. High-Level Architecture

```
User Input
   ↓
Next.js Client (Vercel)
   ↓
GCP Cloud Run Functions
   ↓
┌─────────────────────────────────────┐
│  Agent Pipeline:                    │
│  1. Pre-processor (validate/enhance)│
│  2. Research Agent (Brave Search)   │
│  3. Outline Agent                   │
│  4. Slide Generator Agent           │
└─────────────────────────────────────┘
   ↓
Supabase Postgres
   ↓
Client Render (React + Zustand)
```

**Data flow:**
- Drafts table (outline phase, anonymous)
- Presentations table (after auth + generation)
- Users table (Google OAuth profiles)

---

## 5. AI Agent Implementation Details

### 1. Pre-processor Agent
**Purpose:** Validate and enhance user prompts before research

**Input:** Raw user prompt
**Output:** Enhanced prompt OR validation error

**Responsibilities:**
- Validate inappropriate/off-topic prompts (reject harmful, off-brand requests)
- Expand vague prompts with research context
- Clarify ambiguous language
- Add structure cues for downstream agents

**System Prompt Strategy:** Separate system + user messages with few-shot examples

**Error Handling:**
- Invalid prompts: return clear error, suggest improvements
- Malformed output: retry once with error context

**Example Enhancement:**
```
Input: "sales tips"
Output: "10 data-driven sales strategies for B2B SaaS companies in 2025,
        including case studies and actionable frameworks"
```

### 2. Research Agent
**Purpose:** Find high-quality, cited research via web search

**Input:** Enhanced prompt from Pre-processor
**Output:** Structured research JSON

**Responsibilities:**
- Generate 1-3 search queries (adaptive based on topic complexity)
- Execute Brave Search API calls
- Filter and prioritize reputable domains (.edu, .gov, major publications)
- Extract stats, frameworks, examples, quotes
- Structure findings as bullet points (1 sentence each)

**Search Query Strategy:**
- Simple topics: 1 well-crafted query
- Complex topics: 3 diverse queries
- Agent decides based on prompt analysis

**Data Format:**
```typescript
{
  topic: string,
  findings: Array<{
    stat: string,           // Key data point
    context: string,        // One-line explanation
    source: {
      title: string,
      url: string,
      domain: string,
      date?: string
    }
  }>,
  frameworks: Array<{
    name: string,
    description: string,
    source: { ... }
  }>
}
```

**Error Handling:**
- API rate limit: show partial results with clear error, let user retry
- API unavailable: fall back to Claude's base knowledge (no web search)
- Invalid search results: retry once with refined query

**Token Budget:** ~200-300 tokens per finding

**System Prompt Strategy:** Separate system + user messages with few-shot examples

### 3. Outline Agent
**Purpose:** Convert research into structured slide outline

**Input:** Research JSON
**Output:** Slide outline with 8-12 slides (flexible 5-20 range)

**Responsibilities:**
- Strong, specific slide titles (no generic ones)
- Each slide answers "why it matters"
- Assign slide types: intro, content, data, quote, conclusion
- Structure: flexible based on topic (not rigid template)
- Bullet points for each slide (2-4 bullets)

**Slide Type Definitions:**
- **intro**: Hook, context, "why now" statements
- **content**: Frameworks, strategies, explanations
- **data**: Stats-heavy, chart/graph suggestions
- **quote**: Key insight, expert opinion (large centered text)
- **conclusion**: Next steps, call-to-action, summary

**System Prompt Strategy:** Separate system + user messages with few-shot examples

**Error Handling:**
- Malformed JSON: retry once with validation error
- Then fail with partial results if second attempt fails

### 4. Slide Generator Agent
**Purpose:** Expand outline into full presentation content

**Input:** Confirmed outline (user-edited)
**Output:** Complete slide deck

**Responsibilities:**
- Expand bullets into full slide content (3-4 bullets max per slide)
- Add concise speaker notes (2-3 bullet points per slide)
- Generate visual hints (stored, not rendered in MVP)
- Cite sources based on user preference:
  - Inline: [McKinsey 2024]
  - Footnote: small text at bottom of slide
  - Speaker notes only: no citations on slide
- Adapt layout based on slide type

**Content Constraints:**
- Soft limit: title 60 chars, bullets 120 chars (warn but allow)
- 3-4 bullets maximum per slide
- Speaker notes: concise talking points, not full scripts

**System Prompt Strategy:** Separate system + user messages with few-shot examples

**Error Handling:**
- Malformed JSON: retry once with validation error
- Discard all progress on failure (no partial saves)

---

## 6. Data Models (Complete)

### User
```typescript
{
  id: string (UUID)
  email: string
  name: string
  avatar_url?: string
  google_id: string
  created_at: timestamp
  updated_at: timestamp
}
```

### Draft (Outline Phase, Pre-Auth)
```typescript
{
  id: string (UUID)
  title: string (agent-generated from prompt)
  prompt: string (original user input)
  enhanced_prompt: string (from pre-processor)
  outline: Outline
  created_at: timestamp
  updated_at: timestamp
  // No user_id (anonymous)
}
```

### Presentation (Post-Auth, Full Deck)
```typescript
{
  id: string (UUID)
  user_id: string (foreign key to users)
  title: string (editable by user)
  prompt: string (original)
  enhanced_prompt: string
  outline: Outline
  slides: Slide[]
  citation_style: 'inline' | 'footnote' | 'speaker_notes'
  theme: 'minimal' | 'corporate' | 'bold' | 'modern' | 'classic'
  created_at: timestamp
  updated_at: timestamp
  token_usage: {
    preprocessor: number,
    research: number,
    outline: number,
    slides: number,
    total: number
  }
}
```

### Outline
```typescript
{
  title: string
  slides: OutlineSlide[]
}
```

### OutlineSlide
```typescript
{
  index: number
  title: string
  bullets: string[]
  type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion'
}
```

### Slide
```typescript
{
  index: number
  title: string
  body: string[] (3-4 bullets max)
  speakerNotes: string[] (2-3 concise points)
  visualHint?: string (stored, not rendered in MVP)
  citations?: Citation[] (if inline or footnote)
  type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion'
}
```

### Citation
```typescript
{
  text: string (e.g., "McKinsey 2024")
  source: {
    title: string,
    url: string,
    domain: string,
    date?: string
  }
}
```

---

## 7. API Endpoints (GCP Cloud Run Functions)

### `POST /api/preprocess`
**Purpose:** Validate and enhance user prompt

**Input:**
```json
{
  "prompt": "string"
}
```

**Output:**
```json
{
  "enhanced_prompt": "string",
  "validation": {
    "is_valid": true,
    "warnings": []
  }
}
```

**Error Response:**
```json
{
  "error": "Invalid prompt: [reason]",
  "suggestions": ["suggestion 1", "suggestion 2"]
}
```

### `POST /api/generate-outline`
**Purpose:** Generate research + outline

**Input:**
```json
{
  "enhanced_prompt": "string"
}
```

**Output:** (Progressive disclosure - streaming at slide level)
```json
{
  "draft_id": "uuid",
  "title": "string",
  "outline": {
    "title": "string",
    "slides": [...]
  },
  "research": {...},
  "token_usage": {
    "preprocessor": 0,
    "research": 1200,
    "outline": 800
  }
}
```

### `POST /api/generate-presentation`
**Purpose:** Generate full presentation from confirmed outline

**Input:**
```json
{
  "draft_id": "uuid",
  "outline": {...},
  "citation_style": "inline" | "footnote" | "speaker_notes",
  "theme": "minimal" | "corporate" | "bold" | "modern" | "classic",
  "user_id": "uuid"
}
```

**Output:** (Progressive disclosure - streaming completed slides)
```json
{
  "presentation_id": "uuid",
  "slides": [...],
  "token_usage": {
    "slides": 2500,
    "total": 4500
  }
}
```

### `POST /api/export/pdf`
**Purpose:** Export presentation as PDF

**Input:**
```json
{
  "presentation_id": "uuid"
}
```

**Output:**
```json
{
  "pdf_url": "string (GCS signed URL)",
  "expires_at": "timestamp"
}
```

**Implementation:** Puppeteer/Playwright renders HTML to PDF on Cloud Run

### `PATCH /api/presentations/:id`
**Purpose:** Update presentation (inline editing, title changes)

**Input:**
```json
{
  "title"?: "string",
  "slides"?: [...],
  "theme"?: "minimal" | ...
}
```

### `POST /api/presentations/:id/duplicate`
**Purpose:** Duplicate existing presentation

**Output:**
```json
{
  "presentation_id": "uuid (new)"
}
```

### `DELETE /api/presentations/:id`
**Purpose:** Permanently delete presentation (with confirmation)

---

## 8. UI/UX Detailed Specifications

### Design System
**Inspiration:** Apple, Tesla, Supabase, Cluely, Chronicle.ai

**Typography:**
- Primary font: Inter or SF Pro (system font stack)
- Headings: 600 weight, generous letter-spacing
- Body: 400 weight, 1.6 line-height
- Large type sizes: 48px+ for headings

**Colors:**
- Single default theme initially (dark navy + accent)
- 3-5 preset themes to be designed:
  - Minimal (black/white/gray)
  - Corporate (navy/blue/gray)
  - Bold (high contrast, vibrant accent)
  - Modern (pastel/muted tones)
  - Classic (serif typography, traditional colors)

**Spacing:**
- Generous whitespace (8px base unit, scale: 8, 16, 24, 32, 48, 64, 96)
- Cards: 32px padding minimum
- Section spacing: 96px+ between major sections

**Components:**
- shadcn/ui as base, heavily customized
- Subtle shadows, rounded corners (8-12px)
- Hover states: smooth transitions (200ms)
- Focus states: visible outlines for accessibility

### Landing Page
**Layout:**
- Minimal, centered design
- Logo + tagline at top
- Large prompt input (textarea, 4-5 rows)
- Rotating placeholder prompts (changes every 3s)
  - Example: "Create a pitch deck for a B2B SaaS startup..."
  - Example: "Build a training presentation on leadership..."
- 3-4 static example prompts below input (clickable chips)
- Smart suggestions dropdown as user types
- Single CTA button: "Generate Outline"
- No feature marketing, no clutter

**Responsiveness:** Desktop-only (show "use desktop" message on mobile)

### Outline Editor
**Layout:**
- Left panel: Editable outline cards
  - Drag-and-drop reordering (dnd-kit)
  - Click to edit title/bullets inline
  - Dropdown to change slide type
  - Delete slide button (with confirmation)
  - Add slide button (between cards)
- Right panel: Live preview of slides
- Footer: "Generate Presentation" CTA (triggers auth)
- Auto-save indicator (debounced 2-3s)

**Interactions:**
- Character count warnings (soft limits)
- Validation: minimum 5 slides, maximum 20
- Unsaved changes indicator

### Presentation Viewer/Editor
**Layout:**
- Clean, full-width slides (16:9 aspect ratio)
- Minimal chrome: just slide navigation
- Click any text to edit inline
- Theme selector in top-right corner
- Citation style toggle in settings
- Export PDF button
- Share button (generates `/share/[id]` link)

**Presenter Mode:**
- Fullscreen on Escape key
- Current slide number indicator
- Speaker notes below slide (collapsible)
- Navigation:
  - Arrow keys: next/previous
  - Number keys: jump to slide N
  - No animations (instant transitions)

### Dashboard
**Layout:**
- Grid view (3 columns on desktop)
- Large title cards with metadata:
  - Presentation title (editable on hover)
  - Slide count
  - Last updated date
  - Theme indicator (color accent)
- Hover: show quick actions (edit, duplicate, delete, share)
- No thumbnails in MVP (just text cards)
- Sort: recent first
- Search bar at top

**Mobile:** View-only (simplified list view)

### Share Page (`/share/[id]`)
**Layout:**
- Read-only presentation view
- No edit controls, no export
- Full keyboard navigation works
- Footer: "Create your own with Dossier AI" CTA
- Dynamic og:image for social sharing (Vercel OG renders first slide)

---

## 9. Performance Targets

### Generation Latency
- Pre-processor: < 3s
- Outline generation: < 10s
- Full presentation: < 30s
- PDF export: 2-5s per deck

### Page Load
- Landing page: < 1s (FCP)
- Dashboard: < 2s
- Presentation viewer: < 2s

### Optimization Strategies
- Progressive disclosure (show slides as completed)
- Streaming responses from Cloud Run
- Lazy loading images/components
- Edge caching via Cloudflare (rate limiting, not content)

---

## 10. Error Handling & Edge Cases

### Agent Errors
- **Malformed JSON:** Retry once with validation error context
- **Second failure:** Discard all progress, show clear error message
- **API timeout:** If exceeds Cloud Run timeout, fail gracefully (no job queue in MVP)

### Search API Errors
- **Rate limited:** Show partial results with error message
- **API unavailable:** Fall back to Claude's base knowledge, notify user "using AI knowledge without web search"

### User Errors
- **Empty prompt:** Disable submit, show validation message
- **Too short prompt (<10 chars):** Soft warning, allow proceed
- **Network failure during editing:** Auto-save prevents data loss (Zustand + Supabase sync)

### Edge Cases
- **User closes tab during generation:** Data lost (acceptable for MVP, no recovery)
- **Duplicate titles:** Allowed, IDs are unique
- **Exceeded token limits:** Log warning, reduce research depth dynamically
- **PDF generation fails:** Show error, offer "try again" button

---

## 11. Security & Rate Limiting

### Authentication
- Google OAuth via Supabase Auth
- No email/password in MVP
- JWT tokens for API authorization
- Auth gate AFTER outline confirmation (before full generation)

### Rate Limiting
- Cloudflare rate limiting: 10 requests/hour per IP
- CAPTCHA for suspicious traffic patterns
- No per-user rate limits (trust authenticated users)

### Secrets Management
- GCP Secret Manager (single source of truth)
- Secrets pulled at runtime (not environment variables)
- Rotation strategy: manual for MVP

### Input Validation
- Pre-processor agent validates prompts
- SQL injection: Supabase parameterized queries
- XSS: React auto-escapes, no dangerouslySetInnerHTML

---

## 12. Testing Strategy

### Critical Path E2E Tests (Playwright)
1. Landing page → enter prompt → see outline
2. Edit outline → reorder slides → save
3. Click generate → auth flow → see presentation
4. Edit slide content → auto-save → verify persistence
5. Export PDF → download file
6. Duplicate presentation → verify copy
7. Delete presentation → verify removal

### No Unit/Integration Tests in MVP
- Manual testing for edge cases
- Focus on shipping, add test coverage post-launch

---

## 13. Deployment & Infrastructure

### Environments
- **Local dev:** Docker Compose (Supabase local, mock APIs)
- **Preview:** Vercel preview deployments (per PR)
- **Production:** Vercel (frontend) + GCP Cloud Run (backend)

### CI/CD
- GitHub Actions
  - Vercel auto-deploys on push to main
  - GCP Cloud Run deploy via GitHub Actions
- No manual deployments

### Monitoring
- Sentry: error tracking, exception logging
- Custom dashboard (simple Next.js page):
  - Total presentations generated (count)
  - Average generation time
  - Success rate
  - Token usage per day
  - API error rates

### Scaling Considerations
- Cloud Run auto-scales (no manual intervention)
- Supabase: start with free tier, monitor DB connections
- API costs: log token usage per request, set alert at $100/day

---

## 14. Build Order (Execution Plan)

This is the recommended order for Claude Code to implement features:

### Phase 1: Foundation (Week 1)
1. ✅ Next.js 14 project scaffold (App Router, TypeScript, Tailwind)
2. ✅ Install shadcn/ui components
3. ✅ Set up Zustand store structure
4. ✅ Landing page UI (minimal, prompt input, examples)
5. ✅ GCP Cloud Run function template (hello world)
6. ✅ Supabase setup (local + cloud)

### Phase 2: Agent Pipeline (Week 1-2)
7. ✅ Pre-processor agent (prompt validation/enhancement)
8. ✅ Brave Search API integration
9. ✅ Research Agent implementation
10. ✅ Outline Agent implementation
11. ✅ `/api/generate-outline` endpoint
12. ✅ Progressive disclosure UI (streaming slides)

### Phase 3: Outline Editing (Week 2)
13. ✅ Outline editor UI (cards, inline editing)
14. ✅ dnd-kit drag-and-drop integration
15. ✅ Auto-save with debounce (Zustand → Supabase)
16. ✅ Character count warnings
17. ✅ Drafts table CRUD operations

### Phase 4: Auth & Full Generation (Week 2-3)
18. ✅ Google OAuth setup (Supabase Auth)
19. ✅ Auth gate UI (modal after "Generate Presentation")
20. ✅ Slide Generator Agent implementation
21. ✅ Citation style selector
22. ✅ `/api/generate-presentation` endpoint
23. ✅ Presentations table CRUD operations
24. ✅ Token usage logging

### Phase 5: Presentation Viewer (Week 3)
25. ✅ Slide renderer (5 layout variants per type)
26. ✅ Inline editing (click to edit)
27. ✅ Presenter mode (fullscreen, keyboard nav)
28. ✅ Theme selector (3-5 presets)
29. ✅ Speaker notes UI (collapsible)

### Phase 6: Dashboard & Sharing (Week 3-4)
30. ✅ Dashboard grid view
31. ✅ Duplicate presentation feature
32. ✅ Delete presentation (with confirmation)
33. ✅ `/share/[id]` read-only route
34. ✅ Vercel OG for social cards

### Phase 7: Export & Polish (Week 4)
35. ✅ Puppeteer/Playwright PDF export
36. ✅ `/api/export/pdf` endpoint
37. ✅ Mobile viewing (responsive slides)
38. ✅ Error boundaries and retry logic
39. ✅ Cloudflare rate limiting setup
40. ✅ GCP Secret Manager integration

### Phase 8: Testing & Launch (Week 4-5)
41. ✅ Critical path E2E tests (Playwright)
42. ✅ Sentry integration (error logging)
43. ✅ Custom monitoring dashboard
44. ✅ Production deployment
45. ✅ Load testing (basic, manual)

---

## 15. Explicit Non-Goals (Do NOT Build)

These features are intentionally excluded from MVP:

- ❌ Team features, collaboration, sharing with edit permissions
- ❌ PPTX export (only PDF)
- ❌ Email/password auth (Google OAuth only)
- ❌ Brand customization (logo uploads, custom fonts)
- ❌ Image generation (DALL-E, Midjourney)
- ❌ Caching layer (Cloudflare KV)
- ❌ Advanced analytics (user behavior tracking)
- ❌ Mobile creation/editing (desktop only)
- ❌ Templates/starter decks
- ❌ Slide animations/transitions
- ❌ Video embeds
- ❌ Comments/feedback system
- ❌ Version history
- ❌ Public gallery of presentations
- ❌ Payment/billing (free during MVP)

---

## 16. Open Questions / Future Considerations

### Post-MVP Features (Not for Initial Build)
1. **Collaborative editing:** Real-time multiplayer via Supabase Realtime
2. **Template marketplace:** Users can save/share templates
3. **Advanced theming:** Custom color pickers, font uploads
4. **Presentation analytics:** View counts, time spent per slide
5. **Speaker coaching:** AI feedback on speaker notes quality
6. **Image generation:** Auto-generate visuals for each slide
7. **PPTX export:** Integration with Open XML SDK
8. **Mobile creation:** Simplified mobile editing experience
9. **API access:** Public API for developers

### Known Limitations
- Desktop-only creation (mobile viewing only)
- No offline support
- Single user ownership (no shared decks)
- Public shares are fully public (no password protection)
- PDF export may timeout for very large decks (>30 slides)

---

## 17. Success Metrics (Post-Launch)

### Primary KPIs
- Outline generation success rate (target: >95%)
- Full presentation completion rate (target: >90%)
- Average generation time (target: <25s for full deck)
- User retention: return within 7 days (target: >40%)

### Secondary Metrics
- PDF export usage (% of generated presentations)
- Share link clicks (virality indicator)
- Duplicate presentation frequency (power user signal)
- Theme selection distribution (informs future design)

### Cost Metrics
- Token cost per presentation (target: <$0.50)
- Cloud Run compute costs (target: <$0.10/presentation)
- Total monthly API spend (alert at $1000/month)

---

## 18. Claude Code Execution Rules

When implementing this specification with Claude Code:

1. **Always start in PLAN MODE** for any feature
2. Do NOT implement features outside this document
3. Ask before expanding scope or adding "nice-to-haves"
4. Prefer clarity and simplicity over cleverness
5. Build incrementally (one feature at a time, following build order)
6. Test each feature before moving to next
7. Commit frequently with clear messages
8. Reference this spec in commit messages (e.g., "Phase 2.9: Research Agent implementation")
9. Flag any ambiguities or missing details immediately
10. Prioritize design sophistication (Apple/Tesla level) in all UI work

---

**This document is the single source of truth for Dossier AI MVP.**
If something is not written here, **do not build it yet**.
All implementation decisions in this document are final for MVP scope.

Last updated: 2025-12-30
