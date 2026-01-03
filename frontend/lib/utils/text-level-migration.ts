import type { TextSegment, TextLevel } from '@/types/presentation';

/**
 * Migrate old fontSize/textStyle to new textLevel system
 * This ensures backward compatibility with existing presentations
 */
export function migrateTextSegments(segments: TextSegment[]): TextSegment[] {
  return segments.map(segment => {
    const migrated = { ...segment };

    // If already has textLevel, keep it
    if (migrated.textLevel) {
      // Clean up deprecated properties
      delete (migrated as any).fontSize;
      delete (migrated as any).textStyle;
      return migrated;
    }

    // Migrate from fontSize if present
    if ((segment as any).fontSize) {
      migrated.textLevel = migrateFontSizeToTextLevel((segment as any).fontSize);
      delete (migrated as any).fontSize;
    }
    // Otherwise migrate from textStyle if present
    else if ((segment as any).textStyle) {
      migrated.textLevel = migrateTextStyleToTextLevel((segment as any).textStyle);
      delete (migrated as any).textStyle;
    }
    // Otherwise default to 'text'
    else {
      migrated.textLevel = 'text';
    }

    return migrated;
  });
}

/**
 * Migrate old fontSize values to TextLevel
 */
export function migrateFontSizeToTextLevel(fontSize?: string): TextLevel {
  switch (fontSize) {
    case 'small':
      return 'text';
    case 'medium':
      return 'text';
    case 'large':
      return 'h3';
    case 'extra-large':
      return 'h1';
    default:
      return 'text';
  }
}

/**
 * Migrate old TextStyle to TextLevel
 */
export function migrateTextStyleToTextLevel(textStyle?: string): TextLevel {
  switch (textStyle) {
    case 'heading':
      return 'h1';
    case 'subtitle':
      return 'h2';
    case 'body':
      return 'text';
    case 'quote':
      return 'text';
    default:
      return 'text';
  }
}
