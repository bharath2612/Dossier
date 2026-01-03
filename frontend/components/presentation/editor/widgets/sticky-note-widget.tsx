'use client';

import { useRef } from 'react';
import { RichTextEditor } from '../rich-text-editor';
import { getContrastTextColor } from '@/lib/utils/color-contrast';
import type { StickyNoteWidget, TextSegment } from '@/types/presentation';
import type { ThemeConfig } from '@/lib/themes';

interface StickyNoteWidgetProps {
  widget: StickyNoteWidget;
  onUpdate: (data: StickyNoteWidget['data']) => void;
  onSelectionChange?: (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>, position?: { x: number; y: number }, editorElement?: HTMLDivElement) => void;
  theme: ThemeConfig;
  isEditing: boolean;
  backgroundColor?: string;
}

export function StickyNoteWidgetComponent({ widget, onUpdate, onSelectionChange, theme, isEditing, backgroundColor }: StickyNoteWidgetProps) {
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

  // Calculate contrast text color based on sticky note's color
  const textColor = getContrastTextColor(widget.data.color);

  return (
    <div
      className="h-full w-full rounded-lg p-4 shadow-lg overflow-auto"
      style={{
        backgroundColor: widget.data.color,
        transform: `rotate(${widget.data.rotation || 0}deg)`,
      }}
    >
      <RichTextEditor
        ref={editorRef}
        segments={widget.data.segments}
        onChange={(segments) => onUpdate({ ...widget.data, segments })}
        onSelectionChange={handleSelectionChange}
        placeholder="Sticky note..."
        disabled={!isEditing}
        style={{
          fontSize: '14px',
          color: textColor,
          minHeight: '100%',
        }}
      />
    </div>
  );
}
