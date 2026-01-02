export interface OutlineSlide {
    index: number;
    title: string;
    bullets: string[];
    type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
}
export interface Outline {
    title: string;
    slides: OutlineSlide[];
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
export interface CreateDraftRequest {
    title: string;
    prompt: string;
    enhanced_prompt?: string;
    outline: Outline;
}
export interface UpdateDraftRequest {
    outline: Outline;
    title?: string;
}
export interface DraftResponse {
    draft: Draft;
    message?: string;
}
//# sourceMappingURL=draft.d.ts.map