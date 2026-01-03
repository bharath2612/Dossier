'use client';

import { useEffect, useRef, useState } from 'react';
import { WidgetRenderer } from '../widgets/widget-renderer';
import { sortByZIndex, positionToPixels } from '@/lib/utils/widget-utils';
import type { ContentBlock, Theme as ThemeType, TextSegment } from '@/types/presentation';
import type { ThemeConfig } from '@/lib/themes';

interface FreeformCanvasProps {
  contentBlocks: ContentBlock[];
  onUpdateBlock: (blockId: string, updates: Partial<ContentBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlock: (block: ContentBlock) => void;
  selectedBlockId?: string;
  onSelectBlock: (blockId: string | undefined) => void;
  onSelectionChange?: (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>, position?: { x: number; y: number }, editorElement?: HTMLDivElement) => void;
  theme: ThemeConfig;
  backgroundColor?: string;
  showGrid?: boolean;
  presentationId?: string;
  slideIndex?: number;
}

export function FreeformCanvas({
  contentBlocks,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
  selectedBlockId,
  onSelectBlock,
  onSelectionChange,
  theme,
  backgroundColor,
  showGrid = false,
  presentationId,
  slideIndex,
}: FreeformCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 675 }); // 16:9 aspect ratio

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sort widgets by z-index for proper rendering order
  const sortedWidgets = sortByZIndex(contentBlocks);

  // Handle click on canvas background to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectBlock(undefined);
    }
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard events if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (!selectedBlockId) return;

      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteBlock(selectedBlockId);
        onSelectBlock(undefined);
      }

      // Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        onSelectBlock(undefined);
      }

      // Arrow keys for nudging (hold Shift for larger steps)
      const nudgeAmount = e.shiftKey ? 5 : 1;
      const widget = contentBlocks.find((w) => w.id === selectedBlockId);
      if (!widget) return;

      let updated = false;
      const newPosition = { ...widget.position };

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        newPosition.y = Math.max(0, newPosition.y - nudgeAmount);
        updated = true;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        newPosition.y = Math.min(100 - newPosition.height, newPosition.y + nudgeAmount);
        updated = true;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newPosition.x = Math.max(0, newPosition.x - nudgeAmount);
        updated = true;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        newPosition.x = Math.min(100 - newPosition.width, newPosition.x + nudgeAmount);
        updated = true;
      }

      if (updated) {
        onUpdateBlock(selectedBlockId, { position: newPosition });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, contentBlocks, onUpdateBlock, onDeleteBlock, onSelectBlock]);

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="relative w-full min-h-[675px] overflow-hidden"
      style={{
        backgroundColor: backgroundColor || theme.colors.background,
        backgroundImage: showGrid
          ? `
            linear-gradient(rgba(128, 128, 128, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(128, 128, 128, 0.1) 1px, transparent 1px)
          `
          : undefined,
        backgroundSize: showGrid ? '20px 20px' : undefined,
      }}
    >
      {/* Render all widgets */}
      {sortedWidgets.map((widget) => {
        const pixelPosition = positionToPixels(
          widget.position,
          canvasSize.width,
          canvasSize.height
        );

        return (
          <div
            key={widget.id}
            style={{
              position: 'absolute',
              left: `${pixelPosition.x}px`,
              top: `${pixelPosition.y}px`,
              width: `${pixelPosition.width}px`,
              height: `${pixelPosition.height}px`,
              zIndex: widget.zIndex,
            }}
          >
            <WidgetRenderer
              widget={widget}
              isSelected={widget.id === selectedBlockId}
              onUpdate={(updates) => onUpdateBlock(widget.id, updates)}
              onDelete={() => onDeleteBlock(widget.id)}
              onSelect={() => onSelectBlock(widget.id)}
              onSelectionChange={onSelectionChange}
              theme={theme}
              canvasSize={canvasSize}
              presentationId={presentationId}
              slideIndex={slideIndex}
              backgroundColor={backgroundColor}
            />
          </div>
        );
      })}

      {/* Empty state */}
      {contentBlocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="mb-2 text-lg font-medium">Click "Insert Widget" to add content</p>
            <p className="text-sm">
              Add text, images, cards, diagrams, and more to your slide
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
