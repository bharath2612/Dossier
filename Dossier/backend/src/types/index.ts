// Shared types for backend
export type SlideType = 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
export type CitationStyle = 'inline' | 'footnote' | 'speaker_notes';

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

export interface Slide {
  index: number;
  title: string;
  body: string[];
  speakerNotes: string[];
  visualHint?: string;
  citations?: Citation[];
  type: SlideType;
}

export interface TokenUsage {
  preprocessor: number;
  research: number;
  outline: number;
  slides: number;
  total: number;
}

// API Request/Response types
export interface PreprocessRequest {
  prompt: string;
}

export interface PreprocessResponse {
  enhanced_prompt: string;
  validation: {
    is_valid: boolean;
    warnings: string[];
  };
}

export interface GenerateOutlineRequest {
  enhanced_prompt: string;
}

export interface GenerateOutlineResponse {
  draft_id: string;
  title: string;
  outline: Outline;
  research: ResearchData;
  token_usage: {
    preprocessor: number;
    research: number;
    outline: number;
  };
}

export interface GeneratePresentationRequest {
  draft_id: string;
  outline: Outline;
  citation_style: CitationStyle;
  theme: string;
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

// Research types
export interface ResearchFinding {
  stat: string;
  context: string;
  source: Source;
}

export interface Framework {
  name: string;
  description: string;
  source: Source;
}

export interface ResearchData {
  topic: string;
  findings: ResearchFinding[];
  frameworks: Framework[];
}

// Agent response types
export interface AgentResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  token_usage?: number;
}
