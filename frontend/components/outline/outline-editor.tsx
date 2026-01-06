'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { useDraftStore } from '@/store/draft';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { OutlineEditorCard } from './outline-editor-card';
import { AutoSaveIndicator } from './auto-save-indicator';
import { AuthGateModal } from '../auth/auth-gate-modal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  CitationStyleSelector,
  type CitationStyle,
} from './citation-style-selector';
import { ThemeSelector } from './theme-selector';
import type { Theme } from '@/types/presentation';

interface OutlineEditorProps {
  onBack: () => void;
}

export function OutlineEditor({ onBack }: OutlineEditorProps) {
  const router = useRouter();
  const {
    outline,
    hasUnsavedChanges,
    lastSaved,
    error,
    currentDraft,
    updateOutlineSlide,
    reorderSlides,
    addSlide,
    removeSlide,
  } = useDraftStore();

  const { user, loading: authLoading } = useAuth();
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('inline');
  const [theme, setTheme] = useState<Theme>('minimal');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !outline) return;

    const oldIndex = outline.slides.findIndex((s) => s.index === active.id);
    const newIndex = outline.slides.findIndex((s) => s.index === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderSlides(oldIndex, newIndex);
    }
  };

  const handleGeneratePresentation = async () => {
    // Check if user is authenticated
    if (!user) {
      // Store intent to generate after auth (data is in Zustand store which persists)
      sessionStorage.setItem('generate_after_auth', 'true');
      sessionStorage.setItem('citation_style', citationStyle);
      sessionStorage.setItem('theme', theme);
      setShowAuthModal(true);
      return;
    }

    if (!outline || !currentDraft) {
      setGenerationError('No outline available');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationError(null);

      // Ensure user exists in public.users before generating
      await apiClient.ensureUser({
        user_id: user.id,
        email: user.email,
      });

      // Generate presentation
      const data = await apiClient.generatePresentation({
        draft_id: currentDraft.id,
        outline,
        citation_style: citationStyle,
        theme: theme,
        user_id: user.id,
      });

      console.log('Presentation generation started:', data);

      // Navigate to presentation viewer immediately (use replace to avoid back-button issues)
      // The presentation page will show a loading state and poll for completion
      router.replace(`/presentation/${data.presentation_id}`);
    } catch (err) {
      console.error('Generation error:', err);
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate presentation');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!outline) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <p className="text-muted-foreground">No outline available</p>
      </div>
    );
  }

  const slideCount = outline.slides.length;
  const isValidForGeneration = slideCount >= 5 && slideCount <= 20;

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Fixed header */}
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Start over
          </button>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-brand" />
            <h1 className="text-sm font-medium text-foreground">{outline.title}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-6 pb-64 pt-20">
        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={outline.slides.map((s) => s.index)}
              strategy={verticalListSortingStrategy}
            >
              {outline.slides.map((slide, index) => (
                <motion.div
                  key={slide.index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <OutlineEditorCard
                    slide={slide}
                    slideCount={slideCount}
                    onUpdate={(updates) => updateOutlineSlide(index, updates)}
                    onAdd={() => addSlide(index)}
                    onRemove={() => removeSlide(index)}
                  />
                </motion.div>
              ))}
            </SortableContext>
          </DndContext>

          {/* Validation warnings */}
          {slideCount < 5 && (
            <div className="flex items-center gap-3 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-yellow-500">
                Add {5 - slideCount} more {slideCount === 4 ? 'slide' : 'slides'} (minimum 5 required)
              </p>
            </div>
          )}
          {slideCount >= 18 && slideCount < 20 && (
            <div className="flex items-center gap-3 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-yellow-500">
                Maximum 20 slides allowed ({20 - slideCount} remaining)
              </p>
            </div>
          )}
          {slideCount === 20 && (
            <div className="flex items-center gap-3 rounded-md border border-border bg-secondary p-4">
              <p className="text-sm text-muted-foreground">Maximum slide limit reached</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          {/* Settings and status row */}
          <div className="mb-4 space-y-4">
            {/* Status */}
            <div className="flex items-center space-x-6">
              <AutoSaveIndicator hasUnsavedChanges={hasUnsavedChanges} lastSaved={lastSaved} />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Citation style selector */}
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Citation Style
                </label>
                <CitationStyleSelector value={citationStyle} onChange={setCitationStyle} />
              </div>

              {/* Theme selector */}
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Theme
                </label>
                <ThemeSelector value={theme} onChange={setTheme} />
              </div>
            </div>
          </div>

          {/* Generation error */}
          {generationError && (
            <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{generationError}</p>
            </div>
          )}

          {/* Generate button */}
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={handleGeneratePresentation}
            disabled={!isValidForGeneration || isGenerating || authLoading}
          >
            {isGenerating ? 'Generating Presentation...' : 'Generate Presentation'}
          </Button>
        </div>
      </footer>

      {/* Auth gate modal */}
      <AuthGateModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthComplete={handleGeneratePresentation}
      />
    </div>
  );
}
