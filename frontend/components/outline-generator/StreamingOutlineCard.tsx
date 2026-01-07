'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StreamingOutlineCardProps {
  buffer: string;
  slideIndex: number;
}

// Parse streaming markdown buffer to extract title and bullets in progress
function parseStreamingBuffer(buffer: string): { title: string; bullets: string[]; isTypingTitle: boolean; isTypingBullet: boolean } {
  const lines = buffer.split('\n');
  let title = '';
  const bullets: string[] = [];
  let isTypingTitle = false;
  let isTypingBullet = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLastLine = i === lines.length - 1;

    if (line.startsWith('## ')) {
      title = line.replace('## ', '');
      if (isLastLine) {
        isTypingTitle = true;
      }
    } else if (line.startsWith('- ')) {
      bullets.push(line.replace('- ', ''));
      if (isLastLine) {
        isTypingBullet = true;
      }
    } else if (line.trim() && !title) {
      // Partial title being typed (before ## is complete)
      title = line;
      isTypingTitle = true;
    } else if (line.trim() && bullets.length > 0) {
      // Continuation of last bullet (line without - prefix but after bullets started)
      bullets[bullets.length - 1] += line;
      if (isLastLine) {
        isTypingBullet = true;
      }
    }
  }

  return { title, bullets, isTypingTitle, isTypingBullet };
}

export function StreamingOutlineCard({ buffer, slideIndex }: StreamingOutlineCardProps) {
  const parsed = useMemo(() => parseStreamingBuffer(buffer), [buffer]);

  // Don't render if no content yet
  if (!buffer.trim()) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-card"
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-border/50">
          <span className="flex items-center justify-center h-6 w-6 rounded-md bg-secondary text-sm font-medium text-muted-foreground">
            {slideIndex + 1}
          </span>
        </div>

        {/* Content - Loading */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card border-brand/30"
    >
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-border/50">
        <span className="flex items-center justify-center h-6 w-6 rounded-md bg-brand/20 text-sm font-medium text-brand">
          {slideIndex + 1}
        </span>
        <div className="ml-2 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          <span className="text-xs text-brand font-medium">Streaming</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        {parsed.title && (
          <h3 className="text-lg font-semibold text-foreground">
            {parsed.title}
            {parsed.isTypingTitle && <span className="typing-cursor" />}
          </h3>
        )}

        {/* Bullets */}
        {parsed.bullets.length > 0 && (
          <ul className="space-y-2">
            {parsed.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {bullet}
                  {parsed.isTypingBullet && idx === parsed.bullets.length - 1 && (
                    <span className="typing-cursor" />
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export default StreamingOutlineCard;
