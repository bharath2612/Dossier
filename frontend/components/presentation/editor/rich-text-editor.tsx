'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { TextSegment, FontSize, TextStyle, TextAlignment } from '@/types/presentation';
import {
  applyFormatting,
  mergeSegments,
  getSelectionFormat,
  getSegmentsLength,
  FONT_SIZE_MAP,
} from '@/lib/utils/rich-text';

interface RichTextEditorProps {
  segments: TextSegment[];
  onChange: (segments: TextSegment[]) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onSelectionChange?: (hasSelection: boolean, format: Partial<Omit<TextSegment, 'text'>>) => void;
  disabled?: boolean;
}

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(function RichTextEditor({
  segments,
  onChange,
  placeholder,
  className,
  style,
  onSelectionChange,
  disabled = false,
}, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  // Convert segments to HTML
  const segmentsToHTML = useCallback((segs: TextSegment[]): string => {
    return segs
      .map((segment) => {
        let html = segment.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        if (segment.bold) html = `<strong>${html}</strong>`;
        if (segment.italic) html = `<em>${html}</em>`;
        if (segment.underline) html = `<u>${html}</u>`;
        if (segment.strikethrough) html = `<s>${html}</s>`;
        if (segment.link) html = `<a href="${segment.link}" target="_blank" rel="noopener noreferrer">${html}</a>`;

        const styles: string[] = [];
        if (segment.color) styles.push(`color: ${segment.color}`);
        if (segment.backgroundColor) styles.push(`background-color: ${segment.backgroundColor}`);
        if (segment.fontSize) {
          styles.push(`font-size: ${FONT_SIZE_MAP[segment.fontSize]}px`);
        }
        // Note: text-align is handled at the container level, not per-segment

        if (styles.length > 0) {
          html = `<span style="${styles.join('; ')}">${html}</span>`;
        }

        return html;
      })
      .join('');
  }, []);

  // Convert HTML/DOM to segments
  const htmlToSegments = useCallback((element: HTMLElement): TextSegment[] => {
    const segments: TextSegment[] = [];

    const walk = (node: Node, format: Partial<Omit<TextSegment, 'text'>> = {}): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text) {
          segments.push({
            text,
            ...format,
          });
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as HTMLElement;
      const newFormat = { ...format };

      // Extract formatting from element
      if (el.tagName === 'STRONG' || el.tagName === 'B') {
        newFormat.bold = true;
      }
      if (el.tagName === 'EM' || el.tagName === 'I') {
        newFormat.italic = true;
      }
      if (el.tagName === 'U') {
        newFormat.underline = true;
      }
      if (el.tagName === 'S' || el.tagName === 'STRIKE' || el.tagName === 'DEL') {
        newFormat.strikethrough = true;
      }
      if (el.tagName === 'A') {
        newFormat.link = el.getAttribute('href') || undefined;
      }

      // Extract styles
      const computedStyle = window.getComputedStyle(el);
      const color = computedStyle.color;
      if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
        newFormat.color = color;
      }

      const backgroundColor = computedStyle.backgroundColor;
      if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
        newFormat.backgroundColor = backgroundColor;
      }

      const fontSize = computedStyle.fontSize;
      if (fontSize) {
        const size = parseInt(fontSize);
        // Map pixel size to FontSize enum
        if (size <= 16) newFormat.fontSize = 'small';
        else if (size <= 22) newFormat.fontSize = 'medium';
        else if (size <= 28) newFormat.fontSize = 'large';
        else newFormat.fontSize = 'extra-large';
      }

      // Note: text-align is handled at the container level, not parsed from inline elements

      // Recursively process children
      Array.from(el.childNodes).forEach((child) => walk(child, newFormat));
    };

    walk(element);
    return mergeSegments(segments.length > 0 ? segments : [{ text: '' }]);
  }, []);

  // Update editor content when segments change externally
  useEffect(() => {
    if (!editorRef.current || isComposingRef.current) {
      console.log('[RichTextEditor] Skipping content update - no editor or composing');
      return;
    }

    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const editor = editorRef.current;

    // Save cursor position
    let offset = 0;
    if (range && editor.contains(range.commonAncestorContainer)) {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editor);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      offset = preCaretRange.toString().length;
      console.log('[RichTextEditor] Saved cursor position:', offset);
    }

    // Update HTML
    const html = segmentsToHTML(segments);
    if (editor.innerHTML !== html) {
      console.log('[RichTextEditor] Updating editor HTML');
      editor.innerHTML = html || '<br>';
    }

    // Restore cursor position
    if (range && offset >= 0) {
      try {
        const textNode = editor.childNodes[0];
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const len = (textNode.textContent || '').length;
          const newOffset = Math.min(offset, len);
          range.setStart(textNode, newOffset);
          range.setEnd(textNode, newOffset);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } else {
          // Try to find position in DOM
          let currentOffset = 0;
          const findNode = (node: Node, targetOffset: number): [Node, number] | null => {
            if (node.nodeType === Node.TEXT_NODE) {
              const len = node.textContent?.length || 0;
              if (currentOffset + len >= targetOffset) {
                return [node, targetOffset - currentOffset];
              }
              currentOffset += len;
              return null;
            }
            for (const child of Array.from(node.childNodes)) {
              const result = findNode(child, targetOffset);
              if (result) return result;
            }
            return null;
          };

          const result = findNode(editor, offset);
          if (result) {
            range.setStart(result[0], result[1]);
            range.setEnd(result[0], result[1]);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }
      } catch (e) {
        // Ignore cursor restoration errors
      }
    }
  }, [segments, segmentsToHTML]);

  // Handle input
  const handleInput = useCallback(() => {
    if (!editorRef.current || isComposingRef.current) return;

    const newSegments = htmlToSegments(editorRef.current);
    onChange(newSegments);
  }, [htmlToSegments, onChange]);

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || disabled) {
      console.log('[RichTextEditor] Selection change blocked - no editor or disabled');
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.log('[RichTextEditor] No selection or no ranges');
      onSelectionChange?.(false, {});
      return;
    }

    const range = selection.getRangeAt(0);
    const editor = editorRef.current;

    if (!editor.contains(range.commonAncestorContainer)) {
      console.log('[RichTextEditor] Selection not in this editor');
      onSelectionChange?.(false, {});
      return;
    }

    // Calculate selection position
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(editor);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;

    const postSelectionRange = range.cloneRange();
    postSelectionRange.selectNodeContents(editor);
    postSelectionRange.setEnd(range.endContainer, range.endOffset);
    const endOffset = postSelectionRange.toString().length;

    if (startOffset !== endOffset) {
      const format = getSelectionFormat(segments, startOffset, endOffset);
      console.log('[RichTextEditor] Text selected:', {
        startOffset,
        endOffset,
        text: selection.toString(),
        format
      });
      onSelectionChange?.(true, format);
    } else {
      console.log('[RichTextEditor] Selection collapsed (no text selected)');
      onSelectionChange?.(false, {});
    }
  }, [segments, onSelectionChange, disabled]);

  // Listen for selection changes
  useEffect(() => {
    console.log('[RichTextEditor] Adding selectionchange listener');
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      console.log('[RichTextEditor] Removing selectionchange listener');
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Handle composition (for IME input)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleInput();
  }, [handleInput]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    // Handle formatting shortcuts
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) return;

      const editor = editorRef.current;
      if (!editor || !editor.contains(range.commonAncestorContainer)) return;

      // Calculate selection
      const preRange = range.cloneRange();
      preRange.selectNodeContents(editor);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;

      const postRange = range.cloneRange();
      postRange.selectNodeContents(editor);
      postRange.setEnd(range.endContainer, range.endOffset);
      const endOffset = postRange.toString().length;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        const format = getSelectionFormat(segments, startOffset, endOffset);
        const newSegments = applyFormatting(segments, startOffset, endOffset, {
          bold: !format.bold,
        });
        onChange(newSegments);
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        const format = getSelectionFormat(segments, startOffset, endOffset);
        const newSegments = applyFormatting(segments, startOffset, endOffset, {
          italic: !format.italic,
        });
        onChange(newSegments);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        const format = getSelectionFormat(segments, startOffset, endOffset);
        const newSegments = applyFormatting(segments, startOffset, endOffset, {
          underline: !format.underline,
        });
        onChange(newSegments);
      }
    }
  }, [segments, onChange, disabled]);

  // Apply formatting externally (called from toolbar)
  const applyFormat = useCallback((
    format: Partial<Omit<TextSegment, 'text'>>
  ) => {
    console.log('[RichTextEditor] applyFormat called with:', format);

    if (!editorRef.current || disabled) {
      console.log('[RichTextEditor] applyFormat blocked - no editor or disabled');
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.log('[RichTextEditor] applyFormat - no selection');
      return;
    }

    const range = selection.getRangeAt(0);
    const editor = editorRef.current;

    if (!editor.contains(range.commonAncestorContainer)) {
      console.log('[RichTextEditor] applyFormat - selection not in this editor');
      return;
    }

    // Calculate selection
    const preRange = range.cloneRange();
    preRange.selectNodeContents(editor);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;

    const postRange = range.cloneRange();
    postRange.selectNodeContents(editor);
    postRange.setEnd(range.endContainer, range.endOffset);
    const endOffset = postRange.toString().length;

    console.log('[RichTextEditor] applyFormat - offsets:', { startOffset, endOffset });

    if (startOffset === endOffset) {
      console.log('[RichTextEditor] applyFormat - no text selected (collapsed selection)');
      return;
    }

    console.log('[RichTextEditor] Applying format to segments');
    const newSegments = applyFormatting(segments, startOffset, endOffset, format);
    onChange(newSegments);
    console.log('[RichTextEditor] Format applied successfully');
  }, [segments, onChange, disabled]);

  // Expose applyFormat method to parent via ref
  useImperativeHandle(ref, () => {
    console.log('[RichTextEditor] Setting up imperative handle with applyFormat');
    return {
      ...editorRef.current!,
      applyFormat,
    };
  }, [applyFormat]);

  const displayText = segments.length > 0
    ? segments.map(s => s.text).join('')
    : '';

  // Get alignment from segments (use first segment's alignment or default to left)
  const alignment = segments.length > 0 && segments[0].alignment
    ? segments[0].alignment
    : 'left';

  return (
    <div
      ref={editorRef}
      contentEditable={!disabled}
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      data-placeholder={placeholder}
      className={`${className || ''} ${!displayText && !isFocused && placeholder ? 'before:content-[attr(data-placeholder)] before:text-muted-foreground before:pointer-events-none' : ''}`}
      style={{
        outline: 'none',
        minHeight: '1.5em',
        textAlign: alignment,
        ...style,
      }}
      suppressContentEditableWarning
    />
  );
});

