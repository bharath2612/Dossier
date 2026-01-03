'use client';

import { useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { SlideViewer } from '@/components/presentation/slide-viewer';
import { getTheme } from '@/lib/themes';
import type { Slide, Theme, CitationStyle } from '@/types/presentation';

interface SlideThumbnailsProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlidesReorder?: (newOrder: Slide[]) => void;
  theme: Theme;
  citationStyle: CitationStyle;
}

interface SortableThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  theme: Theme;
  citationStyle: CitationStyle;
  onSelect: () => void;
}

function SortableThumbnail({
  slide,
  index,
  isActive,
  theme,
  citationStyle,
  onSelect,
}: SortableThumbnailProps) {
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

  const themeConfig = getTheme(theme);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative mb-2 cursor-pointer rounded-lg border-2 transition-all ${
        isActive
          ? 'border-brand ring-2 ring-brand/20'
          : 'border-border hover:border-muted-foreground'
      }`}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 z-10 hidden cursor-grab rounded bg-card/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Thumbnail */}
      <div
        className="overflow-hidden rounded"
        style={{
          width: '180px',
          height: '102px',
          background: slide.background_color || themeConfig.colors.background,
        }}
      >
        <div className="scale-[0.15] origin-top-left" style={{ width: '1200px', height: '680px' }}>
          <SlideViewer
            slide={slide}
            citationStyle={citationStyle}
            theme={theme}
          />
        </div>
      </div>

      {/* Slide Number */}
      <div
        className={`absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-xs font-medium ${
          isActive
            ? 'bg-brand text-brand-foreground'
            : 'bg-card/80 text-muted-foreground'
        }`}
      >
        {index + 1}
      </div>

      {/* Slide Title (optional, if space allows) */}
      {slide.title && (
        <div className="absolute inset-x-0 top-0 rounded-t bg-gradient-to-b from-black/60 to-transparent px-2 py-1">
          <p
            className="truncate text-[10px] font-medium text-white"
            title={typeof slide.title === 'string' ? slide.title : slide.title.map(s => s.text).join('')}
          >
            {typeof slide.title === 'string' ? slide.title : slide.title.map(s => s.text).join('')}
          </p>
        </div>
      )}
    </div>
  );
}

export function SlideThumbnails({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onSlidesReorder,
  theme,
  citationStyle,
}: SlideThumbnailsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current && containerRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentSlideIndex]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onSlidesReorder) {
      return;
    }

    const oldIndex = slides.findIndex((s) => s.index === active.id);
    const newIndex = slides.findIndex((s) => s.index === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(slides, oldIndex, newIndex);
      // Reindex slides
      const reindexed = newOrder.map((slide, idx) => ({
        ...slide,
        index: idx,
      }));
      onSlidesReorder(reindexed);
    }
  };

  const sortableIds = slides.map((s) => s.index);

  return (
    <div
      ref={containerRef}
      className="h-full w-[200px] overflow-y-auto border-r border-border bg-muted/30 p-3"
      role="navigation"
      aria-label="Slide thumbnails"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.index}
              ref={index === currentSlideIndex ? activeThumbnailRef : null}
            >
              <SortableThumbnail
                slide={slide}
                index={index}
                isActive={index === currentSlideIndex}
                theme={theme}
                citationStyle={citationStyle}
                onSelect={() => onSlideSelect(index)}
              />
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

