'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, ChevronLeft, ChevronRight, Edit3, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SlideViewer } from '@/components/presentation/slide-viewer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { getTheme } from '@/lib/themes';
import type { Presentation } from '@/types/presentation';

export default function PresentationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const presentationId = params.id as string;

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchPresentation = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${API_URL}/api/presentations/${presentationId}`);

        if (!response.ok) {
          throw new Error('Failed to load presentation');
        }

        const data = await response.json();
        setPresentation(data.presentation);
      } catch (err) {
        console.error('Error loading presentation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load presentation');
      } finally {
        setLoading(false);
      }
    };

    fetchPresentation();
  }, [presentationId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!presentation) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentSlide((prev) => Math.min(prev + 1, presentation.slides.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        setCurrentSlide(0);
      } else if (e.key === 'End') {
        setCurrentSlide(presentation.slides.length - 1);
      } else if (e.key === 'Escape') {
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation, router]);

  const handleExport = async () => {
    if (!presentation || exporting) return;

    try {
      setExporting(true);

      // Dynamically import required modules
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const React = (await import('react')).default;
      const ReactDOM = (await import('react-dom/client')).default;
      const { SlideViewer } = await import('@/components/presentation/slide-viewer');

      // Get the theme config
      const themeConfig = getTheme(presentation.theme);

      // Helper to convert any color to html2canvas-safe format
      const getSafeBackgroundColor = (color: string): string | null => {
        // If it's a gradient, return null (let element handle it)
        if (color.includes('gradient')) return null;

        // If it's already hex, return as-is
        if (color.startsWith('#')) return color;

        // If it's rgba/rgb, return as-is
        if (color.startsWith('rgb')) return color;

        // Fallback
        return null;
      };

      // PDF setup
      const pdfWidth = 297; // mm (A4 landscape width)
      const pdfHeight = 167; // mm (16:9 ratio)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      let isFirstPage = true;

      // Create single export container
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = '1920px';
      exportContainer.style.height = '1080px';
      exportContainer.style.background = themeConfig.colors.background;
      document.body.appendChild(exportContainer);

      // Process each slide individually
      for (let i = 0; i < presentation.slides.length; i++) {
        console.log(`Rendering slide ${i + 1}/${presentation.slides.length}...`);

        // Clear container
        exportContainer.innerHTML = '';

        // Create slide wrapper
        const slideWrapper = document.createElement('div');
        slideWrapper.style.width = '1920px';
        slideWrapper.style.height = '1080px';
        slideWrapper.style.display = 'flex';
        slideWrapper.style.alignItems = 'center';
        slideWrapper.style.justifyContent = 'center';
        slideWrapper.style.background = themeConfig.colors.background;
        slideWrapper.style.fontFamily = themeConfig.typography.fontFamily;
        exportContainer.appendChild(slideWrapper);

        // Render slide with React
        const root = ReactDOM.createRoot(slideWrapper);
        await new Promise<void>((resolve) => {
          root.render(
            React.createElement(SlideViewer, {
              slide: presentation.slides[i],
              citationStyle: presentation.citation_style,
              theme: presentation.theme,
            })
          );
          // Wait for React render and style application
          setTimeout(() => resolve(), 500);
        });

        console.log(`Capturing slide ${i + 1}...`);

        // Capture with html2canvas (with gradient support and lab() prevention)
        let canvas;
        try {
          canvas = await html2canvas(exportContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            width: 1920,
            height: 1080,
            windowWidth: 1920,
            windowHeight: 1080,
            backgroundColor: getSafeBackgroundColor(themeConfig.colors.background),
            logging: false,
            // Prevent lab() color parsing errors
            onclone: (clonedDoc) => {
              // Convert all computed styles to explicit inline styles with safe color formats
              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                const computedStyle = window.getComputedStyle(el);

                // Convert potentially problematic color properties to RGB
                ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
                  const value = computedStyle.getPropertyValue(prop);
                  if (value && !value.includes('lab') && !value.includes('gradient')) {
                    htmlEl.style.setProperty(prop, value, 'important');
                  }
                });
              });
            },
          });
        } catch (err: any) {
          // If lab() error occurs, retry with minimal options
          if (err.message?.includes('lab') || err.message?.includes('color')) {
            console.warn('Color parsing error, retrying with fallback options...');
            canvas = await html2canvas(exportContainer, {
              scale: 2,
              width: 1920,
              height: 1080,
              backgroundColor: '#000000', // Fallback to black
              logging: false,
              ignoreElements: (element) => {
                // Skip elements that might have problematic colors
                return false;
              },
            });
          } else {
            throw err;
          }
        }

        console.log(`Canvas size: ${canvas.width}x${canvas.height}`);

        // Convert to image and add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        console.log(`Slide ${i + 1} added to PDF`);

        // Unmount React component
        root.unmount();
      }

      // Cleanup
      document.body.removeChild(exportContainer);

      // Generate filename and save
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${presentation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timestamp}.pdf`;
      console.log(`Saving PDF as ${filename}...`);
      pdf.save(filename);

      console.log('PDF export completed successfully!');

    } catch (err) {
      console.error('Export error:', err);
      alert(`Failed to export presentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand mx-auto" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Loading presentation
          </p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <div className="text-center">
          <p className="mb-4 text-lg text-destructive">{error || 'Presentation not found'}</p>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const slide = presentation.slides[currentSlide];
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === presentation.slides.length - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Dashboard
            </button>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-sm font-medium text-foreground">{presentation.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {currentSlide + 1} / {presentation.slides.length}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Slide Viewer */}
      <div className="flex min-h-screen items-center justify-center px-6 pt-20 pb-32">
        <div ref={(el) => {
          if (el) slideRefs.current[currentSlide] = el;
        }}>
          <SlideViewer
            slide={slide}
            citationStyle={presentation.citation_style}
            theme={presentation.theme}
          />
        </div>
      </div>

      {/* Slide Thumbnails Strip */}
      <div className="fixed bottom-24 left-0 right-0 z-40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {presentation.slides.map((s, idx) => (
              <button
                key={s.index}
                onClick={() => setCurrentSlide(idx)}
                className={`group relative flex-shrink-0 rounded-md border-2 transition-all ${
                  idx === currentSlide
                    ? 'border-brand ring-2 ring-brand/20'
                    : 'border-border hover:border-muted-foreground'
                }`}
                style={{ width: '120px', height: '68px' }}
              >
                <div
                  className="flex h-full w-full items-center justify-center rounded p-2 text-xs"
                  style={{
                    background: getTheme(presentation.theme).colors.background,
                    backgroundSize: 'cover',
                  }}
                >
                  <span
                    className="line-clamp-2 text-center font-medium"
                    style={{
                      color: getTheme(presentation.theme).colors.text,
                      fontSize: '8px'
                    }}
                  >
                    {s.title}
                  </span>
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs text-muted-foreground">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="brand"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            {user && (
              <Button
                variant="outline"
                onClick={() => router.push(`/presentation/${presentationId}/edit`)}
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            )}
            {user && (
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, presentation.slides.length - 1))}
            disabled={isLast}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
