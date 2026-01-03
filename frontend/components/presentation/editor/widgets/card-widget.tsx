'use client';

import { useRef } from 'react';
import { RichTextEditor } from '../rich-text-editor';
import { getContrastTextColor } from '@/lib/utils/color-contrast';
import type { CardWidget, TextSegment } from '@/types/presentation';
import type { ThemeConfig } from '@/lib/themes';

interface CardWidgetProps {
  widget: CardWidget;
  onUpdate: (data: CardWidget['data']) => void;
  onSelectionChange?: (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>, position?: { x: number; y: number }, editorElement?: HTMLDivElement) => void;
  theme: ThemeConfig;
  isEditing: boolean;
  backgroundColor?: string;
}

export function CardWidgetComponent({ widget, onUpdate, onSelectionChange, theme, isEditing, backgroundColor }: CardWidgetProps) {
  const titleEditorRef = useRef<HTMLDivElement>(null);
  const bodyEditorRef = useRef<HTMLDivElement>(null);
  const activeEditorRef = useRef<'title' | 'body'>('body');

  const handleSelectionChange = (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>, editorType: 'title' | 'body') => {
    if (!onSelectionChange) return;

    // Get selection position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && hasSelection) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      activeEditorRef.current = editorType;
      const editorRef = editorType === 'title' ? titleEditorRef : bodyEditorRef;
      onSelectionChange(hasSelection, format, {
        x: rect.left + rect.width / 2,
        y: rect.top,
      }, editorRef.current || undefined);
    } else {
      onSelectionChange(false, format, undefined, undefined);
    }
  };

  // Calculate contrast text color based on card's background (not slide background)
  const cardBg = widget.data.backgroundColor || '#ffffff';
  const textColor = getContrastTextColor(cardBg);

  return (
    <div
      className="h-full w-full rounded-lg border p-4 overflow-auto"
      style={{
        backgroundColor: cardBg,
        borderColor: widget.data.borderColor || '#e5e7eb',
      }}
    >
      {/* Title */}
      <div className="mb-2">
        <RichTextEditor
          ref={titleEditorRef}
          segments={widget.data.title || []}
          onChange={(segments) => onUpdate({ ...widget.data, title: segments })}
          onSelectionChange={(hasSelection, format) => handleSelectionChange(hasSelection, format, 'title')}
          placeholder="Card title..."
          disabled={!isEditing}
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: textColor,
          }}
        />
      </div>

      {/* Body */}
      <div>
        <RichTextEditor
          ref={bodyEditorRef}
          segments={widget.data.body}
          onChange={(segments) => onUpdate({ ...widget.data, body: segments })}
          onSelectionChange={(hasSelection, format) => handleSelectionChange(hasSelection, format, 'body')}
          placeholder="Card content..."
          disabled={!isEditing}
          style={{
            fontSize: '14px',
            color: textColor,
          }}
        />
      </div>
    </div>
  );
}
