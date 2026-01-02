'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Presentation } from '@/types/presentation';
import { MoreVertical, Eye, Edit, Copy, Trash2, Loader2 } from 'lucide-react';

interface PresentationCardProps {
  presentation: Presentation;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function PresentationCard({
  presentation,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: PresentationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const slideCount = presentation.slides.length;
  const updatedAt = new Date(presentation.updated_at);
  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });
  const isGenerating = presentation.status === 'generating';
  const isFailed = presentation.status === 'failed';

  return (
    <div className={`group relative rounded-lg border bg-card p-6 transition-all ${
      isGenerating 
        ? 'border-brand/50 bg-brand/5' 
        : isFailed 
        ? 'border-destructive/50 bg-destructive/5'
        : 'border-border hover:border-brand/50'
    }`}>
      {/* Card Content */}
      <div className={`cursor-pointer ${isGenerating ? 'opacity-70' : ''}`} onClick={onView}>
        {/* Title */}
        <div className="flex items-start gap-2">
          {isGenerating && (
            <Loader2 className="h-5 w-5 animate-spin text-brand flex-shrink-0 mt-0.5" />
          )}
          <h3 className="text-lg font-medium text-foreground line-clamp-2">
            {presentation.title}
          </h3>
        </div>

        {/* Status Badge */}
        {isGenerating && (
          <div className="mt-3 inline-block rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white shadow-sm animate-pulse">
            Generating...
          </div>
        )}
        {isFailed && (
          <div className="mt-2 inline-block rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            Generation Failed
          </div>
        )}

        {/* Metadata */}
        <div className="mt-3 flex items-center space-x-3 font-mono text-xs text-muted-foreground">
          <span>{slideCount} {isGenerating ? 'slides planned' : 'slides'}</span>
          <span className="text-border">|</span>
          <span className="capitalize">{presentation.citation_style}</span>
          <span className="text-border">|</span>
          <span className="capitalize">{presentation.theme}</span>
        </div>

        {/* Updated time */}
        <p className="mt-4 text-xs text-muted-foreground">
          {isGenerating ? 'Started' : 'Updated'} {timeAgo}
        </p>
      </div>
      
      {/* Generating overlay - subtle blur effect */}
      {isGenerating && (
        <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px] rounded-lg pointer-events-none" />
      )}

      {/* Actions Menu */}
      <div className="absolute right-4 top-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-8 z-20 w-48 rounded-md border border-border bg-card py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onView();
                }}
                className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>View</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onEdit();
                }}
                disabled={isGenerating}
                className={`flex w-full items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                  isGenerating 
                    ? 'text-muted-foreground/50 cursor-not-allowed' 
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span>Edit</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDuplicate();
                }}
                disabled={isGenerating}
                className={`flex w-full items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                  isGenerating 
                    ? 'text-muted-foreground/50 cursor-not-allowed' 
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Duplicate</span>
              </button>

              <div className="my-1 border-t border-border" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete();
                }}
                className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-destructive transition-colors hover:bg-secondary"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hover indicator - subtle green accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg bg-brand opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
