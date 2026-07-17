"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles, Target } from 'lucide-react';

// Helper function to get category display name
const getCategoryDisplayName = (category: string) => {
  const words = category.split('_');
  return words.map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
};

// Helper function to get color based on score (semantic, theme-aware)
const getScoreColor = (score: number) => {
  if (score >= 80) return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30', bar: 'bg-success' };
  if (score >= 60) return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/30', bar: 'bg-amber-500' };
  return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30', bar: 'bg-destructive' };
};

export default function AssessmentResultsPage() {
  const {
    categoryScores,
    overallScore,
    diagnosticCompleted,
    diagnosticAnswers,
    saveDiagnosticResults,
    goToStep
  } = useOnboarding();

  // Redirect to diagnostic page if accessed directly without completing assessment
  useEffect(() => {
    if (!diagnosticCompleted || diagnosticAnswers.length === 0) {
      goToStep(OnboardingStep.DIAGNOSTIC);
    } else {
      // Save diagnostic results
      saveDiagnosticResults().catch(error => {
        console.error('Failed to save diagnostic results:', error);
      });
    }
  }, [diagnosticCompleted, diagnosticAnswers.length, saveDiagnosticResults, goToStep]);

  // Handle continue button click
  const handleContinue = () => {
    goToStep(OnboardingStep.SCHEDULE);
  };

  return (
    <OnboardingLayout>
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
          Your assessment results
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Based on your answers, we&apos;ve mapped out your strengths and the topics worth a little more focus across Physics, Chemistry, Biology and Mathematics.
        </p>
      </motion.div>

      <motion.div
        className="max-w-3xl mx-auto mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Overall score */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Overall readiness</h2>
              <p className="text-muted-foreground max-w-md">
                Your baseline knowledge assessment shows where you stand today — your plan starts from here.
              </p>
            </div>
            <div className="flex items-center justify-center rounded-full h-32 w-32 border-4 border-primary/30 bg-primary/10 shrink-0 shadow-sm">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{Math.round(overallScore)}%</div>
                <div className="text-xs font-medium text-muted-foreground">Readiness</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category scores */}
        <div className="flex items-center gap-2 mb-5">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold text-foreground">Performance by subject</h2>
        </div>
        <div className="space-y-4">
          {categoryScores.map((categoryScore, index) => {
            const { bg, text, border, bar } = getScoreColor(categoryScore.score);
            return (
              <motion.div
                key={categoryScore.category}
                className={`p-5 rounded-2xl border transition-colors ${bg} ${border}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-foreground">
                    {getCategoryDisplayName(categoryScore.category)}
                  </h3>
                  <span className={`font-semibold ${text}`}>
                    {Math.round(categoryScore.score)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${bar} transition-all duration-500`}
                    style={{ width: `${categoryScore.score}%` }}
                  ></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        className="max-w-3xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-10 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-1.5">What happens next?</h3>
            <p className="text-muted-foreground">
              We&apos;ll build a personalized study plan that targets your weaker topics while reinforcing your strengths. The plan adapts as you progress, so it always stays in step with your prep.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 max-w-3xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={() => goToStep(OnboardingStep.ASSESSMENT)}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to assessment
        </Button>
        <Button
          variant="brand"
          size="lg"
          onClick={handleContinue}
          className="shine w-full sm:w-auto"
        >
          Continue to schedule
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </OnboardingLayout>
  );
}
