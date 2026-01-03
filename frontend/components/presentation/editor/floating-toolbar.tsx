'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/presentation/image-upload';
import type {
  TextSegment,
  FontSize,
  TextStyle,
  TextAlignment,
  TextLevel,
  SlideImage,
} from '@/types/presentation';

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  currentFormat: Partial<Omit<TextSegment, 'text'>>;
  onFormatChange: (format: Partial<Omit<TextSegment, 'text'>>) => void;
  presentationId: string;
  slideIndex: number;
  currentImage?: SlideImage;
  onImageChange?: (image: SlideImage | undefined) => void;
}

// DEPRECATED - kept for reference only
const FONT_SIZES: Array<{ value: FontSize; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
];

// DEPRECATED - kept for reference only
const TEXT_STYLES: Array<{ value: TextStyle; label: string }> = [
  { value: 'heading', label: 'Heading' },
  { value: 'subtitle', label: 'Subtitle' },
  { value: 'body', label: 'Body' },
  { value: 'quote', label: 'Quote' },
];

// NEW: Unified text level system (Notion-style)
const TEXT_LEVELS: Array<{ value: TextLevel; label: string; size: string }> = [
  { value: 'text', label: 'Text', size: '16px' },
  { value: 'h3', label: 'Heading 3', size: '28px' },
  { value: 'h2', label: 'Heading 2', size: '36px' },
  { value: 'h1', label: 'Heading 1', size: '48px' },
];

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#800000',
  '#008000', '#000080', '#808000', '#800080', '#008080',
];

