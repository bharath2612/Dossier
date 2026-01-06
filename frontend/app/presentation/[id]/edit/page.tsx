'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SlideCanvas } from '@/components/presentation/editor/slide-canvas';
import { AutoSaveIndicator } from '@/components/outline/auto-save-indicator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ChevronLeft, ChevronRight, Plus, Trash2, LayoutGrid, Presentation as PresentationIcon } from 'lucide-react';
import type { Presentation, Slide } from '@/types/presentation';
import { deleteSlideImage } from '@/lib/supabase/storage';

export default function PresentationEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const presentationId = params.id as string;

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchPresentation();
    }
  }, [user, authLoading, presentationId, router]);

  const fetchPresentation = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.getPresentation(presentationId, user?.id);
      setPresentation(data.presentation);
      setSlides(data.presentation.slides);
    } catch (err) {
      console.error('Error loading presentation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load presentation');
    } finally {
      setLoading(false);
    }
  };

  const savePresentation = async () => {
    if (!presentation || !user) return;

    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.updatePresentation(
        presentationId,
        {
          slides,
          updated_at: new Date().toISOString(),
        },
        user.id
      );

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving presentation:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const debouncedSave = () => {
    setHasUnsavedChanges(true);
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const timeout = setTimeout(() => {
      savePresentation();
    }, 2500);
    setSaveTimeout(timeout);
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    setSlides(newSlides);
    debouncedSave();
  };

  const addSlide = (afterIndex: number) => {
    const newSlides = [...slides];
    const newSlide: Slide = {
      index: afterIndex + 1,
      title: 'New Slide',
      body: ['Add content here'],
      speakerNotes: [],
      type: 'content',
    };

    newSlides.splice(afterIndex + 1, 0, newSlide);

    // Reindex slides
    const reindexedSlides = newSlides.map((slide, index) => ({
      ...slide,
      index,
    }));

    setSlides(reindexedSlides);
    setCurrentSlideIndex(afterIndex + 1);
    debouncedSave();
  };

  const removeSlide = async (index: number) => {
    if (slides.length <= 1) {
      alert('Cannot delete the last slide');
      return;
    }

    if (!confirm('Are you sure you want to delete this slide?')) {
      return;
    }

    // Delete image from storage if exists
    const slideToRemove = slides[index];
    if (slideToRemove.image?.storagePath) {
      try {
        await deleteSlideImage(slideToRemove.image.storagePath);
      } catch (err) {
        console.warn('Failed to delete slide image:', err);
      }
    }

    const newSlides = slides.filter((_, i) => i !== index);

    // Reindex slides
    const reindexedSlides = newSlides.map((slide, idx) => ({
      ...slide,
      index: idx,
    }));

    setSlides(reindexedSlides);

    // Adjust current slide index if needed
    if (currentSlideIndex >= reindexedSlides.length) {
      setCurrentSlideIndex(reindexedSlides.length - 1);
    } else if (currentSlideIndex > index) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }

    debouncedSave();
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        goToPreviousSlide();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, slides.length]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-border border-t-brand mx-auto" />
          <p className="text-sm text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-lg text-destructive">{error || 'Presentation not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg border border-border px-6 py-2 text-sm text-foreground transition-colors hover:border-brand/50"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed header */}
      <div className="fixed left-0 right-0 top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/presentation/${presentationId}`)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Preview
            </button>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-sm font-medium text-foreground">{presentation.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* View mode toggle */}
            <div className="flex items-center rounded-md border border-border">
              <button
                onClick={() => setViewMode('single')}
                className={`rounded-l-md px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'single'
                    ? 'bg-brand text-brand-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PresentationIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-r-md px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-brand text-brand-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main content */}
      {viewMode === 'single' ? (
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-20">
          {/* Slide editor */}
          <div className="mb-6 overflow-hidden rounded-xl border border-border shadow-lg">
            {currentSlide && (
              <SlideCanvas
                slide={currentSlide}
                citationStyle={presentation.citation_style}
                theme={presentation.theme}
                presentationId={presentationId}
                onUpdate={(updates) => updateSlide(currentSlideIndex, updates)}
              />
            )}
          </div>

          {/* Slide navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={goToPreviousSlide}
              disabled={currentSlideIndex === 0}
              className="rounded-md border border-border bg-card p-2 text-foreground transition-colors hover:border-brand/50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Slide thumbnails */}
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlideIndex
                      ? 'w-8 bg-brand'
                      : 'w-2 bg-border hover:bg-muted-foreground'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="rounded-md border border-border bg-card p-2 text-foreground transition-colors hover:border-brand/50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Slide info and actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground">
                Slide {currentSlideIndex + 1} of {slides.length}
              </span>
              <select
                value={currentSlide?.type || 'content'}
                onChange={(e) => updateSlide(currentSlideIndex, { type: e.target.value as Slide['type'] })}
                className="rounded border border-border bg-card px-2 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground outline-none transition-colors hover:border-brand/50"
              >
                <option value="intro">Introduction</option>
                <option value="content">Content</option>
                <option value="data">Data</option>
                <option value="quote">Quote</option>
                <option value="conclusion">Conclusion</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => addSlide(currentSlideIndex)}
                disabled={slides.length >= 20}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
                Add Slide
              </button>
              <button
                onClick={() => removeSlide(currentSlideIndex)}
                disabled={slides.length <= 1}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-20">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {slides.map((slide, index) => (
              <button
                key={slide.index}
                onClick={() => {
                  setCurrentSlideIndex(index);
                  setViewMode('single');
                }}
                className={`group relative overflow-hidden rounded-lg border transition-all hover:border-brand/50 ${
                  index === currentSlideIndex ? 'border-brand ring-2 ring-brand/20' : 'border-border'
                }`}
              >
                {/* Slide thumbnail */}
                <div className="aspect-video overflow-hidden pointer-events-none">
                  <div className="scale-[0.25] origin-top-left w-[400%] h-[400%]">
                    <SlideCanvas
                      slide={slide}
                      citationStyle={presentation.citation_style}
                      theme={presentation.theme}
                      presentationId={presentationId}
                      onUpdate={(updates) => updateSlide(index, updates)}
                    />
                  </div>
                </div>

                {/* Slide number */}
                <div className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                  {index + 1}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(index);
                  }}
                  disabled={slides.length <= 1}
                  className="absolute right-2 top-2 rounded bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur-sm transition-all hover:text-destructive group-hover:opacity-100 disabled:hidden"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            ))}

            {/* Add slide button */}
            {slides.length < 20 && (
              <button
                onClick={() => addSlide(slides.length - 1)}
                className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-8 w-8" />
                  <span className="text-sm">Add Slide</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <AutoSaveIndicator hasUnsavedChanges={hasUnsavedChanges} lastSaved={lastSaved} />

            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                Use arrow keys to navigate
              </span>
              <button
                onClick={() => router.push(`/presentation/${presentationId}`)}
                className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition-all hover:bg-[#0f6640]"
              >
                Done Editing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
