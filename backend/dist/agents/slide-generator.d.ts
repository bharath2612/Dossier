import type { OutlineSlide } from '../types/draft';
import type { Slide, CitationStyle } from '../types/presentation';
interface SlideGeneratorInput {
    outlineSlides: OutlineSlide[];
    citationStyle: CitationStyle;
    researchData?: any;
}
interface SlideGeneratorResult {
    success: boolean;
    data?: Slide[];
    error?: string;
    token_usage?: number;
}
export declare function generateSlides(input: SlideGeneratorInput): Promise<SlideGeneratorResult>;
export {};
//# sourceMappingURL=slide-generator.d.ts.map