import { Outline } from './draft';

export interface Citation {
  text: string; // e.g., "McKinsey 2024"
  source: {
    title: string;
    url: string;
    domain: string;
    date?: string;
  };
}

export interface Slide {
  index: number;
  title: string;
  body: string[]; // 3-4 bullets max
  speakerNotes: string[]; // 2-3 concise points
  visualHint?: string; // stored, not rendered in MVP
  citations?: Citation[]; // if inline or footnote
  type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
}

export type CitationStyle = 'inline' | 'footnote' | 'speaker_notes';
export type Theme = 'minimal' | 'corporate' | 'bold' | 'modern' | 'classic';

export interface TokenUsage {
  preprocessor: number;
  research: number;
  outline: number;
  slides: number;
  total: number;
}

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
  token_usage?: TokenUsage;
  created_at: string;
  updated_at: string;
}

// Request/Response types
export interface GeneratePresentationRequest {
  draft_id: string;
  outline: Outline;
  citation_style: CitationStyle;
  theme: Theme;
  user_id: string;
}

export interface GeneratePresentationResponse {
  presentation_id: string;
  slides: Slide[];
  token_usage: {
    slides: number;
    total: number;
  };
}

export interface UpdatePresentationRequest {
  title?: string;
  slides?: Slide[];
  theme?: Theme;
  citation_style?: CitationStyle;
}
