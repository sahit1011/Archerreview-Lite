"use client";

import { useOnboarding, OnboardingStep } from '@/context/OnboardingContext';

export default function ProgressIndicator() {
  const { currentStep } = useOnboarding();
  
  // Define the steps and their labels
  const steps = [
    { id: OnboardingStep.WELCOME, label: 'Exam Date' },
    { id: OnboardingStep.DIAGNOSTIC, label: 'Assessment' },
    { id: OnboardingStep.SCHEDULE, label: 'Schedule' },
    { id: OnboardingStep.PREVIEW, label: 'Preview' },
  ];
  
  // Find the current step index
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className="relative">
              {/* Line before the step (except for the first step) */}
              {index > 0 && (
                <div 
                  className={`absolute top-1/2 right-full w-full h-1 -translate-y-1/2 ${
                    index <= currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  style={{ width: 'calc(100% + 4rem)' }}
                ></div>
              )}
              
              {/* Step circle */}
              <div 
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index < currentIndex 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : index === currentIndex
                    ? 'bg-white border-indigo-600 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {index < currentIndex ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
            </div>
            
            {/* Step label */}
            <div className="mt-2 text-xs font-medium text-center">
              <span 
                className={
                  index <= currentIndex ? 'text-indigo-600' : 'text-gray-500'
                }
              >
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
