'use client';

import { useRef } from 'react';
import { RichTextEditor } from '../rich-text-editor';
import { getContrastTextColor } from '@/lib/utils/color-contrast';
import type { TextWidget, TextSegment } from '@/types/presentation';
import type { ThemeConfig } from '@/lib/themes';

interface TextWidgetProps {
  widget: TextWidget;
  onUpdate: (data: TextWidget['data']) => void;
  onSelectionChange?: (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>, position?: { x: number; y: number }, editorElement?: HTMLDivElement) => void;
  theme: ThemeConfig;
  isEditing: boolean;
  backgroundColor?: string;
}

export function TextWidgetComponent({ widget, onUpdate, onSelectionChange, theme, isEditing, backgroundColor }: TextWidgetProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  console.log('[TextWidget] Render - editorRef:', !!editorRef.current, 'isEditing:', isEditing);

  const handleSelectionChange = (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>) => {
    console.log('[TextWidget] Selection change:', { hasSelection, format, hasEditor: !!editorRef.current });

    if (!onSelectionChange) {
      console.log('[TextWidget] No onSelectionChange callback');
      return;
    }

    // Get selection position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && hasSelection) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      console.log('[TextWidget] Propagating selection up:', {
        position: { x: rect.left + rect.width / 2, y: rect.top },
        editorRef: !!editorRef.current
      });
      onSelectionChange(hasSelection, format, {
        x: rect.left + rect.width / 2,
        y: rect.top,
      }, editorRef.current || undefined);
    } else {
      console.log('[TextWidget] Clearing selection');
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
        onChange={(segments) => onUpdate({ segments })}
        onSelectionChange={handleSelectionChange}
        placeholder="Enter text here..."
        disabled={!isEditing}
        style={{
          fontSize: '16px',  // Standard text size (TEXT_LEVEL_MAP['text'])
          color: textColor,
          minHeight: '100%',
        }}
      />
    </div>
  );
}
