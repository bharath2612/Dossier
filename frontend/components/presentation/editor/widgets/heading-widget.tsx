'use client';

import { useRef } from 'react';
import { RichTextEditor } from '../rich-text-editor';
import { getContrastTextColor } from '@/lib/utils/color-contrast';
import type { HeadingWidget, HeadingLevel, TextSegment } from '@/types/presentation';
import type { ThemeConfig } from '@/lib/themes';

interface HeadingWidgetProps {
  widget: HeadingWidget;
  onUpdate: (data: HeadingWidget['data']) => void;
  onSelectionChange?: (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>, position?: { x: number; y: number }, editorElement?: HTMLDivElement) => void;
  theme: ThemeConfig;
  isEditing: boolean;
  backgroundColor?: string;
}

const HEADING_SIZES: Record<HeadingLevel, string> = {
  h1: '48px',
  h2: '36px',
  h3: '28px',
};

export function HeadingWidgetComponent({ widget, onUpdate, onSelectionChange, theme, isEditing, backgroundColor }: HeadingWidgetProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>) => {
    if (!onSelectionChange) return;

    // Get selection position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && hasSelection) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onSelectionChange(hasSelection, format, {
        x: rect.left + rect.width / 2,
        y: rect.top,
      }, editorRef.current || undefined);
    } else {
      onSelectionChange(false, format, undefined, undefined);
    }
  };

  // Calculate contrast text color based on background
  const textColor = getContrastTextColor(backgroundColor || theme.colors.background);

  return (
    <div className="h-full w-full p-2 overflow-auto">
      <RichTextEditor
        ref={editorRef}
        segments={widget.data.segments}
        onChange={(segments) => onUpdate({ ...widget.data, segments })}
        onSelectionChange={handleSelectionChange}
        placeholder={`Heading ${widget.data.level.toUpperCase()}`}
        disabled={!isEditing}
        style={{
          fontSize: HEADING_SIZES[widget.data.level],
          fontWeight: 'bold',
          color: textColor,
          minHeight: '100%',
        }}
      />
    </div>
  );
}
