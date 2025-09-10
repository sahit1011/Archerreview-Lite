"use client";

import { motion } from 'framer-motion';

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

const Step = ({ label, isActive, isCompleted }: { label: string; isActive: boolean; isCompleted: boolean }) => {
  return (
    <div className="flex flex-col items-center group">
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center transform transition-all duration-300 shadow-lg ${
            isActive
              ? 'bg-gradient-to-br from-[#00A99D] to-[#42B0E8] shadow-[#00A99D]/30'
              : isCompleted
              ? 'bg-gradient-to-br from-[#00A99D] to-[#42B0E8] shadow-[#00A99D]/20'
              : 'bg-white/10 shadow-md'
          }`}
        >
          {isCompleted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isActive ? 'bg-white' : 'bg-white/30'}`}></div>
          )}
        </div>
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#42B0E8] border-2 border-gray-800 animate-pulse"></div>
        )}
      </div>
      <span className={`mt-2 text-sm font-medium transition-colors ${isActive || isCompleted ? 'text-white/90' : 'text-white/50'}`}>
        {label}
      </span>
    </div>
  );
};

const Connector = ({ isCompleted }: { isCompleted: boolean }) => {
  return (
    <div className="w-16 md:w-24 flex items-center justify-center">
      <div className="w-full h-1 rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00A99D] to-[#42B0E8]"
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