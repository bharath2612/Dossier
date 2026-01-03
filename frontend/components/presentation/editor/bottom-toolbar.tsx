'use client';

import { useState } from 'react';
import { Plus, Palette, Paintbrush, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Theme } from '@/types/presentation';

interface BottomToolbarProps {
  onInsertWidget: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  currentBackgroundColor?: string;
  onBackgroundColorChange: (color?: string) => void;
  defaultBackgroundColor: string;
}

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'bold', label: 'Bold' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
];

const BACKGROUND_COLORS = [
  '#FFFFFF', // White
  '#F3F4F6', // Light gray
  '#DBEAFE', // Light blue
  '#FEF3C7', // Light yellow
  '#D1FAE5', // Light green
  '#FCE7F3', // Light pink
  '#E0E7FF', // Light indigo
  '#000000', // Black
  '#1F2937', // Dark gray
];

export function BottomToolbar({
  onInsertWidget,
  currentTheme,
  onThemeChange,
  currentBackgroundColor,
  onBackgroundColorChange,
  defaultBackgroundColor,
}: BottomToolbarProps) {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [customColor, setCustomColor] = useState(currentBackgroundColor || defaultBackgroundColor);

  const handleBackgroundColorChange = (color: string) => {
    setCustomColor(color);
    onBackgroundColorChange(color);
    setShowBackgroundPicker(false);
  };

  const handleResetBackground = () => {
    onBackgroundColorChange(undefined);
    setCustomColor(defaultBackgroundColor);
    setShowBackgroundPicker(false);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-3">
          {/* Insert Widget Button - Primary Action */}
          <Button
            variant="brand"
            size="default"
            onClick={onInsertWidget}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Insert Widget
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Theme Selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                setShowThemeSelector(!showThemeSelector);
                setShowBackgroundPicker(false);
                setShowMoreMenu(false);
              }}
              className="gap-2"
            >
              <Palette className="h-4 w-4" />
              <span className="text-sm capitalize">{currentTheme}</span>
            </Button>
            {showThemeSelector && (
              <div className="absolute bottom-full left-0 mb-2 min-w-[160px] rounded-lg border border-border bg-card p-2 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="space-y-1">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => {
                        onThemeChange(theme.value);
                        setShowThemeSelector(false);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                        currentTheme === theme.value
                          ? 'bg-brand text-brand-foreground'
                          : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Background Color Picker */}
          <div className="relative">
            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                setShowBackgroundPicker(!showBackgroundPicker);
                setShowThemeSelector(false);
                setShowMoreMenu(false);
              }}
              className="gap-2"
            >
              <Paintbrush className="h-4 w-4" />
              <div
                className="h-4 w-4 rounded border border-border"
                style={{
                  backgroundColor: currentBackgroundColor || defaultBackgroundColor,
                }}
              />
            </Button>
            {showBackgroundPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Slide Background
                </div>
                <div className="mb-3 grid grid-cols-5 gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      className="h-8 w-8 rounded border-2 border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleBackgroundColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      onBlur={(e) => handleBackgroundColorChange(e.target.value)}
                      className="h-8 w-full cursor-pointer rounded border border-border"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      onBlur={(e) => handleBackgroundColorChange(e.target.value)}
                      className="h-8 w-24 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-brand"
                      placeholder="#FFFFFF"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetBackground}
                    className="w-full text-xs"
                  >
                    Reset to Theme Default
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* More Options Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowThemeSelector(false);
                setShowBackgroundPicker(false);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 min-w-[200px] rounded-lg border border-border bg-card p-2 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      // TODO: Add keyboard shortcuts help
                      setShowMoreMenu(false);
                    }}
                    className="w-full rounded px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    Keyboard Shortcuts
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Add grid toggle
                      setShowMoreMenu(false);
                    }}
                    className="w-full rounded px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    Show Grid
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Add snap to grid toggle
                      setShowMoreMenu(false);
                    }}
                    className="w-full rounded px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    Snap to Grid
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showThemeSelector || showBackgroundPicker || showMoreMenu) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowThemeSelector(false);
            setShowBackgroundPicker(false);
            setShowMoreMenu(false);
          }}
        />
      )}
    </>
  );
}
