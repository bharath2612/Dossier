'use client';

import { useCallback, useState, useEffect } from 'react';
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
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOutlineGenerationStore } from '@/store/outline-generation';
import { OutlineCard } from './OutlineCard';
import { StreamingOutlineCard } from './StreamingOutlineCard';
import type { GeneratedSlide, GenerationStatus } from '@/store/types';

interface OutlineListProps {
  slides: GeneratedSlide[];
  status: GenerationStatus;
  streamingBuffer?: string;
  currentStreamingSlide?: number;
}

export function OutlineList({ slides, status, streamingBuffer = '', currentStreamingSlide = 0 }: OutlineListProps) {
  const store = useOutlineGenerationStore();
  const [newSlideIds, setNewSlideIds] = useState<Set<number>>(new Set());

  const isGenerating = status === 'generating' || status === 'preprocessing' || status === 'researching';
  const isEditable = status === 'complete';

  // Track newly added slides for animation
  useEffect(() => {
    if (isGenerating && slides.length > 0) {
      const latestIndex = slides[slides.length - 1]?.index;
      if (latestIndex !== undefined && !newSlideIds.has(latestIndex)) {
        setNewSlideIds((prev) => new Set([...prev, latestIndex]));
      }
    }
  }, [slides.length, isGenerating, newSlideIds, slides]);

  // DnD sensors
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

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = slides.findIndex((s) => `slide-${s.index}` === active.id);
        const newIndex = slides.findIndex((s) => `slide-${s.index}` === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          store.reorderSlides(oldIndex, newIndex);
        }
      }
    },
    [slides, store]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditable) return;

      // Focus on a card is required for these shortcuts
      const activeElement = document.activeElement;
      const isInCard = activeElement?.closest('[data-outline-card]');

      if (!isInCard) return;

      const cardIndex = parseInt(
        (activeElement?.closest('[data-outline-card]') as HTMLElement)?.dataset
          .cardIndex || '-1'
      );

      if (cardIndex === -1) return;

      // Cmd+Backspace to delete
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
        e.preventDefault();
        store.removeSlide(cardIndex);
      }

      // Cmd+Enter to add slide below
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        store.insertSlide(cardIndex);
      }

      // Cmd+Up to move up
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp' && cardIndex > 0) {
        e.preventDefault();
        store.reorderSlides(cardIndex, cardIndex - 1);
      }

      // Cmd+Down to move down
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'ArrowDown' &&
        cardIndex < slides.length - 1
      ) {
        e.preventDefault();
        store.reorderSlides(cardIndex, cardIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditable, slides.length, store]);

  // Handlers for card actions
  const handleUpdateTitle = useCallback(
    (index: number, title: string) => {
      store.updateSlide(index, { title });
    },
    [store]
  );

  const handleUpdateBullet = useCallback(
    (slideIndex: number, bulletIndex: number, text: string) => {
      store.updateBullet(slideIndex, bulletIndex, text);
    },
    [store]
  );

  const handleAddBullet = useCallback(
    (slideIndex: number) => {
      store.addBullet(slideIndex);
    },
    [store]
  );

  const handleRemoveBullet = useCallback(
    (slideIndex: number, bulletIndex: number) => {
      store.removeBullet(slideIndex, bulletIndex);
    },
    [store]
  );

  const handleDeleteSlide = useCallback(
    (index: number) => {
      store.removeSlide(index);
    },
    [store]
  );

  const handleInsertSlide = useCallback(
    (afterIndex: number) => {
      store.insertSlide(afterIndex);
    },
    [store]
  );

  if (slides.length === 0 && !isGenerating) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      {/* Loading state with progress bar */}
      {(status === 'preprocessing' || status === 'researching') && slides.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col items-center justify-center py-12"
        >
          {/* Progress bar container */}
          <div className="w-full max-w-md mb-6">
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: status === 'preprocessing' ? '60%' : '90%',
                }}
                transition={{
                  duration: status === 'preprocessing' ? 2 : 3,
                  ease: 'easeOut',
                }}
              />
            </div>
          </div>

          {/* Status icon and text */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-5 w-5 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {status === 'preprocessing'
                ? 'Enhancing your prompt...'
                : 'Conducting research...'}
            </p>
          </div>

          {/* Sub-text */}
          <p className="text-xs text-muted-foreground mt-2">
            {status === 'preprocessing'
              ? 'Making your topic more specific and actionable'
              : 'Gathering insights from multiple sources'}
          </p>
        </motion.div>
      )}

      {/* Slides List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slides.map((s) => `slide-${s.index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {slides.map((slide, idx) => (
                <div key={`slide-${slide.index}`}>
                  <div data-outline-card data-card-index={idx}>
                    <OutlineCard
                      id={`slide-${slide.index}`}
                      index={idx}
                      title={slide.title}
                      bullets={slide.bullets}
                      isGenerating={false}
                      isEditable={isEditable}
                      isNew={newSlideIds.has(slide.index)}
                      onUpdateTitle={(title) => handleUpdateTitle(idx, title)}
                      onUpdateBullet={(bulletIndex, text) =>
                        handleUpdateBullet(idx, bulletIndex, text)
                      }
                      onAddBullet={() => handleAddBullet(idx)}
                      onRemoveBullet={(bulletIndex) =>
                        handleRemoveBullet(idx, bulletIndex)
                      }
                      onDelete={() => handleDeleteSlide(idx)}
                    />
                  </div>

                  {/* Add Slide Button Between Cards */}
                  {isEditable && idx < slides.length - 1 && (
                    <div className="flex items-center justify-center py-2">
                      <button
                        onClick={() => handleInsertSlide(idx)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-full',
                          'text-xs text-muted-foreground',
                          'border border-dashed border-border',
                          'hover:border-brand/50 hover:text-foreground hover:bg-secondary/30',
                          'transition-all opacity-0 group-hover:opacity-100',
                          'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand/20'
                        )}
                        style={{ opacity: 1 }} // Always visible for now
                        title="Add slide (Cmd+Enter)"
                      >
                        <Plus className="h-3 w-3" />
                        Add slide
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming card - shows live typing effect */}
              {status === 'generating' && (
                <div key="streaming-card">
                  <StreamingOutlineCard
                    buffer={streamingBuffer}
                    slideIndex={currentStreamingSlide}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Add Slide at End */}
            {isEditable && slides.length > 0 && slides.length < 20 && (
              <div className="flex items-center justify-center pt-4">
                <button
                  onClick={() => handleInsertSlide(slides.length - 1)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    'text-sm text-muted-foreground',
                    'border border-dashed border-border',
                    'hover:border-brand/50 hover:text-foreground hover:bg-secondary/30',
                    'transition-all'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Add slide
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Slide Count */}
      {slides.length > 0 && (
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            {slides.length} slide{slides.length !== 1 ? 's' : ''}
            {slides.length < 5 && isEditable && (
              <span className="text-amber-500 ml-2">
                (minimum 5 required)
              </span>
            )}
            {slides.length >= 20 && isEditable && (
              <span className="text-amber-500 ml-2">
                (maximum 20)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default OutlineList;
