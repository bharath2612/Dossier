'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Layers, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useOutlineGenerationStore } from '@/store/outline-generation';
import { AuthGateModal } from '@/components/auth/auth-gate-modal';

interface GenerateCTAProps {
  slideCount: number;
  draftId: string | null;
}

export function GenerateCTA({ slideCount, draftId }: GenerateCTAProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const store = useOutlineGenerationStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Estimate read time (roughly 2 min per 3 slides)
  const estimatedMinutes = Math.max(1, Math.ceil((slideCount / 3) * 2));

  // Validate outline before proceeding
  const validationErrors = store.validateOutline();
  const isValid = validationErrors.length === 0;

  const handleGenerate = async () => {
    if (!isValid) {
      store.setError(validationErrors[0]);
      return;
    }

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Navigate to presentation page
    setIsNavigating(true);
    if (draftId) {
      router.push(`/presentation/${draftId}?generate=true`);
    }
  };

  // Handle auth success
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (draftId) {
      router.push(`/presentation/${draftId}?generate=true`);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="w-full max-w-3xl mx-auto mt-8 mb-12"
      >
        <div className="rounded-xl border border-border bg-card p-6">
          {/* Validation Errors */}
          <AnimatePresence>
            {!isValid && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/10"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-500">
                    <p className="font-medium">Please fix the following:</p>
                    <ul className="mt-1 list-disc list-inside">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>{slideCount} slides</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>~{estimatedMinutes} min read</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={!isValid || authLoading || isNavigating}
              className={cn(
                'flex items-center gap-3 px-8 py-3 rounded-lg',
                'bg-brand text-brand-foreground font-medium',
                'hover:bg-[#0f6640] transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shadow-lg shadow-brand/20'
              )}
            >
              {isNavigating ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-brand-foreground/30 border-t-brand-foreground animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  Generate Presentation
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            {user
              ? 'Your presentation will be saved to your account'
              : 'Sign in required to generate and save presentations'}
          </p>
        </div>
      </motion.div>

      {/* Auth Modal */}
      <AuthGateModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthComplete={handleAuthSuccess}
      />
    </>
  );
}

export default GenerateCTA;
