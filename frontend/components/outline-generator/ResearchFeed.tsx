'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ResearchSource, GenerationStatus } from '@/store/types';

interface ResearchFeedProps {
  sources: ResearchSource[];
  status: GenerationStatus;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

export function ResearchFeed({
  sources,
  status,
  isCollapsed,
  onToggleCollapse,
}: ResearchFeedProps) {
  const isResearching = status === 'researching';
  const isComplete = status === 'generating' || status === 'complete';

  // Don't show if no sources and not researching
  if (sources.length === 0 && !isResearching) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <AnimatePresence mode="wait">
        {isCollapsed && isComplete ? (
          // Collapsed State
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onToggleCollapse(false)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 px-4',
              'rounded-lg border border-border bg-card/50 backdrop-blur-sm',
              'text-sm text-muted-foreground',
              'hover:bg-secondary/30 hover:text-foreground transition-colors'
            )}
          >
            <span>Based on {sources.length} sources</span>
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        ) : (
          // Expanded State
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                {isResearching && (
                  <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                )}
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {isResearching
                    ? 'Researching...'
                    : `${sources.length} sources found`}
                </span>
              </div>

              {isComplete && sources.length > 0 && (
                <button
                  onClick={() => onToggleCollapse(true)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sources Grid */}
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {sources.map((source, index) => (
                    <motion.div
                      key={`${source.domain}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.15,
                        delay: index * 0.05,
                        ease: 'easeOut',
                      }}
                    >
                      <SourceChip source={source} />
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isResearching && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary/50"
                    >
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual source chip
function SourceChip({ source }: { source: ResearchSource }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-secondary/50 hover:bg-secondary transition-colors',
        'text-sm text-muted-foreground'
      )}
    >
      {/* Favicon */}
      <img
        src={source.favicon}
        alt=""
        className="h-4 w-4 rounded-sm"
        onError={(e) => {
          // Fallback to a generic icon
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* Domain */}
      <span className="max-w-[120px] truncate">{source.domain}</span>
    </div>
  );
}

export default ResearchFeed;
