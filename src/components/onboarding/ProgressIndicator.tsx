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
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="relative flex items-center justify-between">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-white/5 rounded-2xl backdrop-blur-xl"></div>
        
        {/* Progress line background */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 transform -translate-y-1/2"></div>
        
        {/* Active progress line */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-[#00A99D] to-[#42B0E8] transform -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, index) => (
          <div key={step.id} className="relative flex flex-col items-center px-4 py-6 z-10">
            <div className="relative">
              {/* Glow effect for active step */}
              {index === currentIndex && (
                <div className="absolute -inset-4 bg-[#42B0E8] opacity-20 blur-xl rounded-full"></div>
              )}
              
              {/* Step circle with animations */}
              <div 
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 ${
                  index < currentIndex 
                    ? 'bg-gradient-to-br from-[#00A99D] to-[#42B0E8] text-white shadow-lg shadow-[#00A99D]/20' 
                    : index === currentIndex
                    ? 'bg-gradient-to-br from-[#00A99D] to-[#42B0E8] text-white ring-2 ring-[#42B0E8]/30 shadow-lg shadow-[#00A99D]/20'
                    : 'bg-white/10 text-white/60 backdrop-blur-sm hover:bg-white/20'
                }`}
              >
                {index < currentIndex ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <>
                    <span className="text-base font-semibold">{index + 1}</span>
                    {index === currentIndex && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#42B0E8] border-2 border-white animate-pulse"></div>
                    )}
                  </>
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
