'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Search, ArrowRight } from 'lucide-react';
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

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % EXAMPLE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim().length >= 20 && !disabled) {
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

  const isValid = prompt.trim().length >= 20;

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
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`e.g., ${EXAMPLE_PROMPTS[placeholderIndex]}`}
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
                prompt.length < 20
                  ? 'text-muted-foreground'
                  : 'text-brand'
              )}
            >
              {prompt.length}/20 min
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
            Generate
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Description */}
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            {mode === 'fast' ? (
              <>Instant outline generation using AI knowledge</>
            ) : (
              <>Web research for data-backed content with citations (takes longer)</>
            )}
          </p>
        </div>

        {/* Keyboard Hint */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Press{' '}
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs">
            {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>{' '}
          +{' '}
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs">
            Enter
          </kbd>{' '}
          to generate
        </p>
      </form>

      {/* Example Prompts */}
      <div className="text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Try an example
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_PROMPTS.slice(0, 3).map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              disabled={disabled}
              className={cn(
                'rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-all',
                'hover:border-brand/50 hover:text-foreground',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {example.length > 30 ? example.slice(0, 30) + '...' : example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromptInput;
