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
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-5xl font-bold gradient-text mb-6">
          NCLEX Diagnostic Assessment
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 glassmorphic p-4 rounded-xl backdrop-blur-xl">
          Answer the following questions to help us personalize your study plan.
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