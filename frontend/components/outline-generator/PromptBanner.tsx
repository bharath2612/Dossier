'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GenerationMode, GenerationStatus } from '@/store/types';

interface PromptBannerProps {
  originalPrompt: string;
  enhancedPrompt: string;
  mode: GenerationMode;
  status: GenerationStatus;
  onCancel?: () => void;
}

export function PromptBanner({
  originalPrompt,
  enhancedPrompt,
  mode,
  status,
  onCancel,
}: PromptBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showCancel = status !== 'complete' && status !== 'error';

  // Truncate prompts for display
  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto mb-6"
    >
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Main Banner */}
        <div
          className={cn(
            'flex items-center justify-between gap-4 px-5 py-3 cursor-pointer transition-colors',
            'hover:bg-secondary/30'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Status Indicator */}
            <div className="flex-shrink-0">
              {status === 'complete' ? (
                <div className="h-2 w-2 rounded-full bg-brand" />
              ) : status === 'error' ? (
                <div className="h-2 w-2 rounded-full bg-destructive" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              )}
            </div>

            {/* Prompt Display */}
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <span className="text-muted-foreground truncate">
                {truncate(originalPrompt, 30)}
              </span>
              {enhancedPrompt && enhancedPrompt !== originalPrompt && (
                <>
                  <span className="text-muted-foreground/50">→</span>
                  <span className="text-foreground truncate">
                    {truncate(enhancedPrompt, 40)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mode Badge */}
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                mode === 'research'
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'bg-brand/10 text-brand'
              )}
            >
              {mode === 'research' ? (
                <>
                  <Search className="h-3 w-3" />
                  Research
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Fast
                </>
              )}
            </div>

            {/* Cancel Button */}
            {showCancel && onCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Cancel generation"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Expand Toggle */}
            <button
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 border-t border-border/50">
                <div className="pt-4 space-y-3">
                  {/* Original Prompt */}
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Original
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {originalPrompt}
                    </p>
                  </div>

                  {/* Enhanced Prompt */}
                  {enhancedPrompt && enhancedPrompt !== originalPrompt && (
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Enhanced
                      </p>
                      <p className="text-sm text-foreground">{enhancedPrompt}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default PromptBanner;
