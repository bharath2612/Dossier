'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TypewriterText } from './TypewriterText';

interface OutlineCardProps {
  id: string;
  index: number;
  title: string;
  bullets: string[];
  isGenerating: boolean;
  isEditable: boolean;
  isNew?: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateBullet: (bulletIndex: number, text: string) => void;
  onAddBullet: () => void;
  onRemoveBullet: (bulletIndex: number) => void;
  onDelete: () => void;
}

export function OutlineCard({
  id,
  index,
  title,
  bullets,
  isGenerating,
  isEditable,
  isNew = false,
  onUpdateTitle,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
  onDelete,
}: OutlineCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingBulletIndex, setEditingBulletIndex] = useState<number | null>(null);
  const [localTitle, setLocalTitle] = useState(title);
  const [localBullets, setLocalBullets] = useState<string[]>(bullets);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const bulletInputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Sync local state with props
  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    setLocalBullets(bullets);
  }, [bullets]);

  // Auto-focus when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (editingBulletIndex !== null && bulletInputRefs.current[editingBulletIndex]) {
      bulletInputRefs.current[editingBulletIndex]?.focus();
    }
  }, [editingBulletIndex]);

  // DnD sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isGenerating || !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle title save
  const handleTitleSave = useCallback(() => {
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== title) {
      onUpdateTitle(trimmed);
    } else if (!trimmed) {
      setLocalTitle(title); // Revert if empty
    }
    setIsEditingTitle(false);
  }, [localTitle, title, onUpdateTitle]);

  // Handle bullet save
  const handleBulletSave = useCallback(
    (bulletIndex: number) => {
      const trimmed = localBullets[bulletIndex]?.trim() || '';
      if (trimmed !== bullets[bulletIndex]) {
        onUpdateBullet(bulletIndex, trimmed);
      }
      setEditingBulletIndex(null);
    },
    [localBullets, bullets, onUpdateBullet]
  );

  // Auto-resize textarea
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={isNew ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'group relative rounded-xl border border-border bg-card transition-all',
        isDragging && 'shadow-lg shadow-black/10 ring-2 ring-brand/20',
        isGenerating && 'pointer-events-none'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        {/* Drag Handle + Index */}
        <div className="flex items-center gap-2">
          {isEditable && !isGenerating && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground hover:text-foreground transition-colors active:cursor-grabbing"
              title="Drag to reorder (Cmd+↑/↓)"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <span className="flex items-center justify-center h-6 w-6 rounded-md bg-secondary text-sm font-medium text-muted-foreground">
            {index + 1}
          </span>
        </div>

        {/* Actions */}
        {isEditable && !isGenerating && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete slide (Cmd+Backspace)"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="group/title">
          {isEditingTitle ? (
            <textarea
              ref={titleInputRef}
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value);
                autoResize(e.target);
              }}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTitleSave();
                }
                if (e.key === 'Escape') {
                  setLocalTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              className="w-full resize-none bg-transparent text-lg font-semibold text-foreground outline-none border-b-2 border-brand/50 focus:border-brand pb-1"
              rows={1}
            />
          ) : isGenerating ? (
            <h3 className="text-lg font-semibold text-foreground">
              <TypewriterText text={title} speed={15} />
            </h3>
          ) : (
            <h3
              className={cn(
                'text-lg font-semibold text-foreground',
                isEditable &&
                  'cursor-text hover:bg-secondary/50 rounded px-1 -mx-1 transition-colors'
              )}
              onClick={() => isEditable && setIsEditingTitle(true)}
            >
              {title || (
                <span className="text-muted-foreground italic">
                  Click to add title...
                </span>
              )}
            </h3>
          )}
        </div>

        {/* Bullets */}
        <ul className="space-y-2">
          {localBullets.map((bullet, bulletIndex) => (
            <li key={bulletIndex} className="group/bullet flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {editingBulletIndex === bulletIndex ? (
                  <div className="flex items-start gap-1">
                    <textarea
                      ref={(el) => {
                        bulletInputRefs.current[bulletIndex] = el;
                      }}
                      value={bullet}
                      onChange={(e) => {
                        const newBullets = [...localBullets];
                        newBullets[bulletIndex] = e.target.value;
                        setLocalBullets(newBullets);
                        autoResize(e.target);
                      }}
                      onBlur={() => handleBulletSave(bulletIndex)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleBulletSave(bulletIndex);
                        }
                        if (e.key === 'Escape') {
                          setLocalBullets(bullets);
                          setEditingBulletIndex(null);
                        }
                      }}
                      className="flex-1 resize-none bg-transparent text-sm text-foreground outline-none border-b border-brand/50 focus:border-brand"
                      rows={1}
                    />
                    {localBullets.length > 1 && (
                      <button
                        onClick={() => onRemoveBullet(bulletIndex)}
                        className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : isGenerating ? (
                  <span className="text-sm text-muted-foreground">
                    <TypewriterText
                      text={bullet}
                      speed={10}
                      startDelay={bulletIndex * 100}
                    />
                  </span>
                ) : (
                  <div className="flex items-start gap-1">
                    <span
                      className={cn(
                        'text-sm text-muted-foreground flex-1',
                        isEditable &&
                          'cursor-text hover:bg-secondary/50 rounded px-1 -mx-1 transition-colors'
                      )}
                      onClick={() =>
                        isEditable && setEditingBulletIndex(bulletIndex)
                      }
                    >
                      {bullet || (
                        <span className="text-muted-foreground/50 italic">
                          Click to add content...
                        </span>
                      )}
                    </span>
                    {isEditable && localBullets.length > 1 && (
                      <button
                        onClick={() => onRemoveBullet(bulletIndex)}
                        className="p-0.5 text-muted-foreground hover:text-destructive opacity-0 group-hover/bullet:opacity-100 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Add Bullet Button */}
        {isEditable && !isGenerating && (
          <button
            onClick={onAddBullet}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add bullet
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default OutlineCard;
