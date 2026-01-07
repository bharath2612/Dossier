'use client';

import { Suspense, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { useOutlineGenerationStore } from '@/store/outline-generation';
import { useOutlineStream } from '@/lib/hooks/useOutlineStream';
import { useOutlineAutoSave } from '@/lib/hooks/useOutlineAutoSave';
import {
  PromptInput,
  PromptBanner,
  ResearchFeed,
  OutlineList,
  GenerateCTA,
} from '@/components/outline-generator';
import { AutoSaveIndicator } from '@/components/outline/auto-save-indicator';
import type { GenerationMode } from '@/store/types';

function OutlineGeneratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const store = useOutlineGenerationStore();
  const { startGeneration, cancel } = useOutlineStream();

  // Auto-save outline edits to draft
  const { hasUnsavedChanges, lastSaved } = useOutlineAutoSave();

  const {
    status,
    slides,
    error,
    originalPrompt,
    enhancedPrompt,
    mode,
    researchSources,
    researchCollapsed,
    draftId,
    setResearchCollapsed,
    reset,
    setError,
  } = store;

  // Handle URL state for draft restoration
  useEffect(() => {
    const draftParam = searchParams.get('draft');
    if (draftParam && status === 'idle') {
      // TODO: Implement draft restoration from URL
      // This would fetch the draft and restore state
    }
  }, [searchParams, status]);

  // Update URL when draft is created
  useEffect(() => {
    if (draftId && status !== 'idle') {
      const url = new URL(window.location.href);
      url.searchParams.set('draft', draftId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [draftId, status]);

  // Clear URL when reset
  useEffect(() => {
    if (status === 'idle' && !draftId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('draft');
      window.history.replaceState({}, '', url.toString());
    }
  }, [status, draftId]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (prompt: string, selectedMode: GenerationMode) => {
      setError(null);
      await startGeneration(prompt, selectedMode);
    },
    [startGeneration, setError]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  // Handle start over
  const handleStartOver = useCallback(() => {
    reset();
    const url = new URL(window.location.href);
    url.searchParams.delete('draft');
    window.history.replaceState({}, '', url.toString());
  }, [reset]);

  const isIdle = status === 'idle';
  const isGenerating = status === 'preprocessing' || status === 'researching' || status === 'generating';
  const isComplete = status === 'complete';
  const hasError = status === 'error';

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand mx-auto" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Dossier AI"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-sm font-medium text-foreground">Dossier AI</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            {isComplete && (
              <AutoSaveIndicator
                hasUnsavedChanges={hasUnsavedChanges}
                lastSaved={lastSaved}
              />
            )}
            {!isIdle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartOver}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start over
              </Button>
            )}
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 pb-12">
        {/* Error Display */}
        {(error || hasError) && (
          <div className="w-full max-w-3xl mx-auto mb-6">
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-destructive">{error || 'An error occurred'}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-destructive hover:text-destructive/80"
                >
                  &times;
                </button>
              </div>
              {hasError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartOver}
                  className="mt-3"
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Input Stage */}
        {isIdle && (
          <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center">
            <PromptInput onSubmit={handleSubmit} disabled={false} />

            {/* Footer */}
            <div className="fixed bottom-6 text-center">
              <p className="font-mono text-xs text-muted-foreground">
                No signup required • Sign in after outline
              </p>
            </div>
          </div>
        )}

        {/* Generation/Complete Stage */}
        {!isIdle && (
          <div className="w-full">
            {/* Prompt Banner */}
            <PromptBanner
              originalPrompt={originalPrompt}
              enhancedPrompt={enhancedPrompt}
              mode={mode}
              status={status}
              onCancel={isGenerating ? handleCancel : undefined}
            />

            {/* Research Feed (Research mode only) */}
            {mode === 'research' && (
              <ResearchFeed
                sources={researchSources}
                status={status}
                isCollapsed={researchCollapsed}
                onToggleCollapse={setResearchCollapsed}
              />
            )}

            {/* Outline List */}
            <OutlineList
              slides={slides}
              status={status}
              streamingBuffer={store.streamingBuffer}
              currentStreamingSlide={store.currentStreamingSlide}
            />

            {/* Generate CTA */}
            {isComplete && (
              <GenerateCTA slideCount={slides.length} draftId={draftId} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
      <div className="text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand mx-auto" />
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Loading
        </p>
      </div>
    </div>
  );
}

export default function OutlineGeneratorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OutlineGeneratorContent />
    </Suspense>
  );
}
