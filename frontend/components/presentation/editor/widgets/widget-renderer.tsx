'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pixelsToPosition, constrainPosition } from '@/lib/utils/widget-utils';
import { TextWidgetComponent } from './text-widget';
import { HeadingWidgetComponent } from './heading-widget';
import { CardWidgetComponent } from './card-widget';
import { StickyNoteWidgetComponent } from './sticky-note-widget';
import { ImageWidgetComponent } from './image-widget';
import type { ContentBlock, WidgetPosition, TextSegment } from '@/types/presentation';
import type { ThemeConfig } from '@/lib/themes';

interface WidgetRendererProps {
  widget: ContentBlock;
  isSelected: boolean;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onSelect: () => void;
  onSelectionChange?: (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>, position?: { x: number; y: number }, editorElement?: HTMLDivElement) => void;
  theme: ThemeConfig;
  canvasSize: { width: number; height: number };
  presentationId?: string;
  slideIndex?: number;
  backgroundColor?: string;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export function WidgetRenderer({
  widget,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
  onSelectionChange,
  theme,
  canvasSize,
  presentationId,
  slideIndex,
  backgroundColor,
}: WidgetRendererProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalPosition, setOriginalPosition] = useState<WidgetPosition>(widget.position);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isSelected) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalPosition(widget.position);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    if (!isSelected) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalPosition(widget.position);
  };

  // Handle mouse move
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Convert pixels to percentage
      const deltaXPercent = (deltaX / canvasSize.width) * 100;
      const deltaYPercent = (deltaY / canvasSize.height) * 100;

      if (isDragging) {
        // Update position
        const newPosition: WidgetPosition = {
          ...originalPosition,
          x: originalPosition.x + deltaXPercent,
          y: originalPosition.y + deltaYPercent,
        };
        onUpdate({ position: constrainPosition(newPosition) });
      } else if (isResizing && resizeHandle) {
        // Update size and position based on handle
        let newPosition = { ...originalPosition };

        switch (resizeHandle) {
          case 'se': // Southeast - bottom right
            newPosition.width = originalPosition.width + deltaXPercent;
            newPosition.height = originalPosition.height + deltaYPercent;
            break;
          case 'sw': // Southwest - bottom left
            newPosition.x = originalPosition.x + deltaXPercent;
            newPosition.width = originalPosition.width - deltaXPercent;
            newPosition.height = originalPosition.height + deltaYPercent;
            break;
          case 'ne': // Northeast - top right
            newPosition.y = originalPosition.y + deltaYPercent;
            newPosition.width = originalPosition.width + deltaXPercent;
            newPosition.height = originalPosition.height - deltaYPercent;
            break;
          case 'nw': // Northwest - top left
            newPosition.x = originalPosition.x + deltaXPercent;
            newPosition.y = originalPosition.y + deltaYPercent;
            newPosition.width = originalPosition.width - deltaXPercent;
            newPosition.height = originalPosition.height - deltaYPercent;
            break;
          case 'n': // North - top
            newPosition.y = originalPosition.y + deltaYPercent;
            newPosition.height = originalPosition.height - deltaYPercent;
            break;
          case 's': // South - bottom
            newPosition.height = originalPosition.height + deltaYPercent;
            break;
          case 'w': // West - left
            newPosition.x = originalPosition.x + deltaXPercent;
            newPosition.width = originalPosition.width - deltaXPercent;
            break;
          case 'e': // East - right
            newPosition.width = originalPosition.width + deltaXPercent;
            break;
        }

        onUpdate({ position: constrainPosition(newPosition) });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, dragStart, originalPosition, onUpdate, canvasSize]);

  // Render the appropriate widget based on type
  const renderWidget = () => {
    const isEditing = isSelected;

    switch (widget.type) {
      case 'text':
        return (
          <TextWidgetComponent
            widget={widget}
            onUpdate={(data) => onUpdate({ data })}
            onSelectionChange={onSelectionChange}
            theme={theme}
            isEditing={isEditing}
            backgroundColor={backgroundColor}
          />
        );

      case 'heading':
        return (
          <HeadingWidgetComponent
            widget={widget}
            onUpdate={(data) => onUpdate({ data })}
            onSelectionChange={onSelectionChange}
            theme={theme}
            isEditing={isEditing}
            backgroundColor={backgroundColor}
          />
        );

      case 'card':
        return (
          <CardWidgetComponent
            widget={widget}
            onUpdate={(data) => onUpdate({ data })}
            onSelectionChange={onSelectionChange}
            theme={theme}
            isEditing={isEditing}
            backgroundColor={backgroundColor}
          />
        );

      case 'sticky-note':
        return (
          <StickyNoteWidgetComponent
            widget={widget}
            onUpdate={(data) => onUpdate({ data })}
            onSelectionChange={onSelectionChange}
            theme={theme}
            isEditing={isEditing}
            backgroundColor={backgroundColor}
          />
        );

      case 'image':
        return (
          <ImageWidgetComponent
            widget={widget}
            onUpdate={(data) => onUpdate({ data })}
            theme={theme}
            isEditing={isEditing}
            presentationId={presentationId || ''}
            slideIndex={slideIndex || 0}
          />
        );

      case 'diagram':
        return (
          <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {widget.data.diagramType} diagram (coming soon)
            </p>
          </div>
        );

      case 'arrow': {
        const { startPoint, endPoint, color, thickness } = widget.data;
        return (
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker
                id={`arrowhead-${widget.id}`}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill={color} />
              </marker>
            </defs>
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke={color}
              strokeWidth={thickness}
              markerEnd={`url(#arrowhead-${widget.id})`}
            />
          </svg>
        );
      }

      case 'line': {
        const { startPoint, endPoint, color, thickness, style } = widget.data;
        const strokeDasharray = style === 'dashed' ? '5,5' : style === 'dotted' ? '2,2' : undefined;
        return (
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={strokeDasharray}
            />
          </svg>
        );
      }

      default:
        return (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            Unknown widget type
          </div>
        );
    }
  };

  return (
    <div
      className={`group relative h-full w-full ${
        isSelected ? 'ring-2 ring-brand ring-offset-2 ring-offset-background' : ''
      }`}
      onClick={(e) => {
        console.log('[WidgetRenderer] Clicked - isSelected:', isSelected, 'target:', e.target);
        e.stopPropagation();
        if (!isSelected) {
          console.log('[WidgetRenderer] Selecting widget');
          onSelect();
        }
      }}
      onMouseDown={(e) => {
        console.log('[WidgetRenderer] Mouse down on widget wrapper');
      }}
      style={{
        cursor: isSelected ? 'default' : 'pointer',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Widget Content */}
      {renderWidget()}

      {/* Selection Controls (visible when selected) */}
      {isSelected && (
        <>
          {/* Drag Handle */}
          <div className="absolute -left-2 -top-2 z-10">
            <Button
              variant="secondary"
              size="icon-sm"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleDragStart(e);
              }}
              className="h-6 w-6 rounded-full shadow-lg cursor-grab active:cursor-grabbing"
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              <Move className="h-3 w-3" />
            </Button>
          </div>

          {/* Delete Button */}
          <div className="absolute -right-2 -top-2 z-10">
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 w-6 rounded-full shadow-lg"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Resize Handles */}
          <div
            className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          <div
            className="absolute -bottom-1 -left-1 h-3 w-3 cursor-sw-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute -top-1 -right-1 h-3 w-3 cursor-ne-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute -top-1 -left-1 h-3 w-3 cursor-nw-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-n-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-s-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div
            className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-w-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-e-resize rounded-full bg-brand border-2 border-background"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
        </>
      )}

      {/* Hover Effect (when not selected) */}
      {!isSelected && (
        <div className="absolute inset-0 rounded border-2 border-transparent opacity-0 transition-opacity group-hover:border-brand/50 group-hover:opacity-100" />
      )}
    </div>
  );
}
