'use client';

import { useEffect, useRef } from 'react';
import { useOutlineGenerationStore } from '@/store/outline-generation';

/**
 * Auto-save hook that persists outline edits to the draft in the database
 * Debounced to avoid excessive API calls
 */
export function useOutlineAutoSave() {
  const store = useOutlineGenerationStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Only auto-save if:
    // 1. We have a draft ID
    // 2. There are unsaved changes
    // 3. Generation is complete (not still streaming)
    if (!store.draftId || !store.hasUnsavedChanges || store.status !== 'complete') {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;

        // Build outline object from current slides
        const outline = {
          title: store.slides[0]?.title || 'Untitled Presentation',
          slides: store.slides.map((slide, idx) => ({
            index: idx,
            title: slide.title,
            bullets: slide.bullets,
            type: idx === 0 ? 'intro' : idx === store.slides.length - 1 ? 'conclusion' : 'content',
          })),
        };

        // Save to backend
        const response = await fetch(`/api/drafts/${store.draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outline }),
        });

        if (!response.ok) {
          throw new Error('Failed to save draft');
        }

        // Mark as saved in store
        store.markSaved();
        console.log('[AutoSave] Draft saved successfully');
      } catch (error) {
        console.error('[AutoSave] Failed to save draft:', error);
        // Don't mark as saved if it failed
      } finally {
        isSavingRef.current = false;
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [store.slides, store.hasUnsavedChanges, store.draftId, store.status, store]);

  return {
    isSaving: isSavingRef.current,
    hasUnsavedChanges: store.hasUnsavedChanges,
    lastSaved: store.lastSaved,
  };
}
