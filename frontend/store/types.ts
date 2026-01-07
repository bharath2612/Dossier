// Shared types for the application

export type SlideType = 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
export type CitationStyle = 'inline' | 'footnote' | 'speaker_notes';
export type Theme = 'minimal' | 'corporate' | 'bold' | 'modern' | 'classic';

export interface Source {
  title: string;
  url: string;
  domain: string;
  date?: string;
}

export interface Citation {
  text: string;
  source: Source;
}

export interface OutlineSlide {
  index: number;
  title: string;
  bullets: string[];
  type: SlideType;
}

export interface Outline {
  title: string;
  slides: OutlineSlide[];
}

export type ImagePosition = 'left' | 'right' | 'top' | 'bottom' | 'background' | 'none';

export interface SlideImage {
  url: string;
  caption?: string;
  position: ImagePosition;
  storagePath?: string; // For Supabase storage cleanup
}

export interface Slide {
  index: number;
  title: string;
  body: string[];
  speakerNotes: string[];
  visualHint?: string;
  citations?: Citation[];
  type: SlideType;
  image?: SlideImage;
}

export interface TokenUsage {
  preprocessor: number;
  research: number;
  outline: number;
  slides: number;
  total: number;
}

export interface Draft {
  id: string;
  title: string;
  prompt: string;
  enhanced_prompt?: string;
  outline: Outline;
  created_at: string;
  updated_at: string;
}

export type PresentationStatus = 'generating' | 'completed' | 'failed';

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  enhanced_prompt?: string;
  outline: Outline;
  slides: Slide[];
  citation_style: CitationStyle;
  theme: Theme;
  status: PresentationStatus;
  error_message?: string;
  token_usage?: TokenUsage;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  google_id: string;
  created_at: string;
  updated_at: string;
}

// Outline Generation V2 Types
export type GenerationMode = 'fast' | 'research';

export type GenerationStatus =
  | 'idle'
  | 'preprocessing'
  | 'researching'
  | 'generating'
  | 'complete'
  | 'error';

export interface ResearchSource {
  domain: string;
  favicon: string;
}

export interface GeneratedSlide {
  index: number;
  title: string;
  bullets: string[];
}

// SSE Event Types for streaming
export type SSEEvent =
  | { type: 'preprocessing'; status: 'start' | 'complete'; enhanced_prompt?: string; original_prompt?: string }
  | { type: 'research_query'; query: string }
  | { type: 'research_source'; source: ResearchSource }
  | { type: 'research_complete'; sourceCount: number }
  | { type: 'content_chunk'; chunk: string }
  | { type: 'slide_complete'; index: number; parsed: GeneratedSlide }
  | { type: 'draft_created'; draftId: string }
  | { type: 'complete'; slideCount: number }
  | { type: 'error'; message: string }
