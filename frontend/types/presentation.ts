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

// Rich Text Types (previously referenced but not defined)
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
export type TextStyle = 'heading' | 'subtitle' | 'body' | 'quote';
export type TextAlignment = 'left' | 'center' | 'right';

export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: string;
  color?: string;
  backgroundColor?: string;  // NEW - for text highlighting
  fontSize?: FontSize;
  textStyle?: TextStyle;
  alignment?: TextAlignment;
}

export interface RichTextBullet {
  segments: TextSegment[];
}

// Widget System Types
export type WidgetType =
  | 'text'
  | 'heading'
  | 'card'
  | 'sticky-note'
  | 'image'
  | 'diagram'
  | 'arrow'
  | 'line';

export type HeadingLevel = 'h1' | 'h2' | 'h3';

export interface WidgetPosition {
  x: number;      // Percentage 0-100
  y: number;      // Percentage 0-100
  width: number;  // Percentage 0-100
  height: number; // Percentage 0-100
}

export interface BaseWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  zIndex: number;
}

export interface TextWidget extends BaseWidget {
  type: 'text';
  data: { segments: TextSegment[] };
}

export interface HeadingWidget extends BaseWidget {
  type: 'heading';
  data: {
    level: HeadingLevel;
    segments: TextSegment[];
  };
}

export interface CardWidget extends BaseWidget {
  type: 'card';
  data: {
    title?: TextSegment[];
    body: TextSegment[];
    backgroundColor?: string;
    borderColor?: string;
  };
}

export interface StickyNoteWidget extends BaseWidget {
  type: 'sticky-note';
  data: {
    segments: TextSegment[];
    color: string;
    rotation?: number;
  };
}

export interface ImageWidget extends BaseWidget {
  type: 'image';
  data: SlideImage;
}

export interface DiagramWidget extends BaseWidget {
  type: 'diagram';
  data: {
    diagramType: 'flowchart' | 'venn' | 'timeline';
    elements: any[];  // Simplified for MVP
  };
}

export interface ArrowWidget extends BaseWidget {
  type: 'arrow';
  data: {
    startPoint: { x: number; y: number };
    endPoint: { x: number; y: number };
    color: string;
    thickness: number;
  };
}

export interface LineWidget extends BaseWidget {
  type: 'line';
  data: {
    startPoint: { x: number; y: number };
    endPoint: { x: number; y: number };
    style: 'solid' | 'dashed' | 'dotted';
    color: string;
    thickness: number;
  };
}

export type ContentBlock =
  | TextWidget
  | HeadingWidget
  | CardWidget
  | StickyNoteWidget
  | ImageWidget
  | DiagramWidget
  | ArrowWidget
  | LineWidget;

export interface Slide {
  index: number;
  title: string;  // Legacy - will migrate to widgets
  body: string[]; // Legacy - will migrate to widgets
  speakerNotes: string[];
  visualHint?: string;
  citations?: Citation[];
  type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
  image?: SlideImage;  // Legacy - will migrate to ImageWidget
  background_color?: string;

  // NEW: Freeform canvas
  content_blocks?: ContentBlock[];  // If present, use instead of title/body
}

export type CitationStyle = 'inline' | 'footnote' | 'speaker_notes';
export type Theme = 'minimal' | 'corporate' | 'bold' | 'modern' | 'classic';
export type PresentationStatus = 'generating' | 'completed' | 'failed';

export interface Presentation {
  id: string;
  user_id: string;
  title: string;
  slides: Slide[];
  citation_style: CitationStyle;
  theme: Theme;
  status: PresentationStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
