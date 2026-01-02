'use client';

import type { SlideType } from '@/store/types';

interface SlideTypeDropdownProps {
  value: SlideType;
  onChange: (type: SlideType) => void;
}

const slideTypes: Array<{ value: SlideType; label: string }> = [
  { value: 'intro', label: 'Introduction' },
  { value: 'content', label: 'Content' },
  { value: 'data', label: 'Data' },
  { value: 'quote', label: 'Quote' },
  { value: 'conclusion', label: 'Conclusion' },
];

export function SlideTypeDropdown({ value, onChange }: SlideTypeDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SlideType)}
      className="rounded border border-border bg-card px-2 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground outline-none transition-colors hover:border-brand/50 focus:border-brand focus:ring-1 focus:ring-brand/20"
    >
      {slideTypes.map((type) => (
        <option key={type.value} value={type.value} className="bg-card text-foreground">
          {type.label}
        </option>
      ))}
    </select>
  );
}
