'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDraftStore } from '@/store/draft';

export function AuthCallbackClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('Checking authentication...');
  const { outline, currentDraft, _hasHydrated } = useDraftStore();

  useEffect(() => {
    // Wait for auth to load
    if (loading) {
      return;
    }

    // If no user after loading, something went wrong
    if (!user) {
      console.log('[AuthCallback] No user found after auth, redirecting home');
      router.replace('/?error=auth_failed');
      return;
    }

    console.log('[AuthCallback] User authenticated:', user.email);

    // Wait for store to hydrate
    if (!_hasHydrated) {
      return;
    }

    // Check if we need to generate a presentation
    const shouldGenerate = sessionStorage.getItem('generate_after_auth');
    const citationStyle = sessionStorage.getItem('citation_style') || 'inline';
    const theme = sessionStorage.getItem('theme') || 'minimal';

    if (shouldGenerate === 'true' && outline && currentDraft) {
      console.log('[AuthCallback] Starting presentation generation');
      sessionStorage.removeItem('generate_after_auth');
      sessionStorage.removeItem('citation_style');
      sessionStorage.removeItem('theme');
      
      setStatus('Generating your presentation...');
      
      const generate = async () => {
        try {
          // Import apiClient dynamically to avoid SSR issues
          const { apiClient } = await import('@/lib/api/client');
          
          // First ensure user exists in database
          await apiClient.ensureUser({
            user_id: user.id,
            email: user.email,
          });

          // Generate presentation
          const result = await apiClient.generatePresentation({
            draft_id: currentDraft.id,
            outline,
            citation_style: citationStyle,
            theme: theme,
            user_id: user.id,
          });

          console.log('[AuthCallback] Success, going to presentation');
          
          // Redirect to presentation page which will show generating status
          router.replace(`/presentation/${result.presentation_id}`);
        } catch (err) {
          console.error('[AuthCallback] Generation failed:', err);
          // On error, still go to dashboard where they can retry
          router.replace('/dashboard?error=generation_failed');
        }
      };

      generate();
    } else {
      console.log('[AuthCallback] No generation needed, going to dashboard');
      router.replace('/dashboard');
    }
  }, [user, loading, _hasHydrated, outline, currentDraft, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background grid-pattern">
      <div className="text-center">
        <div className="mb-4 h-10 w-10 mx-auto animate-spin rounded-full border-2 border-border border-t-brand" />
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
