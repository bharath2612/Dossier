import { Outline } from './draft';
export interface Citation {
    text: string;
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
    body: string[];
    speakerNotes: string[];
    visualHint?: string;
    citations?: Citation[];
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
export interface GeneratePresentationRequest {
    draft_id: string;
    outline: Outline;
    citation_style: CitationStyle;
    theme: Theme;
    user_id: string;
}
export interface GeneratePresentationResponse {
    presentation_id: string;
    status: PresentationStatus;
    slides?: Slide[];
    token_usage?: {
        slides: number;
        total: number;
    };
}
export interface UpdatePresentationRequest {
    title?: string;
    slides?: Slide[];
    theme?: Theme;
    citation_style?: CitationStyle;
    status?: PresentationStatus;
    error_message?: string;
    token_usage?: TokenUsage;
}
//# sourceMappingURL=presentation.d.ts.map