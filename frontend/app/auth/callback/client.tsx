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
    const draftIdForGeneration = sessionStorage.getItem('draft_id_for_generation');

    if (shouldGenerate === 'true' && draftIdForGeneration) {
      console.log('[AuthCallback] User wants to generate presentation for draft:', draftIdForGeneration);
      sessionStorage.removeItem('generate_after_auth');
      sessionStorage.removeItem('draft_id_for_generation');

      setStatus('Preparing to generate your presentation...');

      // Ensure user exists in database, then redirect to presentation generation
      const ensureUserAndRedirect = async () => {
        try {
          // Import apiClient dynamically to avoid SSR issues
          const { apiClient } = await import('@/lib/api/client');

          // First ensure user exists in database
          await apiClient.ensureUser({
            user_id: user.id,
            email: user.email,
          });

          console.log('[AuthCallback] User ensured, redirecting to presentation generation');

          // Redirect to presentation page with generate=true flag
          // This will trigger the generation flow
          router.replace(`/presentation/${draftIdForGeneration}?generate=true`);
        } catch (err) {
          console.error('[AuthCallback] Failed to ensure user:', err);
          // On error, still try to generate
          router.replace(`/presentation/${draftIdForGeneration}?generate=true`);
        }
      };

      ensureUserAndRedirect();
    } else if (shouldGenerate === 'true' && outline && currentDraft) {
      // Legacy flow for old draft store (keeping for backwards compatibility)
      console.log('[AuthCallback] Starting presentation generation (legacy flow)');
      sessionStorage.removeItem('generate_after_auth');
      const citationStyle = sessionStorage.getItem('citation_style') || 'inline';
      const theme = sessionStorage.getItem('theme') || 'minimal';
      sessionStorage.removeItem('citation_style');
      sessionStorage.removeItem('theme');

      setStatus('Generating your presentation...');

      const generate = async () => {
        try {
          const { apiClient } = await import('@/lib/api/client');

          await apiClient.ensureUser({
            user_id: user.id,
            email: user.email,
          });

          const result = await apiClient.generatePresentation({
            draft_id: currentDraft.id,
            outline,
            citation_style: citationStyle,
            theme: theme,
            user_id: user.id,
          });

          console.log('[AuthCallback] Success, going to presentation');
          router.replace(`/presentation/${result.presentation_id}`);
        } catch (err) {
          console.error('[AuthCallback] Generation failed:', err);
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
