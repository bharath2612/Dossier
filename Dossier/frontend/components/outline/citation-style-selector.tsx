'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type CitationStyle = 'inline' | 'footnote' | 'speaker_notes';

interface CitationStyleSelectorProps {
  value: CitationStyle;
  onChange: (style: CitationStyle) => void;
}

const citationStyles: Array<{
  value: CitationStyle;
  label: string;
  description: string;
}> = [
  {
    value: 'inline',
    label: 'Inline Citations',
    description: 'Citations appear inline within slide text (e.g., [McKinsey 2024])',
  },
  {
    value: 'footnote',
    label: 'Footnote Citations',
    description: 'Citations appear as small footnotes at the bottom of each slide',
  },
  {
    value: 'speaker_notes',
    label: 'Speaker Notes Only',
    description: 'Citations only appear in speaker notes, not on slides',
  },
];

export function CitationStyleSelector({ value, onChange }: CitationStyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedStyle = citationStyles.find((s) => s.value === value);

  return (
    <div className="relative">
      {/* Selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-left transition-all hover:border-brand/50"
      >
        <div>
          <p className="text-sm font-medium text-foreground">{selectedStyle?.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{selectedStyle?.description}</p>
        </div>
        <ChevronDown
          className={`ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Options */}
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-80 overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg">
            {citationStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => {
                  onChange(style.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary ${
                  value === style.value ? 'bg-secondary' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{style.label}</div>
                  <div className="text-xs text-muted-foreground">{style.description}</div>
                </div>
                {value === style.value && (
                  <Check className="h-4 w-4 flex-shrink-0 text-brand" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
