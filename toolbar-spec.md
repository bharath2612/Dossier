# Interactive Presentation Editor - Feature Specification

## Overview
A fully-featured interactive presentation editor similar to Google Slides/PowerPoint, enabling direct inline editing with rich text formatting, slide management, and auto-save functionality.

## Core Features

### 1. Direct Slide Editing
- **Inline Editing**: Users can click directly on slide content (title, body text) to edit without edit buttons
- **Visual Feedback**: Hover states show editable areas with ring highlights
- **Auto-save**: Changes automatically save after 2.5 seconds of inactivity
- **Real-time Updates**: Immediate visual updates as users type

### 2. Floating Formatting Toolbar
Appears contextually above selected text with the following options:

#### Font Size Selector
- Dropdown with options: Small, Medium, Large, Extra Large
- Maps to pixel sizes: 14px, 18px, 24px, 32px

#### Text Style Options
- **Heading**: For main titles (larger, bold)
- **Subtitle**: For secondary headings
- **Body**: Standard text
- **Quote**: Italicized, often centered

#### Text Formatting Buttons
- **Bold** (Ctrl/Cmd+B): Toggle bold formatting
- **Italic** (Ctrl/Cmd+I): Toggle italic formatting
- **Underline** (Ctrl/Cmd+U): Toggle underline formatting

#### Text Color Picker
- 15 preset colors
- Custom color input (hex)
- Live preview of selected color

#### Alignment Options
- **Left Align**: Text aligned to the left
- **Center Align**: Text centered
- **Right Align**: Text aligned to the right

#### Image Upload
- Upload button integrated in toolbar
- Opens image upload panel
- Supports positioning (left, right, top, bottom, background)

### 3. Slide Management

#### Add New Slide
- Button in header toolbar
- Creates slide after current slide
- Maximum 20 slides
- Pre-filled with "New Slide" title and placeholder content

#### Delete Slide
- Delete button in header
- Confirmation dialog before deletion
- Cannot delete last remaining slide
- Automatically cleans up associated images from storage

#### Duplicate Slide
- Duplicate button (Ctrl/Cmd+D shortcut)
- Creates exact copy with all formatting
- Inserts immediately after current slide

#### Slide Thumbnail Panel
- **Location**: Left sidebar (200px wide)
- **Features**:
  - Scrollable list of all slides
  - Active slide highlighted with brand color ring
  - Click to navigate to slide
  - Drag-to-reorder using dnd-kit
  - Shows slide number and title overlay
  - Responsive: Hidden on mobile, visible on desktop

#### Navigation
- Arrow keys: Left/Right to navigate between slides
- Thumbnail clicks: Direct navigation
- Keyboard shortcuts documented in UI

### 4. Auto-Save Functionality
- **Debounce**: 2.5 seconds after last change
- **Visual Indicator**: Shows "Saving..." / "Saved" status in footer
- **Optimistic Updates**: UI updates immediately, saves in background
- **Error Handling**: Displays error messages if save fails

### 5. Slide Features

#### Customizable Background Colors
- Per-slide background color selection
- Color picker with presets and custom input
- Override theme default on per-slide basis
- Live preview during selection

#### Title and Content Areas
- **Title**: Rich text editor for slide title
- **Body**: Array of rich text bullets, each independently formatted
- Support for multiple content blocks per slide

#### Image Support
- Upload images via toolbar or dedicated button
- Responsive scaling within slide bounds
- Position options: left, right, top, bottom, background
- Image captions supported
- Automatic cleanup on slide deletion

### 6. User Experience

#### Clean, Minimal Interface
- Three-column layout: Thumbnails | Canvas | (optional right panel)
- Fixed header with presentation title and actions
- Fixed footer with save status and navigation info
- Grid view option for overview of all slides

#### Visual Feedback
- Selection highlights with subtle background color
- Hover states on all interactive elements
- Loading states during save operations
- Smooth transitions and animations

#### Responsive Design
- **Desktop**: Full three-column layout with thumbnails
- **Tablet**: Smaller thumbnails, optimized canvas
- **Mobile**: Thumbnails hidden, full-width canvas
- Touch-friendly controls for mobile devices

#### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatible
- Focus management for modal dialogs

## Technical Implementation

### Data Model
- **Rich Text Format**: Stores text as array of segments with formatting properties
- **Backward Compatible**: Migrates legacy string-based slides automatically
- **Type Safety**: Full TypeScript support with strict types

### Key Components
1. `RichTextEditor`: ContentEditable-based editor with formatting support
2. `FloatingToolbar`: Contextual formatting toolbar
3. `SlideCanvas`: Main slide editing canvas
4. `SlideThumbnails`: Left-side navigation panel
5. `BackgroundPicker`: Per-slide background color selector

### Keyboard Shortcuts
- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + U`: Underline
- `Ctrl/Cmd + D`: Duplicate slide
- `←/→`: Navigate between slides
- `Delete/Backspace`: Delete slide (with confirmation)
- `Escape`: Close modals/toolbars

## State Management
- React state for local editing
- Zustand store for presentation state (optional)
- Auto-save debouncing with 2.5s delay
- Optimistic UI updates

## Browser Compatibility
- Modern browsers with contentEditable support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations
- Virtualized thumbnails for large presentations
- Debounced save operations
- Lazy loading of slide content in grid view
- Optimized re-renders with React memoization

