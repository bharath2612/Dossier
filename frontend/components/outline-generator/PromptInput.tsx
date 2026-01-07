'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GenerationMode } from '@/store/types';

const EXAMPLE_PROMPTS = [
  'The future of renewable energy in Southeast Asia',
  'Sales strategies for B2B SaaS in 2025',
  'Remote team leadership best practices',
  'AI in healthcare: opportunities and challenges',
  'Building a successful startup pitch deck',
  'Digital transformation in traditional industries',
];

interface PromptInputProps {
  onSubmit: (prompt: string, mode: GenerationMode) => void;
  disabled?: boolean;
}

export function PromptInput({ onSubmit, disabled = false }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('fast');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Cycle through placeholders with slide-up animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length);
        setIsAnimating(false);
      }, 300); // Half of transition time
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim().length >= 30 && !disabled) {
        onSubmit(prompt.trim(), mode);
      }
    },
    [prompt, mode, disabled, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const isValid = prompt.trim().length >= 30;

  return (
    <div className="w-full max-w-3xl mx-auto">
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
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          {/* Animated placeholder */}
          {!prompt && (
            <div className="pointer-events-none absolute left-5 top-4 text-base text-muted-foreground overflow-hidden h-[1.5rem]">
              <div
                className={cn(
                  'transition-all duration-300',
                  isAnimating ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'
                )}
              >
                e.g., {EXAMPLE_PROMPTS[placeholderIndex]}
              </div>
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=""
            disabled={disabled}
            className={cn(
              'w-full resize-none rounded-xl border border-border bg-card px-5 py-4 text-base leading-relaxed text-foreground placeholder-muted-foreground outline-none transition-all',
              'focus:border-brand focus:ring-2 focus:ring-brand/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[120px]'
            )}
            rows={4}
          />

          {/* Character count indicator */}
          <div className="absolute bottom-3 left-5">
            <span
              className={cn(
                'font-mono text-xs',
                prompt.length < 30
                  ? 'text-muted-foreground'
                  : 'text-brand'
              )}
            >
              {prompt.length}/30 min
            </span>
          </div>
        </div>

        {/* Mode Toggle + Submit */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          {/* Mode Pills */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('fast')}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                mode === 'fast'
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <Sparkles className="h-4 w-4" />
              Fast
            </button>
            <button
              type="button"
              onClick={() => setMode('research')}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                mode === 'research'
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <Search className="h-4 w-4" />
              Research
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || disabled}
            className={cn(
              'flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition-all',
              'hover:bg-[#0f6640]',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <span>Generate</span>
            <span className="text-xs opacity-60 ml-1">
              {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+↵
            </span>
          </button>
        </div>

        {/* Mode Description - Only for research mode */}
        {mode === 'research' && (
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Web research for data-backed content with citations (takes longer)
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

export default PromptInput;
