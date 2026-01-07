import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  GenerationMode,
  GenerationStatus,
  ResearchSource,
  GeneratedSlide,
} from './types';

interface OutlineGenerationStore {
  // Input state
  prompt: string;
  mode: GenerationMode;

  // Generation state
  status: GenerationStatus;
  draftId: string | null;

  // Prompts
  originalPrompt: string;
  enhancedPrompt: string;

  // Research state (research mode)
  researchSources: ResearchSource[];
  researchCollapsed: boolean;

  // Outline state
  slides: GeneratedSlide[];

  // Streaming state - for real-time text display
  streamingBuffer: string;
  currentStreamingSlide: number;

  // Error state
  error: string | null;

  // Editing state
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;

  // Abort controller for cancellation
  abortController: AbortController | null;

  // Actions - Input
  setPrompt: (prompt: string) => void;
  setMode: (mode: GenerationMode) => void;

  // Actions - Generation
  setStatus: (status: GenerationStatus) => void;
  setDraftId: (draftId: string) => void;
  setEnhancedPrompt: (original: string, enhanced: string) => void;

  // Actions - Research
  addResearchSource: (source: ResearchSource) => void;
  setResearchCollapsed: (collapsed: boolean) => void;
  clearResearchSources: () => void;

  // Actions - Slides
  addSlide: (slide: GeneratedSlide) => void;
  updateSlide: (index: number, updates: Partial<GeneratedSlide>) => void;
  removeSlide: (index: number) => void;
  reorderSlides: (oldIndex: number, newIndex: number) => void;
  insertSlide: (afterIndex: number) => void;
  updateBullet: (slideIndex: number, bulletIndex: number, text: string) => void;
  addBullet: (slideIndex: number) => void;
  removeBullet: (slideIndex: number, bulletIndex: number) => void;

  // Actions - Error
  setError: (error: string | null) => void;

  // Actions - Streaming
  appendToBuffer: (chunk: string) => void;
  clearBuffer: () => void;
  setCurrentStreamingSlide: (index: number) => void;

  // Actions - Saving
  markSaved: () => void;
  markUnsaved: () => void;

  // Actions - Control
  setAbortController: (controller: AbortController | null) => void;
  cancel: () => void;
  reset: () => void;

  // Actions - Validation
  validateOutline: () => string[];
}

let saveTimeout: NodeJS.Timeout | null = null;

