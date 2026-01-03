import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Presentation, Slide, Theme, CitationStyle, ContentBlock } from './types';

interface PresentationStore {
  // State
  currentPresentation: Presentation | null;
  presentations: Presentation[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  userId: string | null;

  // Actions
  setCurrentPresentation: (presentation: Presentation | null) => void;
  setPresentations: (presentations: Presentation[]) => void;
  updateSlide: (slideIndex: number, updates: Partial<Slide>) => Promise<void>;
  updatePresentation: (updates: Partial<Presentation>) => void;
  updateTitle: (title: string) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setCitationStyle: (style: CitationStyle) => Promise<void>;
  savePresentation: () => Promise<void>;
  fetchPresentations: () => Promise<void>;
  fetchPresentation: (id: string) => Promise<void>;
  duplicatePresentation: (id: string) => Promise<void>;
  deletePresentation: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
  setUserId: (userId: string | null) => void;
}

// Debounce timeout for auto-save
let saveTimeout: NodeJS.Timeout | null = null;

export const usePresentationStore = create<PresentationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentPresentation: null,
      presentations: [],
      loading: false,
      error: null,
      saving: false,
      hasUnsavedChanges: false,
      lastSaved: null,
      saveError: null,
      userId: null,

      // Actions
      setCurrentPresentation: (presentation) =>
        set({ 
          currentPresentation: presentation,
          hasUnsavedChanges: false,
          lastSaved: presentation ? new Date() : null,
          saveError: null,
        }),
      
      setUserId: (userId) => set({ userId }),

      setPresentations: (presentations) => set({ presentations }),

      updateSlide: async (slideIndex, updates) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;

        // Optimistic update
        const updatedSlides = currentPresentation.slides.map((slide, idx) =>
          idx === slideIndex ? { ...slide, ...updates } : slide
        );

        get().updatePresentation({ slides: updatedSlides });
      },

      // Main update method that triggers auto-save
      updatePresentation: (updates) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;

        // Optimistic update
        set({
          currentPresentation: {
            ...currentPresentation,
            ...updates,
          },
          hasUnsavedChanges: true,
          saveError: null,
        });

        // Debounce save
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          get().savePresentation();
        }, 2500);
      },

      updateTitle: async (title) => {
        get().updatePresentation({ title });
      },

      setTheme: async (theme) => {
        get().updatePresentation({ theme });
      },

      setCitationStyle: async (citation_style) => {
        get().updatePresentation({ citation_style });
      },

      // Save presentation to database
      savePresentation: async () => {
        const { currentPresentation, userId } = get();
        if (!currentPresentation || !userId) return;

        set({ saving: true, saveError: null });

        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          
          // Prepare update payload - save the entire presentation state
          // This handles both slides (legacy) and content_blocks (new widget-based editor)
          const updates: any = {
            slides: currentPresentation.slides,
            updated_at: new Date().toISOString(),
          };

          // Also save title, theme, citation_style if they exist
          if (currentPresentation.title) updates.title = currentPresentation.title;
          if (currentPresentation.theme) updates.theme = currentPresentation.theme;
          if (currentPresentation.citation_style) updates.citation_style = currentPresentation.citation_style;

          const response = await fetch(
            `${API_URL}/api/presentations/${currentPresentation.id}?user_id=${userId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updates),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to save presentation');
          }

          const data = await response.json();
          const savedPresentation = data.presentation;

          set({
            currentPresentation: savedPresentation,
            saving: false,
            hasUnsavedChanges: false,
            lastSaved: new Date(),
            saveError: null,
          });
        } catch (error) {
          console.error('Error saving presentation:', error);
          set({
            saving: false,
            saveError: error instanceof Error ? error.message : 'Failed to save presentation',
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
