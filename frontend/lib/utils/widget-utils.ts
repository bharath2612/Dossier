import type {
  ContentBlock,
  WidgetType,
  WidgetPosition,
  TextWidget,
  HeadingWidget,
  CardWidget,
  StickyNoteWidget,
  ImageWidget,
  DiagramWidget,
  ArrowWidget,
  LineWidget,
  HeadingLevel,
} from '@/types/presentation';

// Generate unique widget ID
export function generateWidgetId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get default position for widget type
export function getDefaultPosition(type: WidgetType): WidgetPosition {
  switch (type) {
    case 'heading':
      return { x: 10, y: 10, width: 80, height: 15 };
    case 'text':
      return { x: 10, y: 30, width: 80, height: 10 };
    case 'card':
      return { x: 20, y: 20, width: 60, height: 40 };
    case 'sticky-note':
      return { x: 60, y: 20, width: 30, height: 30 };
    case 'image':
      return { x: 30, y: 30, width: 40, height: 40 };
    case 'diagram':
      return { x: 20, y: 20, width: 60, height: 50 };
    case 'arrow':
      return { x: 30, y: 30, width: 40, height: 20 };
    case 'line':
      return { x: 30, y: 50, width: 40, height: 2 };
    default:
      return { x: 25, y: 25, width: 50, height: 30 };
  }
}

// Get default z-index for new widget (place on top)
export function getNextZIndex(widgets: ContentBlock[]): number {
  if (widgets.length === 0) return 1;
  return Math.max(...widgets.map(w => w.zIndex)) + 1;
}

// Create default widget of given type
export function createDefaultWidget(type: WidgetType, widgets: ContentBlock[] = []): ContentBlock {
  const id = generateWidgetId();
  const position = getDefaultPosition(type);
  const zIndex = getNextZIndex(widgets);

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        position,
        zIndex,
        data: { segments: [{ text: 'Enter text here', textLevel: 'text' }] },
      } as TextWidget;

    case 'heading': {
      return {
        id,
        type: 'heading',
        position,
        zIndex,
        data: {
          level: 'h2' as HeadingLevel,
          segments: [{ text: 'Heading', textLevel: 'h2' }],
        },
      } as HeadingWidget;
    }

    case 'card':
      return {
        id,
        type: 'card',
        position,
        zIndex,
        data: {
          title: [{ text: 'Card Title', bold: true, textLevel: 'h3' }],
          body: [{ text: 'Card content goes here', textLevel: 'text' }],
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
        },
      } as CardWidget;

    case 'sticky-note':
      return {
        id,
        type: 'sticky-note',
        position,
        zIndex,
        data: {
          segments: [{ text: 'Sticky note', textLevel: 'text' }],
          color: '#fef08a', // Yellow
          rotation: 2,
        },
      } as StickyNoteWidget;

    case 'image':
      return {
        id,
        type: 'image',
        position,
        zIndex,
        data: {
          url: '',
          position: 'none',
        },
      } as ImageWidget;

    case 'diagram':
      return {
        id,
        type: 'diagram',
        position,
        zIndex,
        data: {
          diagramType: 'flowchart',
          elements: [],
        },
      } as DiagramWidget;

    case 'arrow':
      return {
        id,
        type: 'arrow',
        position,
        zIndex,
        data: {
          startPoint: { x: 0, y: 50 },
          endPoint: { x: 100, y: 50 },
          color: '#000000',
          thickness: 2,
        },
      } as ArrowWidget;

    case 'line':
      return {
        id,
        type: 'line',
        position,
        zIndex,
        data: {
          startPoint: { x: 0, y: 50 },
          endPoint: { x: 100, y: 50 },
          style: 'solid',
          color: '#000000',
          thickness: 2,
        },
      } as LineWidget;

    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
}

// Bring widget to front
export function bringToFront(widgets: ContentBlock[], id: string): ContentBlock[] {
  const maxZIndex = Math.max(...widgets.map(w => w.zIndex));
  return widgets.map(w =>
    w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w
  );
}

// Send widget to back
export function sendToBack(widgets: ContentBlock[], id: string): ContentBlock[] {
  const minZIndex = Math.min(...widgets.map(w => w.zIndex));
  return widgets.map(w =>
    w.id === id ? { ...w, zIndex: minZIndex - 1 } : w
  );
}

// Delete widget by ID
export function deleteWidget(widgets: ContentBlock[], id: string): ContentBlock[] {
  return widgets.filter(w => w.id !== id);
}

// Update widget by ID
export function updateWidget(
  widgets: ContentBlock[],
  id: string,
  updates: Partial<ContentBlock>
): ContentBlock[] {
  return widgets.map(w =>
    w.id === id ? { ...w, ...updates } as ContentBlock : w
  );
}

// Sort widgets by z-index (for rendering order)
export function sortByZIndex(widgets: ContentBlock[]): ContentBlock[] {
  return [...widgets].sort((a, b) => a.zIndex - b.zIndex);
}

// Check if position is within bounds (0-100%)
export function isValidPosition(position: WidgetPosition): boolean {
  return (
    position.x >= 0 && position.x <= 100 &&
    position.y >= 0 && position.y <= 100 &&
    position.width > 0 && position.width <= 100 &&
    position.height > 0 && position.height <= 100
  );
}

// Constrain position to bounds
export function constrainPosition(position: WidgetPosition): WidgetPosition {
  return {
    x: Math.max(0, Math.min(100 - position.width, position.x)),
    y: Math.max(0, Math.min(100 - position.height, position.y)),
    width: Math.max(5, Math.min(100, position.width)),
    height: Math.max(5, Math.min(100, position.height)),
  };
}

// Convert percentage position to pixels
export function positionToPixels(
  position: WidgetPosition,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: (position.x / 100) * containerWidth,
    y: (position.y / 100) * containerHeight,
    width: (position.width / 100) * containerWidth,
    height: (position.height / 100) * containerHeight,
  };
}

// Convert pixel position to percentage
export function pixelsToPosition(
  pixels: { x: number; y: number; width: number; height: number },
  containerWidth: number,
  containerHeight: number
): WidgetPosition {
  return {
    x: (pixels.x / containerWidth) * 100,
    y: (pixels.y / containerHeight) * 100,
    width: (pixels.width / containerWidth) * 100,
    height: (pixels.height / containerHeight) * 100,
  };
}
