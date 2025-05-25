"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import QuestionCard from '@/components/assessment/QuestionCard';
import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';

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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-archer-bright-teal mb-4">
          NCLEX Diagnostic Assessment
        </h1>
        <p className="text-archer-light-text max-w-2xl mx-auto">
          Answer the following questions to help us personalize your study plan.
        </p>
      </div>

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
