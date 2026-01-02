'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { GenerationProgress } from '@/components/outline/generation-progress';
import { OutlineEditor } from '@/components/outline/outline-editor';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { apiClient } from '@/lib/api/client';
import { useDraftStore } from '@/store/draft';
import { useAuth } from '@/hooks/useAuth';
import type { GenerateOutlineResponse } from '@/lib/api/client';

type Stage = 'input' | 'generating' | 'editing';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stage, setStage] = useState<Stage>('input');
  const [prompt, setPrompt] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [outline, setOutline] = useState<GenerateOutlineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const { setOutline: setDraftOutline, setCurrentDraft, outline: storedOutline } = useDraftStore();

  // Redirect logged-in users to dashboard (unless they're in the middle of generating)
  useEffect(() => {
    if (!loading && user && stage === 'input' && !storedOutline) {
      console.log('[Landing] User is logged in, redirecting to dashboard');
      setRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, loading, stage, storedOutline, router]);

  // Check for auth/generation errors
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'auth_failed') {
      setError('Authentication failed. Please try again.');
      // If we have an outline, go to editor so user can retry
      if (storedOutline) {
        setStage('editing');
      }
    }
  }, [searchParams, storedOutline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 10) return;

    setError(null);
    setStage('generating');
    setCurrentStep(0);
    setProgress(0);

    try {
      setCurrentStep(0);
      setProgress(10);

      const preprocessResult = await apiClient.preprocessPrompt(prompt);
      setProgress(20);

      setCurrentStep(1);
      setProgress(30);

      const outlineResult = await apiClient.generateOutline(
        preprocessResult.enhanced_prompt,
        (p) => {
          setProgress(30 + p * 0.7);
          if (p > 50) setCurrentStep(2);
        }
      );

      setOutline(outlineResult);
      setProgress(100);
      setCurrentStep(3);

      // Sync to Draft Store and go directly to editor
      setCurrentDraft({
        id: outlineResult.draft_id,
        title: outlineResult.title,
        prompt: prompt,
        enhanced_prompt: '',
        outline: {
          title: outlineResult.title,
          slides: outlineResult.outline.slides,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setDraftOutline({
        title: outlineResult.title,
        slides: outlineResult.outline.slides,
      });

      setTimeout(() => setStage('editing'), 500);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate outline');
      setStage('input');
    }
  };

  const handleStartOver = () => {
    setStage('input');
    setPrompt('');
    setOutline(null);
    setError(null);
  };

  const handleBackToInput = () => {
    setStage('input');
    setPrompt('');
    setOutline(null);
    setError(null);
  };

  // Show loading state while checking auth or redirecting
  if (loading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand mx-auto" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {redirecting ? 'Redirecting to dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Header */}
      {stage === 'input' && (
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
            <div className="flex items-center gap-4">
              {user && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      {/* Stage: Input */}
      {stage === 'input' && (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-16">
          <div className="w-full max-w-3xl">
            {/* Error */}
            {error && (
              <div className="mb-8 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Caption */}
            <div className="mb-4 text-center">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                AI-Powered Research
              </span>
            </div>

            {/* Headline */}
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Research-backed presentations
              </h1>
              <p className="text-lg text-muted-foreground">
                Generate presentations backed by credible sources. No fluff.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your presentation topic..."
                  className="w-full resize-none rounded-lg border border-border bg-card px-5 py-4 pr-32 text-base leading-relaxed text-foreground placeholder-muted-foreground outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  rows={4}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={prompt.trim().length < 10}
                  className="absolute bottom-4 right-4 rounded-md bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition-all hover:bg-[#0f6640] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Generate
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Press <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs">⌘</kbd> +{' '}
                <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to generate
              </p>
            </form>

            {/* Examples */}
            <div className="text-center">
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Try an example
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Sales strategies for B2B SaaS',
                  'Building remote teams',
                  'Sustainable energy future',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    className="rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-all hover:border-brand/50 hover:text-foreground"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="fixed bottom-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              No signup required • Sign in after outline
            </p>
          </div>
        </div>
      )}

      {/* Stage: Generating */}
      {stage === 'generating' && (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-2xl">
            <p className="mb-4 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Processing
            </p>
            <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
              Generating outline...
            </h2>
            <GenerationProgress currentStep={currentStep} progress={progress} />
          </div>
        </div>
      )}

      {/* Stage: Editing */}
      {stage === 'editing' && <OutlineEditor onBack={handleBackToInput} />}
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

export default function LandingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LandingPageContent />
    </Suspense>
  );
}
