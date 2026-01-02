'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface GenerationProgressProps {
  currentStep: number;
  progress: number;
}

export function GenerationProgress({ currentStep, progress }: GenerationProgressProps) {
  const steps: Step[] = [
    {
      id: 'enhance',
      label: 'Enhancing prompt',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'in_progress' : 'pending',
    },
    {
      id: 'research',
      label: 'Conducting research',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'in_progress' : 'pending',
    },
    {
      id: 'outline',
      label: 'Generating outline',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending',
    },
  ];

  return (
    <div className="w-full max-w-2xl space-y-12">
      {/* Progress bar */}
      <div className="space-y-3">
        <div className="h-1 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <p className="text-right font-mono text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-baseline space-x-4"
          >
            {/* Status indicator */}
            <div className="w-16 flex-shrink-0">
              {step.status === 'completed' ? (
                <span className="flex items-center gap-1 font-mono text-xs text-brand">
                  <Check className="h-3 w-3" />
                  Done
                </span>
              ) : step.status === 'in_progress' ? (
                <span className="font-mono text-xs text-foreground">...</span>
              ) : (
                <span className="font-mono text-xs text-muted-foreground">-</span>
              )}
            </div>

            {/* Label */}
            <p
              className={`text-lg ${
                step.status === 'completed' || step.status === 'in_progress'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Note */}
      <div className="border-l-2 border-brand/30 pl-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Searching reputable sources (.edu, .gov, industry publications) for credible research.
        </p>
      </div>
    </div>
  );
}
