'use client';

import { useState, useRef, useEffect, CSSProperties } from 'react';
import { getTheme } from '@/lib/themes';
import { ImageUpload } from './image-upload';
import { Image as ImageIcon, X, Plus } from 'lucide-react';
import type { Slide, CitationStyle, Theme, SlideImage, ImagePosition } from '@/types/presentation';

interface EditableSlideViewerProps {
  slide: Slide;
  citationStyle: CitationStyle;
  theme: Theme;
  presentationId: string;
  onUpdate: (updates: Partial<Slide>) => void;
}

export function EditableSlideViewer({
  slide,
  citationStyle,
  theme,
  presentationId,
  onUpdate,
}: EditableSlideViewerProps) {
  const themeConfig = getTheme(theme);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingBodyIndex, setEditingBodyIndex] = useState<number | null>(null);
  const [localTitle, setLocalTitle] = useState(slide.title);
  const [localBody, setLocalBody] = useState<string[]>(slide.body);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Sync local state with slide props
  useEffect(() => {
    setLocalTitle(slide.title);
    setLocalBody(slide.body);
  }, [slide.title, slide.body]);

  // Focus inputs when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingBodyIndex !== null && bodyInputRefs.current[editingBodyIndex]) {
      bodyInputRefs.current[editingBodyIndex]?.focus();
    }
  }, [editingBodyIndex]);

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (localTitle !== slide.title) {
      onUpdate({ title: localTitle });
    }
  };

  const handleBodyBlur = (index: number) => {
    setEditingBodyIndex(null);
    if (localBody[index] !== slide.body[index]) {
      onUpdate({ body: localBody });
    }
  };

  const handleBodyChange = (index: number, value: string) => {
    const newBody = [...localBody];
    newBody[index] = value;
    setLocalBody(newBody);
  };

  const handleBodyKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Add new bullet after current one
      const newBody = [...localBody];
      newBody.splice(index + 1, 0, '');
      setLocalBody(newBody);
      onUpdate({ body: newBody });
      // Focus the new bullet after render
      setTimeout(() => {
        setEditingBodyIndex(index + 1);
      }, 0);
    } else if (e.key === 'Backspace' && localBody[index] === '' && localBody.length > 1) {
      e.preventDefault();
      // Remove empty bullet
      const newBody = localBody.filter((_, i) => i !== index);
      setLocalBody(newBody);
      onUpdate({ body: newBody });
      // Focus previous bullet
      if (index > 0) {
        setTimeout(() => {
          setEditingBodyIndex(index - 1);
        }, 0);
      }
    }
  };

  const handleImageChange = (image: SlideImage | undefined) => {
    onUpdate({ image });
    if (!image) {
      setShowImageUpload(false);
    }
  };

  // Common styles
  const containerStyle: CSSProperties = {
    background: themeConfig.colors.background,
    color: themeConfig.colors.text,
    fontFamily: themeConfig.typography.fontFamily,
    width: '100%',
    maxWidth: '1200px',
    minHeight: '500px',
    position: 'relative',
  };

  const titleStyle: CSSProperties = {
    fontSize: `${themeConfig.typography.titleSize}px`,
    fontWeight: themeConfig.typography.titleWeight,
    lineHeight: 1.2,
    color: themeConfig.colors.text,
    margin: 0,
  };

  const bodyStyle: CSSProperties = {
    fontSize: `${themeConfig.typography.bodySize}px`,
    fontWeight: themeConfig.typography.bodyWeight,
    lineHeight: 1.6,
    color: themeConfig.colors.text,
  };

  const secondaryTextStyle: CSSProperties = {
    ...bodyStyle,
    color: themeConfig.colors.textSecondary,
  };

  const editableInputStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    resize: 'none',
  };

  // Render editable title
  const renderEditableTitle = (additionalStyle: CSSProperties = {}) => {
    const mergedStyle = { ...titleStyle, ...additionalStyle };

    if (editingTitle) {
      return (
        <input
          ref={titleInputRef}
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTitleBlur();
            if (e.key === 'Escape') {
              setLocalTitle(slide.title);
              setEditingTitle(false);
            }
          }}
          style={{ ...editableInputStyle, ...mergedStyle }}
        />
      );
    }

    return (
      <h2
        onClick={() => setEditingTitle(true)}
        style={{ ...mergedStyle, cursor: 'text' }}
        className="hover:ring-2 hover:ring-brand/30 rounded transition-all"
      >
        {localTitle || 'Click to add title'}
      </h2>
    );
  };

  // Render editable body bullets
  const renderEditableBody = (bulletStyle: CSSProperties = {}) => {
    const addNewBullet = () => {
      const newBody = [...localBody, ''];
      setLocalBody(newBody);
      onUpdate({ body: newBody });
      setTimeout(() => {
        setEditingBodyIndex(newBody.length - 1);
      }, 0);
    };

    return (
      <>
        {localBody.map((bullet, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: themeConfig.colors.textSecondary,
              marginTop: '10px',
              flexShrink: 0,
            }} />
            {editingBodyIndex === idx ? (
              <textarea
                ref={(el) => { bodyInputRefs.current[idx] = el; }}
                value={bullet}
                onChange={(e) => handleBodyChange(idx, e.target.value)}
                onBlur={() => handleBodyBlur(idx)}
                onKeyDown={(e) => handleBodyKeyDown(e, idx)}
                rows={1}
                style={{
                  ...editableInputStyle,
                  ...bodyStyle,
                  ...bulletStyle,
                  height: 'auto',
                  overflow: 'hidden',
                }}
              />
            ) : (
              <p
                onClick={() => setEditingBodyIndex(idx)}
                style={{ ...bodyStyle, ...bulletStyle, cursor: 'text', flex: 1 }}
                className="hover:ring-2 hover:ring-brand/30 rounded transition-all"
              >
                {bullet || 'Click to edit'}
              </p>
            )}
          </div>
        ))}
        {/* Add bullet button */}
        <button
          onClick={addNewBullet}
          className="flex items-center gap-2 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 mt-2"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add bullet</span>
        </button>
      </>
    );
  };

  // Render citations
  const renderCitations = () => {
    if (citationStyle === 'speaker_notes' || !slide.citations || slide.citations.length === 0) {
      return null;
    }

    if (citationStyle === 'footnote') {
      return (
        <div style={{
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: `1px solid ${themeConfig.colors.border}`,
        }}>
          {slide.citations.map((citation, idx) => (
            <p
              key={idx}
              style={{
                fontSize: '12px',
                color: themeConfig.colors.textSecondary,
                marginBottom: '4px',
              }}
            >
              [{idx + 1}] {citation.text} - {citation.source.domain}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  // Render image based on position
  const renderImage = (position: ImagePosition) => {
    if (!slide.image || slide.image.position !== position) return null;

    const imageContainerStyle: CSSProperties = {
      position: position === 'background' ? 'absolute' : 'relative',
      ...(position === 'background' && {
        inset: 0,
        zIndex: 0,
      }),
    };

    const imageStyle: CSSProperties = {
      width: '100%',
      height: position === 'background' ? '100%' : 'auto',
      maxHeight: position === 'background' ? undefined : '300px',
      objectFit: 'cover',
      borderRadius: position === 'background' ? 0 : '8px',
      opacity: position === 'background' ? 0.3 : 1,
    };

    return (
      <div style={imageContainerStyle}>
        <img
          src={slide.image.url}
          alt={slide.image.caption || 'Slide image'}
          style={imageStyle}
        />
        {slide.image.caption && position !== 'background' && (
          <p style={{
            fontSize: '12px',
            color: themeConfig.colors.textSecondary,
            marginTop: '8px',
            textAlign: 'center',
          }}>
            {slide.image.caption}
          </p>
        )}
      </div>
    );
  };

  // Image upload button/panel
  const renderImageControls = () => {
    if (showImageUpload) {
      return (
        <div className="absolute right-4 top-4 z-20 w-64 rounded-lg border border-border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Slide Image</span>
            <button
              onClick={() => setShowImageUpload(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ImageUpload
            presentationId={presentationId}
            slideIndex={slide.index}
            currentImage={slide.image}
            onImageChange={handleImageChange}
          />
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowImageUpload(true)}
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground opacity-0 backdrop-blur-sm transition-all hover:border-brand/50 hover:text-foreground group-hover:opacity-100"
      >
        <ImageIcon className="h-4 w-4" />
        {slide.image ? 'Edit Image' : 'Add Image'}
      </button>
    );
  };

  // Layout wrapper with image support
  const renderWithImage = (content: React.ReactNode) => {
    const imagePosition = slide.image?.position || 'none';

    if (imagePosition === 'background') {
      return (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {renderImage('background')}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {content}
          </div>
        </div>
      );
    }

    if (imagePosition === 'left' || imagePosition === 'right') {
      return (
        <div style={{
          display: 'flex',
          flexDirection: imagePosition === 'left' ? 'row' : 'row-reverse',
          gap: '32px',
          alignItems: 'flex-start',
        }}>
          <div style={{ flex: '0 0 40%' }}>
            {renderImage(imagePosition)}
          </div>
          <div style={{ flex: 1 }}>
            {content}
          </div>
        </div>
      );
    }

    if (imagePosition === 'top') {
      return (
        <div>
          {renderImage('top')}
          <div style={{ marginTop: '24px' }}>
            {content}
          </div>
        </div>
      );
    }

    if (imagePosition === 'bottom') {
      return (
        <div>
          {content}
          <div style={{ marginTop: '24px' }}>
            {renderImage('bottom')}
          </div>
        </div>
      );
    }

    return content;
  };

  // Render based on slide type
  const renderSlideContent = () => {
    switch (slide.type) {
      case 'intro':
        return renderWithImage(
          <div style={{ padding: '64px 48px' }}>
            {renderEditableTitle({ fontSize: `${themeConfig.typography.titleSize + 8}px`, marginBottom: '32px' })}

            {localBody.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {localBody.map((bullet, idx) => (
                  editingBodyIndex === idx ? (
                    <textarea
                      key={idx}
                      ref={(el) => { bodyInputRefs.current[idx] = el; }}
                      value={bullet}
                      onChange={(e) => handleBodyChange(idx, e.target.value)}
                      onBlur={() => handleBodyBlur(idx)}
                      onKeyDown={(e) => handleBodyKeyDown(e, idx)}
                      rows={1}
                      style={{
                        ...editableInputStyle,
                        ...secondaryTextStyle,
                      }}
                    />
                  ) : (
                    <p
                      key={idx}
                      onClick={() => setEditingBodyIndex(idx)}
                      style={{ ...secondaryTextStyle, cursor: 'text' }}
                      className="hover:ring-2 hover:ring-brand/30 rounded transition-all"
                    >
                      {bullet || 'Click to edit'}
                    </p>
                  )
                ))}
              </div>
            )}

            {renderCitations()}
          </div>
        );

      case 'quote':
        return renderWithImage(
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '48px',
            textAlign: 'center',
          }}>
            <div>
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleBlur();
                    if (e.key === 'Escape') {
                      setLocalTitle(slide.title);
                      setEditingTitle(false);
                    }
                  }}
                  style={{
                    ...editableInputStyle,
                    fontSize: `${themeConfig.typography.titleSize - 8}px`,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: themeConfig.colors.text,
                    textAlign: 'center',
                  }}
                />
              ) : (
                <blockquote
                  onClick={() => setEditingTitle(true)}
                  style={{
                    fontSize: `${themeConfig.typography.titleSize - 8}px`,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: themeConfig.colors.text,
                    marginBottom: '24px',
                    cursor: 'text',
                  }}
                  className="hover:ring-2 hover:ring-brand/30 rounded transition-all"
                >
                  "{localTitle}"
                </blockquote>
              )}

              {localBody.length > 0 && (
                editingBodyIndex === 0 ? (
                  <textarea
                    ref={(el) => { bodyInputRefs.current[0] = el; }}
                    value={localBody[0]}
                    onChange={(e) => handleBodyChange(0, e.target.value)}
                    onBlur={() => handleBodyBlur(0)}
                    rows={1}
                    style={{
                      ...editableInputStyle,
                      ...bodyStyle,
                      color: themeConfig.colors.textSecondary,
                      textAlign: 'center',
                    }}
                  />
                ) : (
                  <p
                    onClick={() => setEditingBodyIndex(0)}
                    style={{
                      ...bodyStyle,
                      color: themeConfig.colors.textSecondary,
                      cursor: 'text',
                    }}
                    className="hover:ring-2 hover:ring-brand/30 rounded transition-all"
                  >
                    — {localBody[0] || 'Click to add attribution'}
                  </p>
                )
              )}

              {renderCitations()}
            </div>
          </div>
        );

      case 'data':
        return renderWithImage(
          <div style={{ padding: '64px 48px' }}>
            {renderEditableTitle({ marginBottom: '32px' })}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {localBody.map((bullet, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: themeConfig.colors.accent,
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  {editingBodyIndex === idx ? (
                    <textarea
                      ref={(el) => { bodyInputRefs.current[idx] = el; }}
                      value={bullet}
                      onChange={(e) => handleBodyChange(idx, e.target.value)}
                      onBlur={() => handleBodyBlur(idx)}
                      onKeyDown={(e) => handleBodyKeyDown(e, idx)}
                      rows={1}
                      style={{
                        ...editableInputStyle,
                        ...bodyStyle,
                        fontSize: `${themeConfig.typography.bodySize + 4}px`,
                        paddingTop: '8px',
                      }}
                    />
                  ) : (
                    <p
                      onClick={() => setEditingBodyIndex(idx)}
                      style={{
                        ...bodyStyle,
                        fontSize: `${themeConfig.typography.bodySize + 4}px`,
                        paddingTop: '8px',
                        cursor: 'text',
                        flex: 1,
                      }}
                      className="hover:ring-2 hover:ring-brand/30 rounded transition-all"
                    >
                      {bullet || 'Click to edit'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {renderCitations()}
          </div>
        );

      case 'conclusion':
        return renderWithImage(
          <div style={{ padding: '64px 48px' }}>
            {renderEditableTitle({ fontSize: `${themeConfig.typography.titleSize + 8}px`, marginBottom: '32px' })}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {localBody.map((bullet, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: themeConfig.colors.accent,
                    marginTop: '8px',
                    flexShrink: 0,
                  }} />
                  {editingBodyIndex === idx ? (
                    <textarea
                      ref={(el) => { bodyInputRefs.current[idx] = el; }}
                      value={bullet}
                      onChange={(e) => handleBodyChange(idx, e.target.value)}
                      onBlur={() => handleBodyBlur(idx)}
                      onKeyDown={(e) => handleBodyKeyDown(e, idx)}
                      rows={1}
                      style={{
                        ...editableInputStyle,
                        ...bodyStyle,
                      }}
                    />
                  ) : (
                    <p
                      onClick={() => setEditingBodyIndex(idx)}
                      style={{ ...bodyStyle, cursor: 'text', flex: 1 }}
                      className="hover:ring-2 hover:ring-brand/30 rounded transition-all"
                    >
                      {bullet || 'Click to edit'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {renderCitations()}
          </div>
        );

      case 'content':
      default:
        return renderWithImage(
          <div style={{ padding: '64px 48px' }}>
            {renderEditableTitle({ marginBottom: '32px' })}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderEditableBody()}
            </div>

            {renderCitations()}
          </div>
        );
    }
  };

  return (
    <div style={containerStyle} className="group relative">
      {renderImageControls()}
      {renderSlideContent()}
    </div>
  );
}
