'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
  onComplete?: () => void;
  showCursor?: boolean;
  startDelay?: number;
}

export function TypewriterText({
  text,
  speed = 20,
  className,
  onComplete,
  showCursor = true,
  startDelay = 0,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setIsComplete(false);
    setHasStarted(false);
    indexRef.current = 0;

    // Start delay
    const startTimeout = setTimeout(() => {
      setHasStarted(true);
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, startDelay]);

  useEffect(() => {
    if (!hasStarted) return;

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    typeNextChar();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, hasStarted, onComplete]);

  return (
    <span className={cn('inline', className)}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className="animate-blink ml-0.5 inline-block h-[1em] w-[2px] bg-brand align-middle" />
      )}
    </span>
  );
}

// Static version that just displays text (for edit mode)
export function StaticText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <span className={className}>{text}</span>;
}

export default TypewriterText;
