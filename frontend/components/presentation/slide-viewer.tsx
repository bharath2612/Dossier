'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { getTheme } from '@/lib/themes';
import type { Slide, CitationStyle, Theme, ImagePosition } from '@/types/presentation';

interface SlideViewerProps {
  slide: Slide;
  citationStyle: CitationStyle;
  theme: Theme;
}

export function SlideViewer({ slide, citationStyle, theme }: SlideViewerProps) {
  const themeConfig = getTheme(theme);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [theme]);

  // Use slide-specific background color if set, otherwise use theme
  const backgroundColor = slide.background_color || themeConfig.colors.background;

  // Responsive scaling factors
  const scale = isMobile ? 0.5 : 1; // 50% scale for mobile
  const padding = isMobile ? '24px 16px' : '64px 48px';

  // Common styles with higher specificity - use slide background override if present
  const containerStyle: CSSProperties = {
    backgroundColor: backgroundColor,
    color: themeConfig.colors.text,
    fontFamily: themeConfig.typography.fontFamily,
    width: '100%',
    maxWidth: isMobile ? '100%' : '1200px',
    minHeight: isMobile ? 'auto' : '500px',
    position: 'relative',
    overflow: 'hidden',
  };

  const titleStyle: CSSProperties = {
    fontSize: `${themeConfig.typography.titleSize * scale}px`,
    fontWeight: themeConfig.typography.titleWeight,
    lineHeight: 1.2,
    color: themeConfig.colors.text,
    margin: 0,
  };

  const bodyStyle: CSSProperties = {
    fontSize: `${themeConfig.typography.bodySize * scale}px`,
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
    const gap = isMobile ? '16px' : '32px';
    const marginTop = isMobile ? '12px' : '24px';

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
          flexDirection: isMobile ? 'column' : (imagePosition === 'left' ? 'row' : 'row-reverse'),
          gap,
          alignItems: 'flex-start',
          padding,
        }}>
          <div style={{ flex: isMobile ? '1' : '0 0 40%' }}>
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
        <div style={{ padding }}>
          {renderImage('top')}
          <div style={{ marginTop }}>
            {content}
          </div>
        </div>
      );
    }

    if (imagePosition === 'bottom') {
      return (
        <div style={{ padding }}>
          {content}
          <div style={{ marginTop }}>
            {renderImage('bottom')}
          </div>
        </div>
      );
    }

    return <div style={{ padding }}>{content}</div>;
  };

  // Render citations
  const renderCitations = () => {
    if (citationStyle === 'speaker_notes' || !slide.citations || slide.citations.length === 0) {
      return null;
    }

    if (citationStyle === 'footnote') {
      return (
        <div style={{
          marginTop: isMobile ? '16px' : '32px',
          paddingTop: isMobile ? '8px' : '16px',
          borderTop: `1px solid ${themeConfig.colors.border}`,
        }}>
          {slide.citations.map((citation, idx) => (
            <p
              key={idx}
              style={{
                fontSize: isMobile ? '10px' : '12px',
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
              <h1 style={{
                ...titleStyle,
                fontSize: `${(themeConfig.typography.titleSize + 8) * scale}px`,
                marginBottom: isMobile ? '16px' : '32px'
              }}>
                {slide.title}
              </h1>

              {slide.body.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '16px' }}>
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
              minHeight: isMobile ? '150px' : '300px',
              textAlign: 'center',
            }}>
              <div>
                <blockquote style={{
                  fontSize: `${(themeConfig.typography.titleSize - 8) * scale}px`,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: themeConfig.colors.text,
                  marginBottom: isMobile ? '12px' : '24px',
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
              <h2 style={{ ...titleStyle, marginBottom: isMobile ? '16px' : '32px' }}>
                {slide.title}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '24px' }}>
                {slide.body.map((bullet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '8px' : '16px' }}>
                    <div style={{
                      fontSize: isMobile ? '16px' : '32px',
                      fontWeight: 700,
                      color: themeConfig.colors.accent,
                      flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <p style={{
                      ...bodyStyle,
                      fontSize: `${(themeConfig.typography.bodySize + 4) * scale}px`,
                      paddingTop: isMobile ? '4px' : '8px',
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
              <h2 style={{
                ...titleStyle,
                fontSize: `${(themeConfig.typography.titleSize + 8) * scale}px`,
                marginBottom: isMobile ? '16px' : '32px'
              }}>
                {slide.title}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '20px' }}>
                {slide.body.map((bullet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '8px' : '16px' }}>
                    <div style={{
                      width: isMobile ? '6px' : '8px',
                      height: isMobile ? '6px' : '8px',
                      borderRadius: '50%',
                      backgroundColor: themeConfig.colors.accent,
                      marginTop: isMobile ? '6px' : '8px',
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
              <h2 style={{ ...titleStyle, marginBottom: isMobile ? '16px' : '32px' }}>
                {slide.title}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '16px' }}>
                {slide.body.map((bullet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '8px' : '16px' }}>
                    <div style={{
                      width: isMobile ? '4px' : '6px',
                      height: isMobile ? '4px' : '6px',
                      borderRadius: '50%',
                      backgroundColor: themeConfig.colors.textSecondary,
                      marginTop: isMobile ? '8px' : '10px',
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
