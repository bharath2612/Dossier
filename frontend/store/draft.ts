import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Draft, Outline, OutlineSlide, SlideType } from './types';

interface DraftStore {
  // State
  currentDraft: Draft | null;
  outline: Outline | null;
  isGenerating: boolean;
  progress: number;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  _hasHydrated: boolean;

  // Actions
  setCurrentDraft: (draft: Draft | null) => void;
  setOutline: (outline: Outline) => void;
  updateOutlineSlide: (index: number, updates: Partial<OutlineSlide>) => void;
  reorderSlides: (oldIndex: number, newIndex: number) => void;
  addSlide: (afterIndex: number) => void;
  removeSlide: (index: number) => void;
  saveDraft: () => Promise<void>;
  generateOutline: (prompt: string) => Promise<void>;
  setGenerating: (isGenerating: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  markSaved: () => void;
  clearDraft: () => void;
  setHasHydrated: (state: boolean) => void;
}

let saveTimeout: NodeJS.Timeout | null = null;

export const useDraftStore = create<DraftStore>()(
  devtools(
    persist(
      (set, get) => ({
      // Initial state
      currentDraft: null,
      outline: null,
      isGenerating: false,
      progress: 0,
      error: null,
      hasUnsavedChanges: false,
      lastSaved: null,
      _hasHydrated: false,

      // Actions
      setCurrentDraft: (draft) => set({ currentDraft: draft }),

      setOutline: (outline) =>
        set({ outline, hasUnsavedChanges: true }),

      updateOutlineSlide: (index, updates) => {
        const { outline } = get();
        if (!outline) return;

        const updatedSlides = outline.slides.map((slide, idx) =>
          idx === index ? { ...slide, ...updates } : slide
        );

        set({
          outline: { ...outline, slides: updatedSlides },
          hasUnsavedChanges: true,
        });

        // Debounced auto-save (2-3 seconds)
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          get().saveDraft();
        }, 2500);
      },

      reorderSlides: (oldIndex, newIndex) => {
        const { outline } = get();
        if (!outline) return;

        const slides = [...outline.slides];
        const [removed] = slides.splice(oldIndex, 1);
        slides.splice(newIndex, 0, removed);

        // Update indices
        const updatedSlides = slides.map((slide, idx) => ({
          ...slide,
          index: idx,
        }));

        set({
          outline: { ...outline, slides: updatedSlides },
          hasUnsavedChanges: true,
        });

        // Debounced auto-save
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          get().saveDraft();
        }, 2500);
      },

      addSlide: (afterIndex) => {
        const { outline } = get();
        if (!outline) return;

        const newSlide: OutlineSlide = {
          index: afterIndex + 1,
          title: 'New Slide',
          bullets: ['Bullet point 1'],
          type: 'content',
        };

        const slides = [...outline.slides];
        slides.splice(afterIndex + 1, 0, newSlide);

        // Update indices
        const updatedSlides = slides.map((slide, idx) => ({
          ...slide,
          index: idx,
        }));

        set({
          outline: { ...outline, slides: updatedSlides },
          hasUnsavedChanges: true,
        });

        // Debounced auto-save
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          get().saveDraft();
        }, 2500);
      },

      removeSlide: (index) => {
        const { outline } = get();
        if (!outline || outline.slides.length <= 5) {
          set({ error: 'Minimum 5 slides required' });
          return;
        }

        const slides = outline.slides.filter((_, idx) => idx !== index);

        // Update indices
        const updatedSlides = slides.map((slide, idx) => ({
          ...slide,
          index: idx,
        }));

        set({
          outline: { ...outline, slides: updatedSlides },
          hasUnsavedChanges: true,
          error: null,
        });

        // Debounced auto-save
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          get().saveDraft();
        }, 2500);
      },

      saveDraft: async () => {
        const { outline, currentDraft } = get();
        if (!outline) return;

        try {
          const { apiClient } = await import('@/lib/api/client');

          if (currentDraft?.id) {
            // Update existing draft
            const updateResult = await apiClient.updateDraft(currentDraft.id, { outline });

            set({
              currentDraft: updateResult.draft,
              hasUnsavedChanges: false,
              lastSaved: new Date(),
              error: null,
            });
          } else {
            // Create new draft (shouldn't happen in normal flow, but handle it)
            const createResult = await apiClient.createDraft({
              title: outline.title,
              prompt: currentDraft?.prompt || '',
              enhanced_prompt: currentDraft?.enhanced_prompt,
              outline,
            });

            set({
              currentDraft: createResult.draft,
              hasUnsavedChanges: false,
              lastSaved: new Date(),
              error: null,
            });
          }
        } catch (error) {
          console.error('Save draft error:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to save draft',
          });
        }
      },

      generateOutline: async (prompt) => {
        set({ isGenerating: true, progress: 0, error: null });

        try {
          // TODO: API call to generate outline
          // Step 1: Preprocess prompt (show progress 0-20%)
          set({ progress: 10 });
          // const preprocessResponse = await fetch('/api/preprocess', {
          //   method: 'POST',
          //   body: JSON.stringify({ prompt }),
          // });
          // const { enhanced_prompt } = await preprocessResponse.json();

          // Step 2: Generate outline (show progress 20-100%)
          set({ progress: 30 });
          // const outlineResponse = await fetch('/api/generate-outline', {
          //   method: 'POST',
          //   body: JSON.stringify({ enhanced_prompt }),
          // });
          // const { draft_id, outline } = await outlineResponse.json();

          // set({
          //   currentDraft: { id: draft_id, ... },
          //   outline,
          //   isGenerating: false,
          //   progress: 100,
          // });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate outline',
            isGenerating: false,
            progress: 0,
          });
        }
      },

      setGenerating: (isGenerating) => set({ isGenerating }),
      setProgress: (progress) => set({ progress }),
      setError: (error) => set({ error }),
      markSaved: () => set({ hasUnsavedChanges: false, lastSaved: new Date() }),
      clearDraft: () =>
        set({
          currentDraft: null,
          outline: null,
          hasUnsavedChanges: false,
          lastSaved: null,
          error: null,
        }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'dossier-draft-store',
      // Only persist the essential data, not transient state
      partialize: (state) => ({
        currentDraft: state.currentDraft,
        outline: state.outline,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  ),
  { name: 'DraftStore' }
  )
);
