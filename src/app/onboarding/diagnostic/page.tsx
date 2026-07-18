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
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Step 3 of 5</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
          Diagnostic Assessment
        </h1>
        <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
          <Clock className="h-4 w-4 text-primary" />
          Optional · takes about 15–20 minutes
        </p>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          This quick assessment helps us personalize your NEET / JEE study plan around what you already know.
        </p>

        <OnboardingProgressBar currentStep="assessment" />
      </motion.div>

      <motion.div
        className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-8 shadow-lg shadow-primary/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Why take the assessment?</h2>
        <ul className="space-y-6">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mr-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
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
