"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import QuestionCard from '@/components/assessment/QuestionCard';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';

export default function AssessmentPage() {
  const {
    currentQuestionIndex,
    diagnosticQuestions,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    goToStep
  } = useOnboarding();

  // Redirect to diagnostic page if accessed directly
  useEffect(() => {
    if (diagnosticQuestions.length === 0) {
      goToStep(OnboardingStep.DIAGNOSTIC);
    }
  }, [diagnosticQuestions.length, goToStep]);

  // Get current question
  const currentQuestion = diagnosticQuestions[currentQuestionIndex];

  // Check if this is the first or last question
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === diagnosticQuestions.length - 1;

  return (
    <OnboardingLayout>
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
          Diagnostic Assessment
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Answer a few questions across Physics, Chemistry, Biology &amp; Mathematics so we can build a study plan tailored to your NEET / JEE goals.
        </p>

        <OnboardingProgressBar currentStep="assessment" />

      </motion.div>

      <AnimatePresence mode="wait">
        {currentQuestion && (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={answerQuestion}
            onNext={goToNextQuestion}
            onPrevious={goToPreviousQuestion}
            isFirst={isFirstQuestion}
            isLast={isLastQuestion}
            currentIndex={currentQuestionIndex}
            totalQuestions={diagnosticQuestions.length}
          />
        )}
      </AnimatePresence>
    </OnboardingLayout>
  );
}