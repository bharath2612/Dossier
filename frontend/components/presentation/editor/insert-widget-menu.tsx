'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Square,
  StickyNote,
  GitGraph,
  ArrowRight,
  Minus,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WidgetType } from '@/types/presentation';

interface InsertWidgetMenuProps {
  visible: boolean;
  onClose: () => void;
  onInsertWidget: (type: WidgetType, options?: any) => void;
}

interface WidgetOption {
  type: WidgetType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: 'text' | 'media' | 'content' | 'visual';
  options?: any;
}

const WIDGET_OPTIONS: WidgetOption[] = [
  // Text Elements
  {
    type: 'text',
    label: 'Paragraph',
    icon: Type,
    description: 'Plain text block',
    category: 'text',
  },
  {
    type: 'heading',
    label: 'Heading H1',
    icon: Heading1,
    description: 'Large heading',
    category: 'text',
    options: { level: 'h1' },
  },
  {
    type: 'heading',
    label: 'Heading H2',
    icon: Heading2,
    description: 'Medium heading',
    category: 'text',
    options: { level: 'h2' },
  },
  {
    type: 'heading',
    label: 'Heading H3',
    icon: Heading3,
    description: 'Small heading',
    category: 'text',
    options: { level: 'h3' },
  },
  // Media
  {
    type: 'image',
    label: 'Image',
    icon: ImageIcon,
    description: 'Upload and position an image',
    category: 'media',
  },
  // Content Blocks
  {
    type: 'card',
    label: 'Card',
    icon: Square,
    description: 'Styled content container',
    category: 'content',
  },
  {
    type: 'sticky-note',
    label: 'Sticky Note',
    icon: StickyNote,
    description: 'Colorful note widget',
    category: 'content',
  },
  // Visual Elements
  {
    type: 'diagram',
    label: 'Diagram',
    icon: GitGraph,
    description: 'Flowchart, Venn, or Timeline',
    category: 'visual',
  },
  {
    type: 'arrow',
    label: 'Arrow',
    icon: ArrowRight,
    description: 'Directional arrow',
    category: 'visual',
  },
  {
    type: 'line',
    label: 'Line',
    icon: Minus,
    description: 'Horizontal or vertical line',
    category: 'visual',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  text: 'Text Elements',
  media: 'Media',
  content: 'Content Blocks',
  visual: 'Visual Elements',
};

export function InsertWidgetMenu({
  visible,
  onClose,
  onInsertWidget,
}: InsertWidgetMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter widgets based on search
  const filteredWidgets = WIDGET_OPTIONS.filter((widget) =>
    widget.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    widget.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered widgets by category
  const groupedWidgets = filteredWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetOption[]>);

  const categories = Object.keys(groupedWidgets) as Array<'text' | 'media' | 'content' | 'visual'>;

  // Focus search input when menu opens
  useEffect(() => {
    if (visible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [visible]);

  // Reset state when menu opens/closes
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [visible]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredWidgets.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const widget = filteredWidgets[selectedIndex];
        if (widget) {
          onInsertWidget(widget.type, widget.options);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, filteredWidgets, selectedIndex, onInsertWidget, onClose]);

  if (!visible) return null;

  let currentIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="fixed left-1/2 top-1/2 z-50 w-[480px] max-h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search */}
        <div className="border-b border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Insert Widget</h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search widgets..."
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        {/* Widget List */}
        <div className="max-h-[450px] overflow-y-auto p-2">
          {filteredWidgets.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No widgets found
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => {
                const widgets = groupedWidgets[category];
                return (
                  <div key={category}>
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABELS[category]}
                    </div>
                    <div className="space-y-1">
                      {widgets.map((widget) => {
                        const index = currentIndex++;
                        const Icon = widget.icon;
                        const isSelected = index === selectedIndex;

                        return (
                          <button
                            key={`${widget.type}-${widget.label}`}
                            onClick={() => {
                              onInsertWidget(widget.type, widget.options);
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full flex items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                              isSelected
                                ? 'bg-brand text-brand-foreground'
                                : 'hover:bg-secondary text-foreground'
                            }`}
                          >
                            <div className={`mt-0.5 rounded p-1.5 ${
                              isSelected ? 'bg-brand-foreground/20' : 'bg-secondary'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{widget.label}</div>
                              <div className={`text-xs ${
                                isSelected ? 'text-brand-foreground/80' : 'text-muted-foreground'
                              }`}>
                                {widget.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Hint */}
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border">
              ↑↓
            </kbd>{' '}
            Navigate •{' '}
            <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border">
              Enter
            </kbd>{' '}
            Select •{' '}
            <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border">
              Esc
            </kbd>{' '}
            Close
          </p>
        </div>
      </div>
    </>
  );
}
