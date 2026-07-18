"use client";

import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';
import { Button } from '@/components/ui/button';
import { Target, Sparkles, Zap, ArrowLeft, ArrowRight, Clock } from 'lucide-react';

export default function DiagnosticPage() {
  const { goToPreviousStep, goToNextStep, setDiagnosticSkipped, goToStep } = useOnboarding();

  // Handle skip button click
  const handleSkip = () => {
    setDiagnosticSkipped(true);
    goToStep(OnboardingStep.SCHEDULE);
  };

  // Handle start assessment button click
  const handleStartAssessment = () => {
    setDiagnosticSkipped(false);
    goToStep(OnboardingStep.ASSESSMENT);
  };

  const benefits = [
    {
      icon: Target,
      title: 'Identify your strengths and weaknesses',
      description: 'Get a clear picture of which Physics, Chemistry, Biology and Maths topics need more focus.',
    },
    {
      icon: Sparkles,
      title: 'Get a personalized study plan',
      description: "We'll create a custom schedule that adapts to your knowledge level and exam date.",
    },
    {
      icon: Zap,
      title: 'Study more efficiently',
      description: 'Focus your time on the topics that will have the biggest impact on your rank.',
    },
  ];

  return (
    <OnboardingLayout>
      <motion.div
        className="mx-auto mb-8 max-w-2xl text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Step 3 of 5 · Diagnostic
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
          Diagnostic assessment
        </h1>
        <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-muted-foreground shadow-sm">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Optional · about 15–20 min
        </p>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          This quick assessment helps us personalize your NEET / JEE study plan around what you
          already know.
        </p>

        <OnboardingProgressBar currentStep="assessment" />
      </motion.div>

      <motion.div
        className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="border-b border-border px-6 py-4 sm:px-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Why take it
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
            What the diagnostic buys you
          </h2>
        </div>
        {/* Benefit ledger — hairline rows, primary-accent glyphs (no icon tiles) */}
        <ul className="divide-y divide-border">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-4 px-6 py-5 sm:px-8">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 max-w-2xl mx-auto">
        <Button variant="ghost" size="lg" onClick={goToPreviousStep} className="group">
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button variant="brand" size="lg" onClick={handleStartAssessment} className="shine group">
            Start Assessment
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
