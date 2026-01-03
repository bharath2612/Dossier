'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/presentation/image-upload';
import { Image as ImageIcon } from 'lucide-react';
import type { ImageWidget } from '@/types/presentation';
import type { ThemeConfig } from '@/lib/themes';

interface ImageWidgetProps {
  widget: ImageWidget;
  onUpdate: (data: ImageWidget['data']) => void;
  theme: ThemeConfig;
  isEditing: boolean;
  presentationId: string;
  slideIndex: number;
}

export function ImageWidgetComponent({
  widget,
  onUpdate,
  theme,
  isEditing,
  presentationId,
  slideIndex,
}: ImageWidgetProps) {
  const [showUpload, setShowUpload] = useState(false);

  if (!widget.data.url) {
    return (
      <div className="relative h-full w-full">
        {isEditing ? (
          <div
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50"
            onClick={() => setShowUpload(true)}
          >
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload image</p>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">No image</p>
          </div>
        )}

        {showUpload && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowUpload(false)}
          >
            <div
              className="w-96 rounded-lg border border-border bg-card p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-lg font-semibold text-foreground">Upload Image</h3>
              <ImageUpload
                presentationId={presentationId}
                slideIndex={slideIndex}
                currentImage={widget.data}
                onImageChange={(image) => {
                  if (image) {
                    onUpdate({ ...image, position: 'none' });
                  }
                  setShowUpload(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group relative h-full w-full overflow-hidden rounded-lg">
      <img
        src={widget.data.url}
        alt={widget.data.caption || 'Image'}
        className="h-full w-full object-cover"
      />
      {widget.data.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur-sm">
          {widget.data.caption}
        </div>
      )}
      {isEditing && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => setShowUpload(true)}
        >
          <p className="text-sm font-medium text-foreground">Click to change image</p>
        </div>
      )}

      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="w-96 rounded-lg border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-foreground">Upload Image</h3>
            <ImageUpload
              presentationId={presentationId}
              slideIndex={slideIndex}
              currentImage={widget.data}
              onImageChange={(image) => {
                if (image) {
                  onUpdate({ ...image, position: 'none' });
                }
                setShowUpload(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
