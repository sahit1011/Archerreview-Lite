"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagnosticQuestion } from '@/context/OnboardingContext';

interface QuestionCardProps {
  question: DiagnosticQuestion;
  onAnswer: (questionId: number, selectedOption: number, timeSpent: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentIndex: number;
  totalQuestions: number;
}

export default function QuestionCard({
  question,
  onAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
  currentIndex,
  totalQuestions
}: QuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setShowExplanation(false);
    setStartTime(Date.now());
    setTimeSpent(0);
  }, [question.id]);

  // Handle option selection
  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return; // Prevent changing answer after selection

    setSelectedOption(optionIndex);
    const endTime = Date.now();
    const timeSpentInSeconds = Math.round((endTime - startTime) / 1000);
    setTimeSpent(timeSpentInSeconds);

    onAnswer(question.id, optionIndex, timeSpentInSeconds);

    // Show explanation after a short delay
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);
  };

  // Handle next button click
  const handleNext = () => {
    setShowExplanation(false);
    onNext();
  };

  // Calculate progress percentage
  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <motion.div
      className="bg-card rounded-xl shadow-card p-6 w-full border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {question.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <motion.div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedOption === index
                ? selectedOption === question.correctAnswer
                  ? 'border-success bg-success/10'
                  : 'border-destructive bg-destructive/10'
                : selectedOption !== null && index === question.correctAnswer
                ? 'border-success bg-success/10'
                : 'border-border hover:bg-muted'
            }`}
            whileHover={selectedOption === null ? { scale: 1.01 } : {}}
            onClick={() => handleOptionSelect(index)}
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-5 w-5 mr-2 rounded-full border ${
                selectedOption === index
                  ? selectedOption === question.correctAnswer
                    ? 'border-success bg-success'
                    : 'border-destructive bg-destructive'
                  : selectedOption !== null && index === question.correctAnswer
                  ? 'border-success bg-success'
                  : 'border-border'
              } flex items-center justify-center`}>
                {selectedOption === index && (
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {selectedOption !== null && selectedOption !== index && index === question.correctAnswer && (
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`${
                selectedOption === index
                  ? selectedOption === question.correctAnswer
                    ? 'text-success'
                    : 'text-destructive'
                  : selectedOption !== null && index === question.correctAnswer
                  ? 'text-success'
                  : 'text-foreground'
              }`}>
                {option}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            className="bg-muted border border-border rounded-lg p-4 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-medium text-primary mb-2">Explanation</h3>
            <p className="text-muted-foreground text-sm">{question.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={`px-4 py-2 rounded-lg font-medium shadow-button ${
            isFirst
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-secondary text-foreground hover:bg-muted'
          }`}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          className={`px-4 py-2 rounded-lg font-medium shadow-button ${
            selectedOption === null
              ? 'bg-primary/30 text-primary-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </motion.div>
  );
}
