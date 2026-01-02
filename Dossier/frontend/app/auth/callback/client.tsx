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

    if (shouldGenerate === 'true' && outline && currentDraft) {
      console.log('[AuthCallback] Starting presentation generation');
      sessionStorage.removeItem('generate_after_auth');
      sessionStorage.removeItem('citation_style');
      
      setStatus('Generating your presentation...');
      
      const generate = async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          
          const response = await fetch(`${API_URL}/api/generate-presentation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              draft_id: currentDraft.id,
              outline,
              citation_style: citationStyle,
              theme: 'minimal',
              user_id: user.id,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate');
          }

          const result = await response.json();
          console.log('[AuthCallback] Success, going to presentation');
          router.replace(`/presentation/${result.presentation_id}`);
        } catch (err) {
          console.error('[AuthCallback] Generation failed:', err);
          router.replace('/?error=generation_failed');
        }
      };

      generate();
    } else {
      console.log('[AuthCallback] No generation needed, going to dashboard');
      router.replace('/dashboard');
    }
  }, [user, loading, _hasHydrated, outline, currentDraft, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent" />
        <p className="text-white">{status}</p>
      </div>
    </div>
  );
}
