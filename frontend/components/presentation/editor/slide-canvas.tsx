'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getTheme } from '@/lib/themes';
import { RichTextEditor } from './rich-text-editor';
import { FloatingToolbar } from './floating-toolbar';
import { BottomToolbar } from './bottom-toolbar';
import { InsertWidgetMenu } from './insert-widget-menu';
import { FreeformCanvas } from './canvas/freeform-canvas';
import { migrateSlideIfNeeded } from '@/lib/utils/widget-migration';
import { createDefaultWidget, bringToFront, updateWidget } from '@/lib/utils/widget-utils';
import type {
  Slide,
  CitationStyle,
  Theme,
  TextSegment,
  ContentBlock,
  WidgetType,
} from '@/types/presentation';

interface SlideCanvasProps {
  slide: Slide;
  citationStyle: CitationStyle;
  theme: Theme;
  presentationId: string;
  onUpdate: (updates: Partial<Slide>) => void;
}

export function SlideCanvas({
  slide: rawSlide,
  citationStyle,
  theme,
  presentationId,
  onUpdate,
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeEditorRef = useRef<HTMLDivElement | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [currentFormat, setCurrentFormat] = useState<Partial<Omit<TextSegment, 'text'>>>({});
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(undefined);

  // Migrate slide to widget format if needed
  const slide = migrateSlideIfNeeded(rawSlide);

  // Get content blocks (migrated or existing)
  const contentBlocks = slide.content_blocks || [];

  const themeConfig = getTheme(theme);

  // Widget handlers
  const handleUpdateBlock = useCallback((blockId: string, updates: Partial<ContentBlock>) => {
    const updatedBlocks = updateWidget(contentBlocks, blockId, updates);
    onUpdate({ content_blocks: updatedBlocks });
  }, [contentBlocks, onUpdate]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    const updatedBlocks = contentBlocks.filter(block => block.id !== blockId);
    onUpdate({ content_blocks: updatedBlocks });
    setSelectedBlockId(undefined);
  }, [contentBlocks, onUpdate]);

  const handleAddBlock = useCallback((block: ContentBlock) => {
    const updatedBlocks = [...contentBlocks, block];
    onUpdate({ content_blocks: updatedBlocks });
  }, [contentBlocks, onUpdate]);

  const handleSelectBlock = useCallback((blockId: string | undefined) => {
    setSelectedBlockId(blockId);
    if (blockId) {
      // Bring selected block to front
      const updatedBlocks = bringToFront(contentBlocks, blockId);
      onUpdate({ content_blocks: updatedBlocks });
    }
  }, [contentBlocks, onUpdate]);

  const handleInsertWidget = useCallback((type: WidgetType, options?: any) => {
    const newWidget = createDefaultWidget(type, contentBlocks);

    // Apply options if provided
    if (options && 'level' in newWidget.data) {
      newWidget.data.level = options.level;
    }

    handleAddBlock(newWidget);
    setSelectedBlockId(newWidget.id);
    setInsertMenuOpen(false);
  }, [contentBlocks, handleAddBlock]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    // Theme changes are handled at parent level
    // This is just for the bottom toolbar prop
  }, []);

  // Handle selection change from widget editors
  const handleSelectionChange = useCallback((
    hasSelection: boolean,
    format: Partial<Omit<TextSegment, 'text'>>,
    position?: { x: number; y: number },
    editorElement?: HTMLDivElement
  ) => {
    console.log('[SlideCanvas] Selection change received:', {
      hasSelection,
      position,
      hasEditor: !!editorElement,
      format
    });

    if (hasSelection && position) {
      console.log('[SlideCanvas] Showing toolbar at:', position);
      setToolbarVisible(true);
      setToolbarPosition(position);
      setCurrentFormat(format);
      // Store reference to the active editor
      if (editorElement) {
        console.log('[SlideCanvas] Storing editor ref');
        activeEditorRef.current = editorElement;
      } else {
        console.warn('[SlideCanvas] No editor element provided!');
      }
    } else {
      console.log('[SlideCanvas] Hiding toolbar');
      setToolbarVisible(false);
      activeEditorRef.current = null;
    }
  }, []);

  // Handle format change from floating toolbar (for text widgets)
  const handleFormatChange = useCallback((format: Partial<Omit<TextSegment, 'text'>>) => {
    console.log('[SlideCanvas] Format change requested:', format);
    setCurrentFormat(prev => ({ ...prev, ...format }));

    // Apply format to the active editor
    if (activeEditorRef.current) {
      console.log('[SlideCanvas] Active editor found, attempting to apply format');
      const applyFormat = (activeEditorRef.current as any).applyFormat;
      if (typeof applyFormat === 'function') {
        console.log('[SlideCanvas] Calling applyFormat on editor');
        applyFormat(format);
      } else {
        console.error('[SlideCanvas] applyFormat is not a function!', typeof applyFormat);
      }
    } else {
      console.error('[SlideCanvas] No active editor ref to apply format to!');
    }
  }, []);

  return (
    <div ref={containerRef} className="group relative">
      {/* Freeform Canvas with Widgets */}
      <FreeformCanvas
        contentBlocks={contentBlocks}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        onAddBlock={handleAddBlock}
        selectedBlockId={selectedBlockId}
        onSelectBlock={handleSelectBlock}
        onSelectionChange={handleSelectionChange}
        theme={themeConfig}
        backgroundColor={slide.background_color}
        presentationId={presentationId}
        slideIndex={slide.index}
      />

      {/* Bottom Toolbar */}
      <BottomToolbar
        onInsertWidget={() => setInsertMenuOpen(true)}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        currentBackgroundColor={slide.background_color}
        onBackgroundColorChange={(color) => onUpdate({ background_color: color })}
        defaultBackgroundColor={themeConfig.colors.background}
      />

      {/* Insert Widget Menu */}
      <InsertWidgetMenu
        visible={insertMenuOpen}
        onClose={() => setInsertMenuOpen(false)}
        onInsertWidget={handleInsertWidget}
      />

      {/* Floating Toolbar (for text formatting) */}
      <FloatingToolbar
        visible={toolbarVisible}
        position={toolbarPosition}
        currentFormat={currentFormat}
        onFormatChange={handleFormatChange}
        presentationId={presentationId}
        slideIndex={slide.index}
        currentImage={slide.image}
        onImageChange={(image) => onUpdate({ image })}
      />
    </div>
  );
}
