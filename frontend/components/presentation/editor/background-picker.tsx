'use client';

import { useState } from 'react';
import { Paintbrush, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackgroundPickerProps {
  currentColor?: string;
  onColorChange: (color: string | undefined) => void;
  defaultColor?: string;
}

const COLOR_PRESETS = [
  { value: undefined, label: 'Default', color: 'transparent' },
  '#FFFFFF', '#F5F5F5', '#E0E0E0',
  '#000000', '#1A1A1A', '#2D2D2D',
  '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899',
  '#F97316', '#14B8A6', '#6366F1',
];

export function BackgroundPicker({
  currentColor,
  onColorChange,
  defaultColor = '#FFFFFF',
}: BackgroundPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor || defaultColor);

  const handleColorSelect = (color: string | undefined) => {
    onColorChange(color);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPicker(!showPicker)}
        className="gap-2"
        title="Background Color"
      >
        <Paintbrush className="h-4 w-4" />
        {currentColor ? (
          <div
            className="h-4 w-8 rounded border border-border"
            style={{ backgroundColor: currentColor }}
          />
        ) : (
          <span className="text-xs text-muted-foreground">Default</span>
        )}
      </Button>

      {showPicker && (
        <>
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-card p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Background Color</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPicker(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preset Colors */}
            <div className="mb-3 grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map((preset, idx) => {
                const isDefault = typeof preset === 'object' && preset.value === undefined;
                const color = typeof preset === 'string' ? preset : preset.color;
                const value = typeof preset === 'object' ? preset.value : preset;

                return (
                  <button
                    key={idx}
                    className={`relative h-8 w-8 rounded border-2 transition-all hover:scale-110 ${
                      currentColor === value
                        ? 'border-brand ring-2 ring-brand/20'
                        : 'border-border'
                    } ${isDefault ? 'bg-checkerboard' : ''}`}
                    style={
                      isDefault
                        ? {
                            backgroundImage: `
                              linear-gradient(45deg, #ccc 25%, transparent 25%),
                              linear-gradient(-45deg, #ccc 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #ccc 75%),
                              linear-gradient(-45deg, transparent 75%, #ccc 75%)
                            `,
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                          }
                        : { backgroundColor: color }
                    }
                    onClick={() => handleColorSelect(value)}
                    title={isDefault ? 'Default' : color}
                  />
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor.startsWith('#') ? customColor : `#${customColor}`}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setCustomColor(newColor);
                  handleColorSelect(newColor);
                }}
                className="h-8 w-full cursor-pointer rounded border border-border"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onBlur={(e) => {
                  const color = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                  setCustomColor(color);
                  handleColorSelect(color);
                }}
                className="h-8 w-24 rounded border border-border bg-background px-2 text-xs outline-none"
                placeholder="#FFFFFF"
              />
            </div>

            {/* Reset Button */}
            {currentColor && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => handleColorSelect(undefined)}
              >
                Reset to Default
              </Button>
            )}
          </div>

          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
        </>
      )}
    </div>
  );
}