export function FloatingToolbar({
  visible,
  position,
  currentFormat,
  onFormatChange,
  presentationId,
  slideIndex,
  currentImage,
  onImageChange,
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarWidth, setToolbarWidth] = useState(568); // Estimated default width
  const [toolbarHeight, setToolbarHeight] = useState(42); // Estimated default height
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState(currentFormat.color || '#000000');
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false);
  const [customBackgroundColor, setCustomBackgroundColor] = useState(currentFormat.backgroundColor || '#FFFF00');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState(currentFormat.link || '');

  // Measure toolbar dimensions after first render
  useEffect(() => {
    if (!visible || !toolbarRef.current) return;

    const toolbar = toolbarRef.current;
    const rect = toolbar.getBoundingClientRect();
    setToolbarWidth(rect.width);
    setToolbarHeight(rect.height);
  }, [visible]);

  // Calculate adjusted position before render to prevent off-screen flash
  const adjustedPosition = useMemo(() => {
    if (!visible) return { left: 0, top: 0, transform: 'translateX(-50%)' };

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const padding = 10;
    const verticalOffset = 45; // Distance above selection

    // Handle case where toolbar is wider than viewport
    if (toolbarWidth > viewportWidth - (padding * 2)) {
      // Toolbar is too wide - just align to left edge
      const left = padding;
      const transform = 'translateX(0)';
      
      // Vertical positioning
      let top = position.y - verticalOffset;
      if (top + toolbarHeight > viewportHeight - padding) {
        top = position.y + padding;
      }
      if (top + toolbarHeight > viewportHeight - padding) {
        top = viewportHeight - padding - toolbarHeight;
      }
      if (top < padding) {
        top = padding;
      }
      
      return { left, top, transform };
    }

    // Calculate expected bounds with transform translateX(-50%)
    const expectedLeftEdge = position.x - (toolbarWidth / 2);
    const expectedRightEdge = position.x + (toolbarWidth / 2);

    // Horizontal constraint logic
    let left = position.x;
    let transform = 'translateX(-50%)';

    if (expectedLeftEdge < padding) {
      // Toolbar would go off left edge - align left edge to padding
      left = padding + (toolbarWidth / 2);
      transform = 'translateX(-50%)';
    } else if (expectedRightEdge > viewportWidth - padding) {
      // Toolbar would go off right edge - align right edge to viewportWidth - padding
      left = viewportWidth - padding - (toolbarWidth / 2);
      transform = 'translateX(-50%)';
    }

    // Vertical constraint logic
    let top = position.y - verticalOffset;

    // Check if toolbar would go below viewport if shown above
    if (top + toolbarHeight > viewportHeight - padding) {
      // Not enough room above, flip to show below
      top = position.y + padding;
      // Ensure it doesn't go below viewport
      if (top + toolbarHeight > viewportHeight - padding) {
        top = viewportHeight - padding - toolbarHeight;
      }
    }

    // Ensure toolbar doesn't go above viewport
    if (top < padding) {
      top = padding;
    }

    return { left, top, transform };
  }, [visible, position.x, position.y, toolbarWidth, toolbarHeight]);

  // Handle format toggle
  const toggleFormat = (key: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    onFormatChange({
      [key]: !currentFormat[key],
    });
  };

  // Handle link
  const handleLinkSubmit = () => {
    onFormatChange({
      link: linkUrl || undefined,
    });
    setShowLinkDialog(false);
  };

  const handleRemoveLink = () => {
    setLinkUrl('');
    onFormatChange({
      link: undefined,
    });
    setShowLinkDialog(false);
  };

  // Handle font size change (DEPRECATED - for backward compatibility)
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFormatChange({
      fontSize: e.target.value as FontSize,
    });
  };

  // Handle text style change (DEPRECATED - for backward compatibility)
  const handleTextStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFormatChange({
      textStyle: e.target.value as TextStyle,
    });
  };

  // NEW: Handle text level change (Notion-style unified sizing)
  const handleTextLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFormatChange({
      textLevel: e.target.value as TextLevel,
    });
  };

  // Handle alignment change
  const handleAlignmentChange = (alignment: TextAlignment) => {
    onFormatChange({
      alignment,
    });
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setCustomColor(color);
    onFormatChange({
      color,
    });
    setShowColorPicker(false);
  };

  // Handle background color change
  const handleBackgroundColorChange = (backgroundColor: string) => {
    setCustomBackgroundColor(backgroundColor);
    onFormatChange({
      backgroundColor,
    });
    setShowBackgroundColorPicker(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        ref={toolbarRef}
        className="fixed z-50 flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          left: `${adjustedPosition.left}px`,
          top: `${adjustedPosition.top}px`,
          transform: adjustedPosition.transform,
        }}
        onClick={(e) => e.stopPropagation()}
        role="toolbar"
        aria-label="Text formatting toolbar"
      >
        {/* Text Level (Notion-style unified sizing) */}
        <select
          value={currentFormat.textLevel || 'text'}
          onChange={handleTextLevelChange}
          className="h-8 rounded border border-border bg-background px-2 text-xs outline-none hover:bg-secondary focus:ring-2 focus:ring-brand"
          onClick={(e) => e.stopPropagation()}
        >
          {TEXT_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label} ({level.size})
            </option>
          ))}
        </select>

        <div className="h-6 w-px bg-border" />

        {/* Formatting Buttons */}
        <Button
          variant={currentFormat.bold ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => toggleFormat('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormat.italic ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => toggleFormat('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormat.underline ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => toggleFormat('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormat.strikethrough ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => toggleFormat('strikethrough')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Link Button */}
        <Button
          variant={currentFormat.link ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => {
            setLinkUrl(currentFormat.link || '');
            setShowLinkDialog(!showLinkDialog);
          }}
          title="Link (Ctrl+K)"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Text Color */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
            style={{
              position: 'relative',
            }}
          >
            <div
              className="h-4 w-4 rounded border border-border"
              style={{
                backgroundColor: currentFormat.color || '#000000',
              }}
            />
          </Button>
          {showColorPicker && (
            <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-2 shadow-lg">
              <div className="mb-2 grid grid-cols-5 gap-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-8 w-full cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  onBlur={(e) => handleColorChange(e.target.value)}
                  className="h-8 w-20 rounded border border-border bg-background px-2 text-xs outline-none"
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </div>

        {/* Background Color (Highlight) */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowBackgroundColorPicker(!showBackgroundColorPicker)}
            title="Text Highlight"
            style={{
              position: 'relative',
            }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div
                className="h-3 w-4 rounded border border-border"
                style={{
                  backgroundColor: currentFormat.backgroundColor || 'transparent',
                }}
              />
              <div className="h-0.5 w-4 bg-current" />
            </div>
          </Button>
          {showBackgroundColorPicker && (
            <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-2 shadow-lg">
              <div className="mb-2 grid grid-cols-5 gap-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleBackgroundColorChange(color)}
                    title={color}
                  />
                ))}
                {/* Add transparent option */}
                <button
                  className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform bg-transparent"
                  style={{
                    background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px'
                  }}
                  onClick={() => handleBackgroundColorChange('')}
                  title="No highlight"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customBackgroundColor}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  className="h-8 w-full cursor-pointer"
                />
                <input
                  type="text"
                  value={customBackgroundColor}
                  onChange={(e) => setCustomBackgroundColor(e.target.value)}
                  onBlur={(e) => handleBackgroundColorChange(e.target.value)}
                  className="h-8 w-20 rounded border border-border bg-background px-2 text-xs outline-none"
                  placeholder="#FFFF00"
                />
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Alignment */}
        <Button
          variant={currentFormat.alignment === 'left' ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => handleAlignmentChange('left')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormat.alignment === 'center' ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => handleAlignmentChange('center')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={currentFormat.alignment === 'right' ? 'secondary' : 'ghost'}
          size="icon-sm"
          onClick={() => handleAlignmentChange('right')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        {onImageChange && (
          <>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
              title="Add Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Image Upload Panel */}
      {showImageUpload && onImageChange && (
        <div
          className="fixed z-50 w-64 rounded-lg border border-border bg-card p-4 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: `${position.x}px`,
            top: `${position.y + 10}px`,
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Slide Image</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowImageUpload(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ImageUpload
            presentationId={presentationId}
            slideIndex={slideIndex}
            currentImage={currentImage}
            onImageChange={(image) => {
              onImageChange(image);
              setShowImageUpload(false);
            }}
          />
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div
          className="fixed z-50 w-64 rounded-lg border border-border bg-card p-4 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: `${position.x}px`,
            top: `${position.y + 10}px`,
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Add Link</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowLinkDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLinkSubmit();
                } else if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                }
              }}
              placeholder="https://example.com"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="brand"
                size="sm"
                onClick={handleLinkSubmit}
                className="flex-1"
              >
                Add Link
              </Button>
              {currentFormat.link && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveLink}
                  className="flex-1"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close color picker */}
      {showColorPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowColorPicker(false)}
        />
      )}

      {/* Click outside to close background color picker */}
      {showBackgroundColorPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowBackgroundColorPicker(false)}
        />
      )}

      {/* Click outside to close link dialog */}
      {showLinkDialog && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLinkDialog(false)}
        />
      )}
    </>
  );
}

