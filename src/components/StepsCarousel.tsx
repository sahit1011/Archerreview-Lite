"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    number: "01",
    title: "Set Your Goal",
    description: "Choose your NCLEX exam date and let us plan backwards"
  },
  {
    number: "02",
    title: "Initial Assessment",
    description: "Complete a diagnostic test to identify your strengths and weaknesses"
  },
  {
    number: "03",
    title: "Customize Schedule",
    description: "Tell us your availability and preferred study times"
  },
  {
    number: "04",
    title: "Start Learning",
    description: "Follow your personalized study plan with AI-powered guidance"
  },
  {
    number: "05",
    title: "Track Progress",
    description: "Monitor your improvement with real-time analytics and adjustments"
  }
];

export default function StepsCarousel() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (isAutoPlaying) {
      const timer = setInterval(() => {
        setDirection(1);
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isAutoPlaying]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentStep((prev) => (prev + newDirection + steps.length) % steps.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center gap-4 mb-8">
        {steps.slice(0, 3).map((step, index) => (
          <button
            key={step.number}
            onClick={() => {
              setDirection(index > currentStep ? 1 : -1);
              setCurrentStep(index);
              setIsAutoPlaying(false);
            }}
            className={`glassmorphic px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 ${
              currentStep === index ? 'ring-2 ring-[#00A99D]' : ''
            }`}
          >
            <div className="text-sm text-white/70 mb-1">Step {step.number}</div>
            <div className="font-medium">{step.title}</div>
          </button>
        ))}
      </div>

      <div className="relative h-[200px] overflow-hidden glassmorphic rounded-xl p-8">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 p-8"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A99D] to-[#42B0E8] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">{steps[currentStep].number}</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">{steps[currentStep].title}</h3>
                <p className="text-lg text-white/70">{steps[currentStep].description}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glassmorphic flex items-center justify-center hover:bg-white/10 transition-colors"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glassmorphic flex items-center justify-center hover:bg-white/10 transition-colors"
          onClick={() => navigate(1)}
        >
          →
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentStep ? 1 : -1);
              setCurrentStep(index);
              setIsAutoPlaying(false);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentStep === index 
                ? 'bg-gradient-to-r from-[#00A99D] to-[#42B0E8] w-8' 
                : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