export const useOutlineGenerationStore = create<OutlineGenerationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      prompt: '',
      mode: 'fast',
      status: 'idle',
      draftId: null,
      originalPrompt: '',
      enhancedPrompt: '',
      researchSources: [],
      researchCollapsed: false,
      slides: [],
      streamingBuffer: '',
      currentStreamingSlide: 0,
      error: null,
      hasUnsavedChanges: false,
      lastSaved: null,
      abortController: null,

      // Actions - Input
      setPrompt: (prompt) => set({ prompt }),
      setMode: (mode) => set({ mode }),

      // Actions - Generation
      setStatus: (status) => set({ status }),
      setDraftId: (draftId) => set({ draftId }),
      setEnhancedPrompt: (original, enhanced) =>
        set({ originalPrompt: original, enhancedPrompt: enhanced }),

      // Actions - Research
      addResearchSource: (source) =>
        set((state) => ({
          researchSources: [...state.researchSources, source],
        })),
      setResearchCollapsed: (collapsed) =>
        set({ researchCollapsed: collapsed }),
      clearResearchSources: () => set({ researchSources: [] }),

      // Actions - Slides
      addSlide: (slide) =>
        set((state) => ({
          slides: [...state.slides, slide],
        })),

      updateSlide: (index, updates) => {
        const { slides } = get();
        const updatedSlides = slides.map((slide, idx) =>
          idx === index ? { ...slide, ...updates } : slide
        );
        set({ slides: updatedSlides, hasUnsavedChanges: true });

        // Debounced auto-save trigger (2 seconds)
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          // Auto-save will be handled by the component/hook
        }, 2000);
      },

      removeSlide: (index) => {
        const { slides } = get();
        if (slides.length <= 5) {
          set({ error: 'Minimum 5 slides required' });
          return;
        }

        const filteredSlides = slides.filter((_, idx) => idx !== index);
        const reindexedSlides = filteredSlides.map((slide, idx) => ({
          ...slide,
          index: idx,
        }));

        set({ slides: reindexedSlides, hasUnsavedChanges: true, error: null });
      },

      reorderSlides: (oldIndex, newIndex) => {
        const { slides } = get();
        const newSlides = [...slides];
        const [removed] = newSlides.splice(oldIndex, 1);
        newSlides.splice(newIndex, 0, removed);

        const reindexedSlides = newSlides.map((slide, idx) => ({
          ...slide,
          index: idx,
        }));

        set({ slides: reindexedSlides, hasUnsavedChanges: true });
      },

      insertSlide: (afterIndex) => {
        const { slides } = get();
        if (slides.length >= 20) {
          set({ error: 'Maximum 20 slides allowed' });
          return;
        }

        const newSlide: GeneratedSlide = {
          index: afterIndex + 1,
          title: '',
          bullets: [''],
        };

        const newSlides = [...slides];
        newSlides.splice(afterIndex + 1, 0, newSlide);

        const reindexedSlides = newSlides.map((slide, idx) => ({
          ...slide,
          index: idx,
        }));

        set({ slides: reindexedSlides, hasUnsavedChanges: true, error: null });
      },

      updateBullet: (slideIndex, bulletIndex, text) => {
        const { slides } = get();
        const updatedSlides = slides.map((slide, idx) => {
          if (idx === slideIndex) {
            const newBullets = [...slide.bullets];
            newBullets[bulletIndex] = text;
            return { ...slide, bullets: newBullets };
          }
          return slide;
        });

        set({ slides: updatedSlides, hasUnsavedChanges: true });
      },

      addBullet: (slideIndex) => {
        const { slides } = get();
        const updatedSlides = slides.map((slide, idx) => {
          if (idx === slideIndex) {
            return { ...slide, bullets: [...slide.bullets, ''] };
          }
          return slide;
        });

        set({ slides: updatedSlides, hasUnsavedChanges: true });
      },

      removeBullet: (slideIndex, bulletIndex) => {
        const { slides } = get();
        const slide = slides[slideIndex];

        // Must have at least one bullet
        if (slide.bullets.length <= 1) {
          return;
        }

        const updatedSlides = slides.map((s, idx) => {
          if (idx === slideIndex) {
            return {
              ...s,
              bullets: s.bullets.filter((_, bIdx) => bIdx !== bulletIndex),
            };
          }
          return s;
        });

        set({ slides: updatedSlides, hasUnsavedChanges: true });
      },

      // Actions - Error
      setError: (error) => set({ error }),

      // Actions - Streaming
      appendToBuffer: (chunk) =>
        set((state) => ({ streamingBuffer: state.streamingBuffer + chunk })),
      clearBuffer: () => set({ streamingBuffer: '' }),
      setCurrentStreamingSlide: (index) => set({ currentStreamingSlide: index }),

      // Actions - Saving
      markSaved: () => set({ hasUnsavedChanges: false, lastSaved: new Date() }),
      markUnsaved: () => set({ hasUnsavedChanges: true }),

      // Actions - Control
      setAbortController: (controller) => set({ abortController: controller }),

      cancel: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
        set({
          status: 'idle',
          slides: [],
          researchSources: [],
          draftId: null,
          error: null,
          abortController: null,
          originalPrompt: '',
          enhancedPrompt: '',
          streamingBuffer: '',
          currentStreamingSlide: 0,
        });
      },

      reset: () =>
        set({
          prompt: '',
          mode: 'fast',
          status: 'idle',
          draftId: null,
          originalPrompt: '',
          enhancedPrompt: '',
          researchSources: [],
          researchCollapsed: false,
          slides: [],
          streamingBuffer: '',
          currentStreamingSlide: 0,
          error: null,
          hasUnsavedChanges: false,
          lastSaved: null,
          abortController: null,
        }),

      // Actions - Validation
      validateOutline: () => {
        const { slides } = get();
        const errors: string[] = [];

        if (slides.length < 5) {
          errors.push('Minimum 5 slides required');
        }

        if (slides.length > 20) {
          errors.push('Maximum 20 slides allowed');
        }

        slides.forEach((slide, i) => {
          if (!slide.title.trim()) {
            errors.push(`Slide ${i + 1}: Title is required`);
          }
          if (
            slide.bullets.length === 0 ||
            !slide.bullets.some((b) => b.trim())
          ) {
            errors.push(`Slide ${i + 1}: At least one bullet required`);
          }
        });

        return errors;
      },
    }),
    { name: 'OutlineGenerationStore' }
  )
);
