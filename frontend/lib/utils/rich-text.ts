import type { TextSegment, RichTextBullet, Slide, LegacySlide, FontSize, TextStyle, TextAlignment, TextLevel } from '@/types/presentation';

/**
 * Migration helper: Convert legacy string-based slide to rich text format
 */
export function migrateSlideToRichText(slide: LegacySlide | Slide): Slide {
  // If already migrated, return as-is
  if (Array.isArray(slide.title) && Array.isArray(slide.body) && slide.body.length > 0 && typeof slide.body[0] !== 'string') {
    return slide as Slide;
  }

  const migratedBody = Array.isArray(slide.body) && slide.body.length > 0 && typeof slide.body[0] === 'string'
    ? (slide.body as string[]).map((text: string) => ({ segments: [{ text }] }))
    : slide.body;

  return {
    ...slide,
    title: typeof slide.title === 'string' 
      ? [{ text: slide.title }]
      : slide.title,
    body: migratedBody,
  };
}

/**
 * Convert TextSegment array to plain string (for backward compatibility)
 */
export function segmentsToText(segments: TextSegment[]): string {
  return segments.map(s => s.text).join('');
}

/**
 * Convert RichTextBullet array to plain string array (for backward compatibility)
 */
export function richTextBodyToPlain(body: RichTextBullet[]): string[] {
  return body.map(bullet => segmentsToText(bullet.segments));
}

/**
 * Split text segments at a given position
 */
export function splitSegments(segments: TextSegment[], position: number): [TextSegment[], TextSegment[]] {
  let currentPos = 0;
  const before: TextSegment[] = [];
  const after: TextSegment[] = [];

  for (const segment of segments) {
    const segmentEnd = currentPos + segment.text.length;

    if (segmentEnd <= position) {
      // Entire segment is before the split
      before.push(segment);
      currentPos = segmentEnd;
    } else if (currentPos >= position) {
      // Entire segment is after the split
      after.push(segment);
    } else {
      // Split point is within this segment
      const splitOffset = position - currentPos;
      const beforeText = segment.text.substring(0, splitOffset);
      const afterText = segment.text.substring(splitOffset);

      if (beforeText) {
        before.push({ ...segment, text: beforeText });
      }
      if (afterText) {
        after.push({ ...segment, text: afterText });
      }
      currentPos = segmentEnd;
    }
  }

  return [before, after];
}

/**
 * Merge adjacent segments with identical formatting
 */
export function mergeSegments(segments: TextSegment[]): TextSegment[] {
  if (segments.length <= 1) return segments;

  const merged: TextSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    if (
      current.bold === next.bold &&
      current.italic === next.italic &&
      current.underline === next.underline &&
      current.strikethrough === next.strikethrough &&
      current.link === next.link &&
      current.color === next.color &&
      current.backgroundColor === next.backgroundColor &&
      current.fontSize === next.fontSize &&
      current.textStyle === next.textStyle &&
      current.textLevel === next.textLevel &&
      current.alignment === next.alignment
    ) {
      // Merge with current segment
      current.text += next.text;
    } else {
      // Push current and start new segment
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Apply formatting to a range of text segments
 */
export function applyFormatting(
  segments: TextSegment[],
  startPosition: number,
  endPosition: number,
  format: Partial<Omit<TextSegment, 'text'>>
): TextSegment[] {
  if (startPosition === endPosition) return segments;

  const [before, middleAndAfter] = splitSegments(segments, startPosition);
  const [middle, after] = splitSegments(middleAndAfter, endPosition - startPosition);

  // Apply formatting to middle segments
  const formattedMiddle = middle.map(segment => ({
    ...segment,
    ...format,
  }));

  return mergeSegments([...before, ...formattedMiddle, ...after]);
}

/**
 * Get formatting state from a selection range
 */
export function getSelectionFormat(
  segments: TextSegment[],
  startPosition: number,
  endPosition: number
): Partial<Omit<TextSegment, 'text'>> {
  if (startPosition === endPosition || segments.length === 0) {
    // Return default formatting or first segment's formatting
    return segments.length > 0 ? {
      bold: segments[0].bold,
      italic: segments[0].italic,
      underline: segments[0].underline,
      strikethrough: segments[0].strikethrough,
      link: segments[0].link,
      color: segments[0].color,
      backgroundColor: segments[0].backgroundColor,
      fontSize: segments[0].fontSize,
      textStyle: segments[0].textStyle,
      textLevel: segments[0].textLevel,
      alignment: segments[0].alignment,
    } : {};
  }

  // Find all segments in the range
  let currentPos = 0;
  const formats: Partial<Omit<TextSegment, 'text'>>[] = [];

  for (const segment of segments) {
    const segmentEnd = currentPos + segment.text.length;

    if (segmentEnd > startPosition && currentPos < endPosition) {
      // Segment overlaps with selection
      formats.push({
        bold: segment.bold,
        italic: segment.italic,
        underline: segment.underline,
        strikethrough: segment.strikethrough,
        link: segment.link,
        color: segment.color,
        backgroundColor: segment.backgroundColor,
        fontSize: segment.fontSize,
        textStyle: segment.textStyle,
        textLevel: segment.textLevel,
        alignment: segment.alignment,
      });
    }

    currentPos = segmentEnd;
    if (currentPos >= endPosition) break;
  }

  // Return the most common format (or first if all same)
  if (formats.length === 0) return {};

  // Check if all formats are the same
  const firstFormat = formats[0];
  const allSame = formats.every(f =>
    f.bold === firstFormat.bold &&
    f.italic === firstFormat.italic &&
    f.underline === firstFormat.underline &&
    f.strikethrough === firstFormat.strikethrough &&
    f.link === firstFormat.link &&
    f.color === firstFormat.color &&
    f.backgroundColor === firstFormat.backgroundColor &&
    f.fontSize === firstFormat.fontSize &&
    f.textStyle === firstFormat.textStyle &&
    f.textLevel === firstFormat.textLevel &&
    f.alignment === firstFormat.alignment
  );

  return allSame ? firstFormat : {};
}

/**
 * Get total text length from segments
 */
export function getSegmentsLength(segments: TextSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.text.length, 0);
}

/**
 * Font size mapping (DEPRECATED - kept for backward compatibility)
 */
export const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 14,
  medium: 18,
  large: 24,
  'extra-large': 32,
};

/**
 * NEW: Unified text level mapping (Notion-style)
 * H1 = 48px (Heading 1)
 * H2 = 36px (Heading 2)
 * H3 = 28px (Heading 3)
 * Text = 16px (Normal paragraph text)
 */
export const TEXT_LEVEL_MAP: Record<TextLevel, number> = {
  h1: 48,
  h2: 36,
  h3: 28,
  text: 16,
};

/**
 * Default text segment (no formatting)
 */
export function createDefaultSegment(text: string): TextSegment {
  return { text };
}

/**
 * Create a rich text bullet from plain text
 */
export function createRichTextBullet(text: string): RichTextBullet {
  return {
    segments: [{ text }],
  };
}

