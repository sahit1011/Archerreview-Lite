"use client";

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface OnboardingProgressBarProps {
  currentStep: 'account' | 'examDate' | 'assessment' | 'schedule' | 'preview';
}

const steps = [
  { id: 'account', label: 'Account' },
  { id: 'examDate', label: 'Exam Date' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'preview', label: 'Preview' },
];

const Step = ({ label, isActive, isCompleted, index }: { label: string; isActive: boolean; isCompleted: boolean; index: number }) => {
  return (
    <div className="flex flex-col items-center group">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors duration-300 ${
          isActive
            ? 'border-primary bg-primary text-primary-foreground'
            : isCompleted
            ? 'border-primary/30 bg-primary/[0.06] text-primary'
            : 'border-border bg-secondary/40 text-muted-foreground'
        }`}
      >
        {isCompleted ? (
          <Check className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <span className="font-mono text-xs">{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>
      <span
        className={`mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
          isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  );
};

const Connector = ({ isCompleted }: { isCompleted: boolean }) => {
  return (
    <div className="mt-[22px] flex w-10 items-center justify-center md:w-16">
      <div className="h-px w-full bg-border">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: isCompleted ? '100%' : '0%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        ></motion.div>
      </div>
    </div>
  );
};

export default function OnboardingProgressBar({ currentStep }: OnboardingProgressBarProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="flex justify-center items-start mt-8 mb-12">
      <div className="flex items-start">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <div className="flex items-start">
              <Step
                label={step.label}
                index={index}
                isActive={index === currentIndex}
                isCompleted={index < currentIndex}
              />
              {index < steps.length - 1 && (
                <Connector isCompleted={index < currentIndex} />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}