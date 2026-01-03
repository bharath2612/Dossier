/**
 * Calculate relative luminance of a color
 * Based on WCAG guidelines: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse any CSS color format and extract RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }

  // Handle named colors by creating a temporary element
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);
    const computed = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);

    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }
  }

  return null;
}

/**
 * Determine if a background color is light or dark
 * Returns true if the background is light (needs dark text)
 */
export function isLightBackground(backgroundColor: string): boolean {
  const rgb = parseColor(backgroundColor);
  if (!rgb) {
    // Default to light background if parsing fails
    return true;
  }

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  // Threshold of 0.5 (adjust as needed for preference)
  return luminance > 0.5;
}

/**
 * Get appropriate text color for a given background
 * Returns black for light backgrounds, white for dark backgrounds
 */
export function getContrastTextColor(backgroundColor?: string): string {
  if (!backgroundColor) {
    return '#000000'; // Default to black if no background
  }

  return isLightBackground(backgroundColor) ? '#000000' : '#FFFFFF';
}

/**
 * Get appropriate muted text color for a given background
 * Returns dark gray for light backgrounds, light gray for dark backgrounds
 */
export function getContrastMutedTextColor(backgroundColor?: string): string {
  if (!backgroundColor) {
    return '#6B7280'; // Default gray-500
  }

  return isLightBackground(backgroundColor) ? '#6B7280' : '#9CA3AF';
}
