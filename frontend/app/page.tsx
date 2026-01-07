'use client';

import { Suspense, useEffect, useCallback, useState } from 'react';
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
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  // Handle Google sign-in (for both Sign Up and Log In)
  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await signInWithGoogle();
      // The page will redirect to Google, then back via callback
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthError(err instanceof Error ? err.message : 'Failed to sign in');
      setIsSigningIn(false);
    }
  };

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
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  'Signing in...'
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign In
                  </>
                )}
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 pb-12">
        {/* Error Display */}
        {(error || hasError || authError) && (
          <div className="w-full max-w-3xl mx-auto mb-6">
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-destructive">{error || authError || 'An error occurred'}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setAuthError(null);
                  }}
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
                Create outlines for free • Sign in to generate presentations
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
