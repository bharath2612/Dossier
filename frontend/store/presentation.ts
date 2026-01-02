import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Presentation, Slide, Theme, CitationStyle } from './types';

interface PresentationStore {
  // State
  currentPresentation: Presentation | null;
  presentations: Presentation[];
  loading: boolean;
  error: string | null;
  saving: boolean;

  // Actions
  setCurrentPresentation: (presentation: Presentation | null) => void;
  setPresentations: (presentations: Presentation[]) => void;
  updateSlide: (slideIndex: number, updates: Partial<Slide>) => Promise<void>;
  updateTitle: (title: string) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setCitationStyle: (style: CitationStyle) => Promise<void>;
  fetchPresentations: () => Promise<void>;
  fetchPresentation: (id: string) => Promise<void>;
  duplicatePresentation: (id: string) => Promise<void>;
  deletePresentation: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
}

export const usePresentationStore = create<PresentationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentPresentation: null,
      presentations: [],
      loading: false,
      error: null,
      saving: false,

      // Actions
      setCurrentPresentation: (presentation) =>
        set({ currentPresentation: presentation }),

      setPresentations: (presentations) => set({ presentations }),

      updateSlide: async (slideIndex, updates) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;

        // Optimistic update
        const updatedSlides = currentPresentation.slides.map((slide, idx) =>
          idx === slideIndex ? { ...slide, ...updates } : slide
        );

        set({
          currentPresentation: {
            ...currentPresentation,
            slides: updatedSlides,
          },
          saving: true,
        });

        try {
          // TODO: API call to update presentation
          // await fetch(`/api/presentations/${currentPresentation.id}`, {
          //   method: 'PATCH',
          //   body: JSON.stringify({ slides: updatedSlides }),
          // });

          set({ saving: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update slide',
            saving: false,
          });
        }
      },

      updateTitle: async (title) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;

        // Optimistic update
        set({
          currentPresentation: { ...currentPresentation, title },
          saving: true,
        });

        try {
          // TODO: API call to update presentation
          // await fetch(`/api/presentations/${currentPresentation.id}`, {
          //   method: 'PATCH',
          //   body: JSON.stringify({ title }),
          // });

          set({ saving: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update title',
            saving: false,
          });
        }
      },

      setTheme: async (theme) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;

        // Optimistic update
        set({
          currentPresentation: { ...currentPresentation, theme },
          saving: true,
        });

        try {
          // TODO: API call to update presentation
          // await fetch(`/api/presentations/${currentPresentation.id}`, {
          //   method: 'PATCH',
          //   body: JSON.stringify({ theme }),
          // });

          set({ saving: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update theme',
            saving: false,
          });
        }
      },

      setCitationStyle: async (citation_style) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;

        // Optimistic update
        set({
          currentPresentation: { ...currentPresentation, citation_style },
          saving: true,
        });

        try {
          // TODO: API call to update presentation
          // await fetch(`/api/presentations/${currentPresentation.id}`, {
          //   method: 'PATCH',
          //   body: JSON.stringify({ citation_style }),
          // });

          set({ saving: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to update citation style',
            saving: false,
          });
        }
      },

      fetchPresentations: async () => {
        set({ loading: true, error: null });

        try {
          // TODO: API call to fetch presentations
          // const response = await fetch('/api/presentations');
          // const data = await response.json();
          // set({ presentations: data, loading: false });

          // Mock data for now
          set({ presentations: [], loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to fetch presentations',
            loading: false,
          });
        }
      },

      fetchPresentation: async (id) => {
        set({ loading: true, error: null });

        try {
          // TODO: API call to fetch single presentation
          // const response = await fetch(`/api/presentations/${id}`);
          // const data = await response.json();
          // set({ currentPresentation: data, loading: false });

          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to fetch presentation',
            loading: false,
          });
        }
      },

      duplicatePresentation: async (id) => {
        set({ loading: true, error: null });

        try {
          // TODO: API call to duplicate presentation
          // const response = await fetch(`/api/presentations/${id}/duplicate`, {
          //   method: 'POST',
          // });
          // const newPresentation = await response.json();

          // Refresh presentations list
          // get().fetchPresentations();

          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to duplicate presentation',
            loading: false,
          });
        }
      },

      deletePresentation: async (id) => {
        set({ loading: true, error: null });

        try {
          // TODO: API call to delete presentation
          // await fetch(`/api/presentations/${id}`, { method: 'DELETE' });

          // Remove from local state
          const presentations = get().presentations.filter((p) => p.id !== id);
          set({ presentations, loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to delete presentation',
            loading: false,
          });
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSaving: (saving) => set({ saving }),
    }),
    { name: 'PresentationStore' }
  )
);
