'use client';

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Create a pitch deck for a B2B SaaS startup revolutionizing team productivity...',
  'Build a training presentation on effective leadership in remote teams...',
  'Design a sales deck showcasing the ROI of AI adoption in healthcare...',
  'Generate a product launch presentation for a sustainable fashion brand...',
  'Create an investor update highlighting quarterly growth metrics...',
];

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

export function PromptInput({ onSubmit, isLoading = false }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState(EXAMPLE_PROMPTS[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPlaceholder(EXAMPLE_PROMPTS[placeholderIndex]);
  }, [placeholderIndex]);

  const handleSubmit = () => {
    if (prompt.trim().length < 10) {
      // Show soft warning
      return;
    }
    onSubmit(prompt.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="min-h-[180px] resize-none rounded-2xl border-2 border-gray-200 px-6 py-5 text-lg leading-relaxed placeholder:text-gray-400 focus:border-gray-900 focus:ring-0 dark:border-gray-800 dark:bg-gray-950 dark:focus:border-gray-100"
          disabled={isLoading}
        />
        {prompt.length > 0 && prompt.length < 10 && (
          <p className="mt-2 text-sm text-amber-600">
            Please provide more detail (at least 10 characters)
          </p>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || prompt.trim().length < 10}
        size="lg"
        className="h-14 w-full rounded-full bg-gradient-to-r from-gray-900 to-gray-700 px-8 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 dark:from-gray-100 dark:to-gray-300 dark:text-gray-900"
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-gray-900 dark:border-t-transparent" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Outline
          </>
        )}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Press <kbd className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-700">⌘ + Enter</kbd> to submit
      </p>
    </div>
  );
}
