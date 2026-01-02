'use client';

import { CSSProperties } from 'react';
import { getTheme } from '@/lib/themes';
import type { Slide, CitationStyle, Theme, ImagePosition } from '@/types/presentation';

interface SlideViewerProps {
  slide: Slide;
  citationStyle: CitationStyle;
  theme: Theme;
}

export function SlideViewer({ slide, citationStyle, theme }: SlideViewerProps) {
  const themeConfig = getTheme(theme);

  // Common styles
  const containerStyle: CSSProperties = {
    background: themeConfig.colors.background,
    color: themeConfig.colors.text,
    fontFamily: themeConfig.typography.fontFamily,
    width: '100%',
    maxWidth: '1200px',
    minHeight: '500px',
    position: 'relative',
    overflow: 'hidden',
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

  // Layout wrapper with image support
  const renderWithImage = (content: React.ReactNode) => {
    const imagePosition = slide.image?.position || 'none';

    if (imagePosition === 'background') {
      return (
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
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
          padding: '64px 48px',
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
        <div style={{ padding: '64px 48px' }}>
          {renderImage('top')}
          <div style={{ marginTop: '24px' }}>
            {content}
          </div>
        </div>
      );
    }

    if (imagePosition === 'bottom') {
      return (
        <div style={{ padding: '64px 48px' }}>
          {content}
          <div style={{ marginTop: '24px' }}>
            {renderImage('bottom')}
          </div>
        </div>
      );
    }

    return <div style={{ padding: '64px 48px' }}>{content}</div>;
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

  // Render based on slide type
  switch (slide.type) {
    case 'intro':
      return (
        <div style={containerStyle}>
          {renderWithImage(
            <>
              <h1 style={{ ...titleStyle, fontSize: `${themeConfig.typography.titleSize + 8}px`, marginBottom: '32px' }}>
                {slide.title}
              </h1>

              {slide.body.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {slide.body.map((bullet, idx) => (
                    <p key={idx} style={secondaryTextStyle}>
                      {bullet}
                    </p>
                  ))}
                </div>
              )}

              {renderCitations()}
            </>
          )}
        </div>
      );

    case 'quote':
      return (
        <div style={containerStyle}>
          {renderWithImage(
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              textAlign: 'center',
            }}>
              <div>
                <blockquote style={{
                  fontSize: `${themeConfig.typography.titleSize - 8}px`,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: themeConfig.colors.text,
                  marginBottom: '24px',
                }}>
                  "{slide.title}"
                </blockquote>

                {slide.body.length > 0 && (
                  <p style={{
                    ...bodyStyle,
                    color: themeConfig.colors.textSecondary,
                  }}>
                    — {slide.body[0]}
                  </p>
                )}

                {renderCitations()}
              </div>
            </div>
          )}
        </div>
      );

    case 'data':
      return (
        <div style={containerStyle}>
          {renderWithImage(
            <>
              <h2 style={{ ...titleStyle, marginBottom: '32px' }}>
                {slide.title}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {slide.body.map((bullet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: themeConfig.colors.accent,
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <p style={{
                      ...bodyStyle,
                      fontSize: `${themeConfig.typography.bodySize + 4}px`,
                      paddingTop: '8px',
                    }}>
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              {renderCitations()}
            </>
          )}
        </div>
      );

    case 'conclusion':
      return (
        <div style={containerStyle}>
          {renderWithImage(
            <>
              <h2 style={{ ...titleStyle, fontSize: `${themeConfig.typography.titleSize + 8}px`, marginBottom: '32px' }}>
                {slide.title}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {slide.body.map((bullet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: themeConfig.colors.accent,
                      marginTop: '8px',
                      flexShrink: 0,
                    }} />
                    <p style={bodyStyle}>
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              {renderCitations()}
            </>
          )}
        </div>
      );

    case 'content':
    default:
      return (
        <div style={containerStyle}>
          {renderWithImage(
            <>
              <h2 style={{ ...titleStyle, marginBottom: '32px' }}>
                {slide.title}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {slide.body.map((bullet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: themeConfig.colors.textSecondary,
                      marginTop: '10px',
                      flexShrink: 0,
                    }} />
                    <p style={bodyStyle}>
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              {renderCitations()}
            </>
          )}
        </div>
      );
  }
}
