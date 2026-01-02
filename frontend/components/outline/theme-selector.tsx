'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { themes, getTheme } from '@/lib/themes';
import type { Theme } from '@/types/presentation';

interface ThemeSelectorProps {
  value: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTheme = getTheme(value);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-left transition-all hover:border-brand/50"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded border border-border"
            style={{
              background: selectedTheme.colors.background,
            }}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{selectedTheme.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{selectedTheme.description}</p>
          </div>
        </div>
        <ChevronDown
          className={`ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-80 overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg">
            {Object.values(themes).map((theme) => {
              const isSelected = theme.id === value;

              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onChange(theme.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-start space-x-3 px-4 py-3 transition-colors hover:bg-secondary ${
                    isSelected ? 'bg-secondary' : ''
                  }`}
                >
                  {/* Theme Preview */}
                  <div className="relative mt-1 flex-shrink-0">
                    <div
                      className="h-12 w-16 rounded border border-border"
                      style={{
                        background: theme.colors.background,
                      }}
                    >
                      {/* Mini preview content */}
                      <div className="flex h-full flex-col justify-center p-1.5">
                        <div
                          className="mb-1 h-1.5 w-8 rounded"
                          style={{ backgroundColor: theme.colors.text }}
                        />
                        <div
                          className="h-0.5 w-6 rounded"
                          style={{ backgroundColor: theme.colors.textSecondary }}
                        />
                        <div
                          className="mt-1 h-0.5 w-5 rounded"
                          style={{ backgroundColor: theme.colors.textSecondary }}
                        />
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{theme.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
