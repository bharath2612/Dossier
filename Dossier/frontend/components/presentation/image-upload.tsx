'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import {
  replaceSlideImage,
  isValidImageType,
  getFileSizeInMB,
  MAX_FILE_SIZE_MB,
} from '@/lib/supabase/storage';
import type { ImagePosition, SlideImage } from '@/types/presentation';

interface ImageUploadProps {
  presentationId: string;
  slideIndex: number;
  currentImage?: SlideImage;
  onImageChange: (image: SlideImage | undefined) => void;
}

const positionOptions: Array<{ value: ImagePosition; label: string }> = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'background', label: 'Background' },
];

// Check if error is a configuration error (bucket/policy issue)
function isConfigurationError(errorMessage: string): boolean {
  return (
    errorMessage.includes('bucket') ||
    errorMessage.includes('Bucket') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('policy') ||
    errorMessage.includes('Supabase')
  );
}

export function ImageUpload({
  presentationId,
  slideIndex,
  currentImage,
  onImageChange,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!isValidImageType(file)) {
        setError('Please upload a valid image (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size
      if (getFileSizeInMB(file) > MAX_FILE_SIZE_MB) {
        setError(`Image must be smaller than ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setIsUploading(true);

      try {
        const result = await replaceSlideImage(
          file,
          currentImage?.storagePath,
          presentationId,
          slideIndex
        );

        onImageChange({
          url: result.url,
          storagePath: result.storagePath,
          position: currentImage?.position || 'right',
          caption: currentImage?.caption,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    },
    [presentationId, slideIndex, currentImage, onImageChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleRemoveImage = useCallback(() => {
    onImageChange(undefined);
  }, [onImageChange]);

  const handlePositionChange = useCallback(
    (position: ImagePosition) => {
      if (currentImage) {
        onImageChange({ ...currentImage, position });
      }
    },
    [currentImage, onImageChange]
  );

  const handleCaptionChange = useCallback(
    (caption: string) => {
      if (currentImage) {
        onImageChange({ ...currentImage, caption: caption || undefined });
      }
    },
    [currentImage, onImageChange]
  );

  // If we have an image, show the preview and controls
  if (currentImage?.url) {
    return (
      <div className="space-y-3">
        {/* Image Preview */}
        <div className="relative overflow-hidden rounded-md border border-border">
          <img
            src={currentImage.url}
            alt={currentImage.caption || 'Slide image'}
            className="h-32 w-full object-cover"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Position Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Position:</span>
          <select
            value={currentImage.position}
            onChange={(e) => handlePositionChange(e.target.value as ImagePosition)}
            className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground outline-none transition-colors hover:border-brand/50 focus:border-brand"
          >
            {positionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Caption Input */}
        <input
          type="text"
          value={currentImage.caption || ''}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="Add caption (optional)"
          className="w-full rounded border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors hover:border-brand/50 focus:border-brand"
        />

        {/* Replace Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              <span>Replace Image</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Empty state - show upload zone
  return (
    <div className="space-y-2">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-6 transition-colors ${
          isDragging
            ? 'border-brand bg-brand/5'
            : 'border-border hover:border-brand/50'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        {isUploading ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-brand" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Drop image here or click to upload
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, GIF, WebP (max {MAX_FILE_SIZE_MB}MB)
            </span>
          </>
        )}
      </div>

      {error && (
        <div className={`rounded-md p-3 text-xs ${isConfigurationError(error) ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-destructive/10'}`}>
          {isConfigurationError(error) && (
            <div className="flex items-center gap-2 mb-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-medium">Setup Required</span>
            </div>
          )}
          <p className={isConfigurationError(error) ? 'text-amber-700 dark:text-amber-300' : 'text-destructive'}>
            {error}
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
