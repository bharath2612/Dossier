'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDraftStore } from '@/store/draft';
import { PresentationCard } from '@/components/dashboard/presentation-card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import type { Presentation } from '@/types/presentation';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { clearDraft } = useDraftStore();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);
  const sseConnectionsRef = useRef<Map<string, EventSource>>(new Map());
  
  // Check for generation error from auth callback
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'generation_failed') {
      setError('Failed to generate presentation. Please try again.');
      // Clear the error from URL after showing it
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  const fetchPresentations = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.getPresentations(user.id);
      setPresentations(data.presentations || []);
    } catch (err) {
      console.error('Error fetching presentations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load presentations');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  // Initial fetch on mount and setup polling for generating presentations
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/');
      return;
    }

    // Only fetch once when component mounts and user is ready
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPresentations();
    }
  }, [user, authLoading, fetchPresentations, router]);

  // Use SSE for real-time updates on generating presentations
  useEffect(() => {
    if (!user || presentations.length === 0) {
      return;
    }

    const generatingPresentations = presentations.filter(p => p.status === 'generating');
    const connections = sseConnectionsRef.current;
    
    // Close connections for presentations that are no longer generating
    connections.forEach((eventSource, presentationId) => {
      const presentation = presentations.find(p => p.id === presentationId);
      if (!presentation || presentation.status !== 'generating') {
        console.log(`[Dashboard SSE] Closing connection for completed presentation ${presentationId}`);
        eventSource.close();
        connections.delete(presentationId);
      }
    });

    // Create SSE connections for new generating presentations
    // Use for...of to handle async operations properly
    (async () => {
      const { apiClient } = await import('@/lib/api/client');
      
      for (const presentation of generatingPresentations) {
        // Skip if connection already exists
        if (connections.has(presentation.id)) {
          continue;
        }

        try {
          console.log(`[Dashboard SSE] Creating connection for presentation ${presentation.id}`);
          const streamUrl = apiClient.getPresentationStreamUrl(presentation.id, user.id);
          const eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          console.log(`[Dashboard SSE] Connected for presentation ${presentation.id}`);
        };

        eventSource.onmessage = (event) => {
          try {
            const updatedPres = JSON.parse(event.data);
            console.log(`[Dashboard SSE] Update received for ${presentation.id}:`, updatedPres.status);
            
            // Update the specific presentation in state
            setPresentations((prev) =>
              prev.map((p) => (p.id === updatedPres.id ? updatedPres : p))
            );

            // If complete, close this connection
            if (updatedPres.status === 'completed' || updatedPres.status === 'failed') {
              console.log(`[Dashboard SSE] Presentation ${presentation.id} ${updatedPres.status}, closing connection`);
              eventSource.close();
              connections.delete(presentation.id);
            }
          } catch (parseError) {
            console.error('[Dashboard SSE] Error parsing message:', parseError);
          }
        };

        eventSource.onerror = (err) => {
          console.error(`[Dashboard SSE] Error for presentation ${presentation.id}:`, err);
          
          // If connection is closed, remove from map
          if (eventSource.readyState === EventSource.CLOSED) {
            connections.delete(presentation.id);
          }
        };

          connections.set(presentation.id, eventSource);
        } catch (sseError) {
          console.error(`[Dashboard SSE] Failed to create EventSource for ${presentation.id}:`, sseError);
        }
      }
    })();

    // Cleanup: close all SSE connections on unmount
    return () => {
      console.log('[Dashboard SSE] Component unmounting, cleaning up all connections');
      connections.forEach((es) => {
        if (es.readyState !== EventSource.CLOSED) {
          es.close();
        }
      });
      connections.clear();
    };
  }, [presentations, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPresentations(false);
    setRefreshing(false);
  };

  const handleNewPresentation = () => {
    // Clear any existing draft/outline to start fresh
    clearDraft();
    router.push('/');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this presentation?')) {
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.deletePresentation(id, user?.id);
      setPresentations((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting presentation:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete presentation');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.duplicatePresentation(id, user?.id || '');
      // Fetch updated presentation to get full data
      const updatedPres = await apiClient.getPresentation(data.presentation_id, user?.id);
      setPresentations((prev) => [updatedPres.presentation, ...prev]);
    } catch (err) {
      console.error('Error duplicating presentation:', err);
      alert(err instanceof Error ? err.message : 'Failed to duplicate presentation');
    }
  };

  const filteredPresentations = presentations.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand mx-auto" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Loading presentations
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if there's a generating presentation
  const hasGeneratingPresentation = presentations.some(p => p.status === 'generating');

  return (
    <div className="min-h-screen bg-background text-foreground grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="Dossier AI" 
                width={32} 
                height={32}
                className="h-8 w-8"
              />
              <span className="text-sm font-medium">Dossier AI</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={handleNewPresentation}
                className="sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">New Presentation</span>
                <span className="inline sm:hidden ml-1">Create</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Page Title Section */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Dashboard
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Your Presentations</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {presentations.length} {presentations.length === 1 ? 'presentation' : 'presentations'}
              </p>
            </div>

            {/* Search bar */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search presentations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-xs text-destructive hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Info banner for generating presentations */}
        {hasGeneratingPresentation && (
          <div className="mb-6 rounded-lg border border-brand/20 bg-brand/10 p-4">
            <p className="text-sm text-brand">
              Your presentation is being generated. This may take a few minutes. You can refresh the page to check progress.
            </p>
          </div>
        )}

        {filteredPresentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg text-foreground">
                {searchQuery
                  ? 'No presentations found'
                  : 'No presentations yet'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first presentation to get started'}
              </p>
              {!searchQuery && (
                <Button
                  variant="brand"
                  className="mt-6"
                  onClick={() => router.push('/')}
                >
                  Create Presentation
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPresentations.map((presentation) => (
              <PresentationCard
                key={presentation.id}
                presentation={presentation}
                onView={() => router.push(`/presentation/${presentation.id}`)}
                onEdit={() => router.push(`/presentation/${presentation.id}/edit`)}
                onDuplicate={() => handleDuplicate(presentation.id)}
                onDelete={() => handleDelete(presentation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand mx-auto" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
