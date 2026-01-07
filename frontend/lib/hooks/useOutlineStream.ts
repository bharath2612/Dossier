'use client';

import { useCallback, useRef } from 'react';
import { useOutlineGenerationStore } from '@/store/outline-generation';
import type { GenerationMode, SSEEvent } from '@/store/types';

// Parse SSE events from a chunk of data
function parseSSEEvents(chunk: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.slice(6);
        if (jsonStr.trim()) {
          const event = JSON.parse(jsonStr) as SSEEvent;
          events.push(event);
        }
      } catch (e) {
        console.error('Failed to parse SSE event:', line, e);
      }
    }
  }

  return events;
}

export function useOutlineStream() {
  const store = useOutlineGenerationStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback(
    async (prompt: string, mode: GenerationMode) => {
      // Cancel any existing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      store.setAbortController(abortController);

      // Reset store state
      store.setPrompt(prompt);
      store.setMode(mode);
      store.setStatus('preprocessing');
      store.setError(null);
      store.clearResearchSources();
      store.clearBuffer();
      store.setCurrentStreamingSlide(0);

      // Clear existing slides
      while (store.slides.length > 0) {
        store.removeSlide(0);
      }

      try {
        const response = await fetch('/api/generate-outline-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete events
          const lastNewline = buffer.lastIndexOf('\n\n');
          if (lastNewline !== -1) {
            const completeData = buffer.slice(0, lastNewline + 2);
            buffer = buffer.slice(lastNewline + 2);

            const events = parseSSEEvents(completeData);

            for (const event of events) {
              handleEvent(event, store);
            }
          }
        }

        // Process any remaining data
        if (buffer.trim()) {
          const events = parseSSEEvents(buffer);
          for (const event of events) {
            handleEvent(event, store);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Generation was cancelled, don't set error
          console.log('Generation cancelled');
          return;
        }

        console.error('Stream error:', error);
        store.setError(
          error instanceof Error ? error.message : 'Failed to generate outline'
        );
        store.setStatus('error');
      } finally {
        abortControllerRef.current = null;
        store.setAbortController(null);
      }
    },
    [store]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    store.cancel();
  }, [store]);

  return {
    startGeneration,
    cancel,
    status: store.status,
    slides: store.slides,
    error: store.error,
    researchSources: store.researchSources,
    draftId: store.draftId,
    originalPrompt: store.originalPrompt,
    enhancedPrompt: store.enhancedPrompt,
    mode: store.mode,
    streamingBuffer: store.streamingBuffer,
    currentStreamingSlide: store.currentStreamingSlide,
  };
}

// Handle individual SSE events
function handleEvent(
  event: SSEEvent,
  store: ReturnType<typeof useOutlineGenerationStore.getState>
) {
  switch (event.type) {
    case 'preprocessing':
      if (event.status === 'start') {
        store.setStatus('preprocessing');
      } else if (event.status === 'complete') {
        store.setEnhancedPrompt(
          event.original_prompt || '',
          event.enhanced_prompt || ''
        );
      }
      break;

    case 'research_query':
      store.setStatus('researching');
      break;

    case 'research_source':
      store.addResearchSource(event.source);
      break;

    case 'research_complete':
      // Research phase done, outline generation starting
      break;

    case 'content_chunk':
      // Real-time streaming: append chunk to buffer for display
      store.setStatus('generating');
      store.appendToBuffer(event.chunk);
      break;

    case 'slide_complete':
      // Slide separator detected: add completed slide, clear buffer for next
      store.addSlide(event.parsed);
      store.setCurrentStreamingSlide(event.index + 1);
      store.clearBuffer();
      break;

    case 'draft_created':
      store.setDraftId(event.draftId);
      break;

    case 'complete':
      store.clearBuffer();
      store.setStatus('complete');
      break;

    case 'error':
      store.setError(event.message);
      store.setStatus('error');
      break;
  }
}

export default useOutlineStream;
