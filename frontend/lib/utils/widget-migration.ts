import { generateWidgetId, getNextZIndex } from './widget-utils';
import type { Slide, ContentBlock, TextWidget, HeadingWidget, ImageWidget } from '@/types/presentation';

/**
 * Migrate a legacy slide (title/body strings) to widget-based format
 */
export function migrateLegacySlideToWidgets(slide: Slide): ContentBlock[] {
  const widgets: ContentBlock[] = [];
  let yOffset = 10; // Start 10% from top

  // Migrate title to Heading H1 widget
  if (slide.title && slide.title.trim()) {
    const titleText = typeof slide.title === 'string' ? slide.title :
      Array.isArray(slide.title) ? slide.title.map(s => s.text).join('') : '';

    if (titleText.trim()) {
      const titleWidget: HeadingWidget = {
        id: generateWidgetId(),
        type: 'heading',
        position: { x: 10, y: yOffset, width: 80, height: 15 },
        zIndex: getNextZIndex(widgets),
        data: {
          level: 'h1',
          segments: Array.isArray(slide.title)
            ? slide.title.map(seg => ({ ...seg, textLevel: 'h1' as const }))
            : [{ text: titleText, textLevel: 'h1' as const }],
        },
      };
      widgets.push(titleWidget);
      yOffset += 18; // Move down for next element
    }
  }

  // Migrate body bullets to Text widgets
  if (Array.isArray(slide.body) && slide.body.length > 0) {
    slide.body.forEach((bullet) => {
      if (!bullet) return;

      const bulletText = typeof bullet === 'string' ? bullet :
        'segments' in bullet ? bullet.segments.map(s => s.text).join('') : '';

      if (!bulletText.trim()) return;

      const textWidget: TextWidget = {
        id: generateWidgetId(),
        type: 'text',
        position: { x: 15, y: yOffset, width: 75, height: 8 },
        zIndex: getNextZIndex(widgets),
        data: {
          segments: typeof bullet === 'string'
            ? [{ text: bullet, textLevel: 'text' as const }]
            : 'segments' in bullet
            ? bullet.segments.map(seg => ({ ...seg, textLevel: 'text' as const }))
            : [{ text: bulletText, textLevel: 'text' as const }],
        },
      };
      widgets.push(textWidget);
      yOffset += 10; // Space between bullets
    });
  }

  // Migrate legacy image to ImageWidget
  if (slide.image && slide.image.url) {
    // Position image based on its original position preference
    let imagePosition = { x: 60, y: 60, width: 30, height: 30 };

    switch (slide.image.position) {
      case 'left':
        imagePosition = { x: 5, y: 30, width: 35, height: 35 };
        break;
      case 'right':
        imagePosition = { x: 60, y: 30, width: 35, height: 35 };
        break;
      case 'top':
        imagePosition = { x: 25, y: 5, width: 50, height: 30 };
        break;
      case 'bottom':
        imagePosition = { x: 25, y: 65, width: 50, height: 30 };
        break;
      case 'background':
        imagePosition = { x: 0, y: 0, width: 100, height: 100 };
        break;
      default:
        // Center-right position for 'none' or unspecified
        imagePosition = { x: 60, y: 40, width: 35, height: 35 };
    }

    const imageWidget: ImageWidget = {
      id: generateWidgetId(),
      type: 'image',
      position: imagePosition,
      zIndex: slide.image.position === 'background' ? 0 : getNextZIndex(widgets) + 10,
      data: {
        ...slide.image,
        position: 'none', // Reset position since we're using absolute positioning now
      },
    };
    widgets.push(imageWidget);
  }

  return widgets;
}

/**
 * Check if a slide needs migration (has no content_blocks but has legacy content)
 */
export function slideNeedsMigration(slide: Slide): boolean {
  // If already has content_blocks, no migration needed
  if (slide.content_blocks && slide.content_blocks.length > 0) {
    return false;
  }

  // If has legacy content (title or body), needs migration
  const hasTitle = slide.title && slide.title.trim();
  const hasBody = Array.isArray(slide.body) && slide.body.length > 0;
  const hasImage = slide.image && slide.image.url;

  return !!(hasTitle || hasBody || hasImage);
}

/**
 * Migrate slide if needed and return updated slide
 */
export function migrateSlideIfNeeded(slide: Slide): Slide {
  if (!slideNeedsMigration(slide)) {
    return slide;
  }

  const content_blocks = migrateLegacySlideToWidgets(slide);

  return {
    ...slide,
    content_blocks,
  };
}

/**
 * Migrate all slides in a presentation
 */
export function migrateSlidesToWidgets(slides: Slide[]): Slide[] {
  return slides.map(migrateSlideIfNeeded);
}
