'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { SlideTypeDropdown } from './slide-type-dropdown';
import type { OutlineSlide } from '@/store/types';

interface OutlineEditorCardProps {
  slide: OutlineSlide;
  slideCount: number;
  onUpdate: (updates: Partial<OutlineSlide>) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export function OutlineEditorCard({
  slide,
  slideCount,
  onUpdate,
  onAdd,
  onRemove,
}: OutlineEditorCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.index,
  });

  // Local state for editing
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localBullets, setLocalBullets] = useState(slide.bullets.join('\n'));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when slide changes (e.g., from drag-and-drop reordering)
  useEffect(() => {
    setLocalTitle(slide.title);
    setLocalBullets(slide.bullets.join('\n'));
  }, [slide.title, slide.bullets]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localBullets]);

  const handleTitleBlur = () => {
    if (localTitle !== slide.title) {
      onUpdate({ title: localTitle });
    }
  };

  const handleBulletsBlur = () => {
    const bulletArray = localBullets.split('\n').filter((b) => b.trim());
    if (JSON.stringify(bulletArray) !== JSON.stringify(slide.bullets)) {
      onUpdate({ bullets: bulletArray });
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const canDelete = slideCount > 5;
  const canAdd = slideCount < 20;

  // Character count
  const titleLength = localTitle.length;
  const showTitleWarning = titleLength > 80;

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-brand/30">
        {/* Card header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Slide number */}
            <span className="font-mono text-xs text-muted-foreground">
              {String(slide.index + 1).padStart(2, '0')}
            </span>

            {/* Slide type dropdown */}
            <SlideTypeDropdown value={slide.type} onChange={(type) => onUpdate({ type })} />
          </div>

          {/* Delete button - only show on hover */}
          <button
            onClick={onRemove}
            disabled={!canDelete}
            className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100 disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
            title={!canDelete ? 'Minimum 5 slides required' : 'Delete slide'}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>

        {/* Slide title (editable) */}
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="mb-2 w-full border-none bg-transparent text-lg font-medium leading-tight text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
          placeholder="Slide title..."
        />

        {/* Character count warning */}
        {showTitleWarning && (
          <p className="mb-2 font-mono text-xs text-yellow-500">{titleLength}/100 characters</p>
        )}

        {/* Bullets (editable) */}
        <textarea
          ref={textareaRef}
          value={localBullets}
          onChange={(e) => setLocalBullets(e.target.value)}
          onBlur={handleBulletsBlur}
          className="mb-3 w-full resize-none border-none bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
          placeholder="Bullet point (one per line)"
          rows={Math.max(2, localBullets.split('\n').length)}
        />

        {/* Add slide button */}
        <button
          onClick={onAdd}
          disabled={!canAdd}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-brand disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
          title={!canAdd ? 'Maximum 20 slides allowed' : 'Add slide below'}
        >
          <Plus className="h-3 w-3" />
          Add slide below
        </button>
      </div>
    </div>
  );
}
