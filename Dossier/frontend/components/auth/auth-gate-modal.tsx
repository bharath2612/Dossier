'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthComplete: () => void;
}

export function AuthGateModal({ isOpen, onClose, onAuthComplete }: AuthGateModalProps) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      // The page will redirect to Google, then back via callback
      // After callback, the auth state will update and trigger onAuthComplete
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-card"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Brand indicator */}
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
            <div className="h-2 w-2 rounded-full bg-brand" />
          </div>

          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            Sign in to continue
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Sign in with Google to generate your full presentation
          </p>

          {error && (
            <div className="mb-6 rounded-md border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          <p className="mt-6 text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
