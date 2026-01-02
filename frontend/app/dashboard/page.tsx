'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDraftStore } from '@/store/draft';
import { PresentationCard } from '@/components/dashboard/presentation-card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import type { Presentation } from '@/types/presentation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { clearDraft } = useDraftStore();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchPresentations = useCallback(async (showLoading = true) => {
    if (!user?.id) return;
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/presentations?user_id=${user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch presentations');
      }

      const data = await response.json();
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

  // Initial fetch on mount - NO POLLING
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/presentations/${id}?user_id=${user?.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete presentation');
      }

      setPresentations((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting presentation:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete presentation');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/presentations/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate presentation');
      }

      const data = await response.json();
      setPresentations((prev) => [data.presentation, ...prev]);
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
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={handleNewPresentation}
              >
                <Plus className="h-4 w-4" />
                New Presentation
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
