'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Download, ChevronLeft, ChevronRight, Home, LayoutDashboard, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SlideCanvas } from '@/components/presentation/editor/slide-canvas';
import { SlideViewer } from '@/components/presentation/slide-viewer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { getTheme } from '@/lib/themes';
import { usePresentationStore } from '@/store/presentation';
import { AutoSaveIndicator } from '@/components/outline/auto-save-indicator';
import type { Presentation, Slide } from '@/types/presentation';

function PresentationPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const presentationId = params.id as string;
  const shouldGenerate = searchParams.get('generate') === 'true';

  // Use store for presentation state
  const {
    currentPresentation: presentation,
    loading,
    error,
    saving,
    hasUnsavedChanges,
    lastSaved,
    saveError,
    setCurrentPresentation,
    updateSlide,
    setUserId,
    savePresentation,
  } = usePresentationStore();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [exporting, setExporting] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Set user ID in store
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user, setUserId]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    // Wait for auth to finish loading
    if (authLoading) return;

    // If generate=true, this is a draft ID and we need to create a presentation first
    const handleGenerateFromDraft = async () => {
      if (!user) {
        // Redirect to home if not authenticated
        router.push('/');
        return;
      }

      try {
        usePresentationStore.getState().setLoading(true);

        // Fetch the draft first
        const draftResponse = await fetch(`/api/drafts/${presentationId}`);
        if (!draftResponse.ok) {
          throw new Error('Draft not found. Please try generating again.');
        }
        const draftData = await draftResponse.json();
        const draft = draftData.draft;

        if (!draft || !draft.outline) {
          throw new Error('Invalid draft data');
        }

        // Create presentation from draft
        const generateResponse = await fetch('/api/generate-presentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draft_id: presentationId,
            outline: draft.outline,
            citation_style: 'inline',
            theme: 'minimal',
            user_id: user.id,
          }),
        });

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(errorData.error || 'Failed to generate presentation');
        }

        const result = await generateResponse.json();

        // Redirect to the actual presentation page (without generate=true)
        router.replace(`/presentation/${result.presentation_id}`);
      } catch (err) {
        console.error('Error generating presentation from draft:', err);
        usePresentationStore.getState().setError(err instanceof Error ? err.message : 'Failed to generate presentation');
        usePresentationStore.getState().setLoading(false);
      }
    };

    if (shouldGenerate) {
      handleGenerateFromDraft();
      return;
    }

    const fetchPresentation = async () => {
      try {
        const { apiClient } = await import('@/lib/api/client');
        const data = await apiClient.getPresentation(presentationId, user?.id);
        const pres = data.presentation;

        setCurrentPresentation(pres);

        // If presentation is still generating, use SSE for real-time updates
        if (pres.status === 'generating') {
          console.log('[SSE] Presentation is generating, connecting to SSE stream...');
          usePresentationStore.getState().setLoading(false); // Show generating UI instead of loading spinner
          
          try {
            // Connect to SSE endpoint
            const streamUrl = apiClient.getPresentationStreamUrl(presentationId, user?.id);
            eventSource = new EventSource(streamUrl);

            eventSource.onopen = () => {
              console.log('[SSE] Connection established');
            };

            eventSource.onmessage = (event) => {
              try {
                const updatedPres = JSON.parse(event.data);
                console.log('[SSE] Received update:', updatedPres.status);
                setCurrentPresentation(updatedPres);
                
                // If generation is complete or failed, close the connection
                if (updatedPres.status === 'completed' || updatedPres.status === 'failed') {
                  console.log(`[SSE] Presentation ${updatedPres.status}, closing connection`);
                  
                  if (updatedPres.status === 'failed') {
                    usePresentationStore.getState().setError(updatedPres.error_message || 'Presentation generation failed');
                  }
                  
                  if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                  }
                }
              } catch (parseError) {
                console.error('[SSE] Error parsing message:', parseError);
              }
            };

            eventSource.addEventListener('complete', () => {
              console.log('[SSE] Generation complete event received');
              if (eventSource) {
                eventSource.close();
                eventSource = null;
              }
            });

            eventSource.addEventListener('error', (event) => {
              console.error('[SSE] Connection error:', event);
              if (eventSource) {
                eventSource.close();
                eventSource = null;
              }
            });

            eventSource.onerror = (err) => {
              console.error('[SSE] Error occurred:', err);
              
              // Fall back to polling if SSE fails
              console.log('[SSE] Falling back to polling...');
              if (eventSource) {
                eventSource.close();
                eventSource = null;
              }
              
              // Use polling as fallback
              if (!fallbackInterval) {
                fallbackInterval = setInterval(async () => {
                  try {
                    const pollData = await apiClient.getPresentation(presentationId, user?.id);
                    const updatedPres = pollData.presentation;
                    setCurrentPresentation(updatedPres);
                    
                    if (updatedPres.status === 'completed' || updatedPres.status === 'failed') {
                      if (fallbackInterval) {
                        clearInterval(fallbackInterval);
                        fallbackInterval = null;
                      }
                      
                      if (updatedPres.status === 'failed') {
                        usePresentationStore.getState().setError(updatedPres.error_message || 'Presentation generation failed');
                      }
                    }
                  } catch (pollError) {
                    console.error('[Polling] Error:', pollError);
                  }
                }, 10000);
              }
            };
          } catch (sseError) {
            console.error('[SSE] Failed to create EventSource:', sseError);
            // Fall back to initial polling setup
            usePresentationStore.getState().setLoading(false);
          }
        } else if (pres.status === 'failed') {
          usePresentationStore.getState().setError(pres.error_message || 'Presentation generation failed');
          usePresentationStore.getState().setLoading(false);
        } else {
          // Presentation is completed
          usePresentationStore.getState().setLoading(false);
        }
      } catch (err) {
        console.error('Error loading presentation:', err);
        usePresentationStore.getState().setError(err instanceof Error ? err.message : 'Failed to load presentation');
        usePresentationStore.getState().setLoading(false);
      }
    };

    fetchPresentation();

    // Cleanup: close SSE connection and clear intervals on unmount
    return () => {
      if (eventSource) {
        console.log('[SSE] Cleaning up connection');
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [presentationId, authLoading, shouldGenerate, user, router]);

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

  // Navigation guard - warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Show browser warning - debounced save should have already triggered
        // but if user closes immediately, changes may be lost
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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

  // Show generating state
  if (presentation && presentation.status === 'generating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <div className="text-center max-w-md">
          <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-border border-t-brand mx-auto" />
          <h2 className="text-2xl font-semibold mb-3 text-foreground">
            Generating Your Presentation
          </h2>
          <p className="text-muted-foreground mb-2">
            Our AI is creating beautiful slides for you...
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            This usually takes 1-2 minutes
          </p>
          <div className="mt-8 p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> You can safely leave this page. Your presentation will be available in your dashboard once complete.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Button>
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
            {/* Save Status Indicator */}
            {saveError ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="font-mono text-xs text-destructive">Save failed</span>
              </div>
            ) : (
              <AutoSaveIndicator 
                hasUnsavedChanges={hasUnsavedChanges || saving} 
                lastSaved={lastSaved} 
              />
            )}
            <span className="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
              {currentSlide + 1} / {presentation.slides.length}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Slide Editor */}
      <div className="flex min-h-screen items-center justify-center px-6 pt-20 pb-32">
        <div
          ref={(el) => {
            if (el) slideRefs.current[currentSlide] = el;
          }}
          className="w-full max-w-7xl"
        >
          <SlideCanvas
            slide={slide}
            citationStyle={presentation.citation_style}
            theme={presentation.theme}
            presentationId={presentationId}
            onUpdate={(updates) => {
              updateSlide(currentSlide, updates);
            }}
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

function LoadingFallback() {
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

export default function PresentationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PresentationPageContent />
    </Suspense>
  );
}
