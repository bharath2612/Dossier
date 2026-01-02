'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Slide } from '@/types/presentation';

interface SlideEditorCardProps {
  slide: Slide;
  slideCount: number;
  onUpdate: (updates: Partial<Slide>) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export function SlideEditorCard({
  slide,
  slideCount,
  onUpdate,
  onAdd,
  onRemove,
}: SlideEditorCardProps) {
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localBody, setLocalBody] = useState(slide.body.join('\n'));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localBody]);

  const handleTitleBlur = () => {
    if (localTitle !== slide.title) {
      onUpdate({ title: localTitle });
    }
  };

  const handleBodyBlur = () => {
    const bulletArray = localBody
      .split('\n')
      .filter((b) => b.trim())
      .map((b) => b.replace(/^[•\-*]\s*/, '').trim());

    if (JSON.stringify(bulletArray) !== JSON.stringify(slide.body)) {
      onUpdate({ body: bulletArray });
    }
  };

  const slideTypes = [
    { value: 'intro', label: 'Introduction' },
    { value: 'content', label: 'Content' },
    { value: 'data', label: 'Data' },
    { value: 'quote', label: 'Quote' },
    { value: 'conclusion', label: 'Conclusion' },
  ];

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Card */}
      <div className="rounded-lg border-2 border-[#1a1a1a] bg-[#0f0f0f] p-6 transition-colors hover:border-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-gray-700 transition-colors hover:text-gray-400 active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Slide number */}
            <span className="text-sm font-medium text-gray-600">
              Slide {slide.index + 1}
            </span>

            {/* Type selector */}
            <select
              value={slide.type}
              onChange={(e) => onUpdate({ type: e.target.value as Slide['type'] })}
              className="rounded border border-[#1a1a1a] bg-transparent px-2 py-1 text-xs uppercase tracking-wider text-gray-700 outline-none transition-colors hover:border-gray-700"
            >
              {slideTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onAdd}
              disabled={slideCount >= 20}
              className="rounded p-1.5 text-gray-600 transition-colors hover:bg-[#1a1a1a] hover:text-gray-400 disabled:cursor-not-allowed disabled:opacity-30"
              title="Add slide after"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onRemove}
              disabled={slideCount <= 1}
              className="rounded p-1.5 text-gray-600 transition-colors hover:bg-[#1a1a1a] hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
              title="Delete slide"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title input */}
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Slide title..."
          className="mb-4 w-full border-none bg-transparent text-2xl font-medium text-white outline-none placeholder:text-gray-700"
        />

        {/* Body textarea */}
        <textarea
          ref={textareaRef}
          value={localBody}
          onChange={(e) => setLocalBody(e.target.value)}
          onBlur={handleBodyBlur}
          placeholder="• Bullet point (one per line)&#10;• Use • or - for bullets&#10;• Or just type content"
          className="w-full resize-none border-none bg-transparent text-sm leading-relaxed text-gray-500 outline-none placeholder:text-gray-700"
          rows={3}
        />

        {/* Character count */}
        {localTitle.length > 80 && (
          <p className="mt-2 text-xs text-gray-600">
            Title: {localTitle.length}/100 characters
          </p>
        )}
      </div>

      {/* Add slide button (between cards) */}
      <div className="flex justify-center py-2">
        <button
          onClick={onAdd}
          disabled={slideCount >= 20}
          className="rounded-full border border-[#1a1a1a] bg-[#0a0a0a] p-1.5 text-gray-700 opacity-0 transition-all hover:border-gray-700 hover:text-gray-400 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
