export interface Citation {
  text: string;
  source: {
    title: string;
    url: string;
    domain: string;
    date?: string;
  };
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
  type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
  image?: SlideImage;
}

export type CitationStyle = 'inline' | 'footnote' | 'speaker_notes';
export type Theme = 'minimal' | 'corporate' | 'bold' | 'modern' | 'classic';

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  slides: Slide[];
  citation_style: CitationStyle;
  theme: Theme;
  created_at: string;
  updated_at: string;
}
