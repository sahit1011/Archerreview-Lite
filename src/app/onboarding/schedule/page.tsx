"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import OnboardingLayout from '@/components/layouts/OnboardingLayout';
import WeeklyCalendar from '@/components/schedule/WeeklyCalendar';
import StudyHoursSlider from '@/components/schedule/StudyHoursSlider';
import StudyTimePreference from '@/components/schedule/StudyTimePreference';
import { useOnboarding } from '@/context/OnboardingContext';
import OnboardingProgressBar from '@/components/onboarding/OnboardingProgressBar';

export default function SchedulePage() {
  const router = useRouter();
  const {
    availableDays,
    studyHoursPerDay,
    preferredStudyTime,
    setAvailableDays,
    setStudyHoursPerDay,
    setPreferredStudyTime,
    goToNextStep,
    goToPreviousStep,
  } = useOnboarding();

  // Handle continue button click
  const handleContinue = () => {
    // Validate that at least one day is selected
    if (availableDays.length === 0) {
      alert('Please select at least one day when you are available to study.');
      return;
    }

    goToNextStep();
  };

  return (
    <OnboardingLayout>
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-5xl font-bold gradient-text mb-6">
          Step 4: Set Your Study Schedule
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 glassmorphic p-4 rounded-xl backdrop-blur-xl">
          Tell us when you're available to study so we can create a personalized plan that fits your schedule.
        </p>
        
        <OnboardingProgressBar currentStep="schedule" />

      </motion.div>

      <motion.div
        className="max-w-2xl mx-auto glassmorphic p-8 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00A99D]/20 to-[#42B0E8]/20 flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 backdrop-blur-sm">
                <svg className="h-5 w-5 text-[#00A99D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Available Days</h2>
            </div>
            <p className="text-white/70 mb-4 ml-[52px]">
              Select the days of the week when you can dedicate time to studying.
            </p>
            <motion.div 
              className="bg-gradient-to-br from-white/10 to-white/5 p-6 rounded-2xl backdrop-blur-md shadow-xl border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <WeeklyCalendar
                selectedDays={availableDays}
                onChange={setAvailableDays}
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00A99D]/20 to-[#42B0E8]/20 flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 backdrop-blur-sm">
                <svg className="h-5 w-5 text-[#00A99D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Study Hours</h2>
            </div>
            <p className="text-white/70 mb-4 ml-[52px]">
              How many hours can you dedicate to studying each day?
            </p>
            <motion.div 
              className="bg-gradient-to-br from-white/10 to-white/5 p-6 rounded-2xl backdrop-blur-md shadow-xl border border-white/10 hover:border-white/20 transition-all duration-300"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <StudyHoursSlider
                value={studyHoursPerDay}
                onChange={setStudyHoursPerDay}
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="group"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00A99D]/20 to-[#42B0E8]/20 flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 backdrop-blur-sm">
                <svg className="h-5 w-5 text-[#00A99D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white/90">Preferred Study Time</h2>
            </div>
            <p className="text-white/70 mb-4 ml-[52px]">
              When do you prefer to study? We'll prioritize scheduling your study sessions during this time.
            </p>
            <motion.div 
              className="bg-gradient-to-br from-white/10 to-white/5 p-6 rounded-2xl backdrop-blur-md shadow-xl border border-white/10 hover:border-white/20 transition-all duration-300"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <StudyTimePreference
                value={preferredStudyTime}
                onChange={setPreferredStudyTime}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center mt-8 max-w-2xl mx-auto">
        <button
          onClick={goToPreviousStep}
          className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-all duration-200 flex items-center gap-2 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00A99D] to-[#42B0E8] text-white font-medium transform hover:translate-y-[-1px] hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          Continue
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </OnboardingLayout>
  );
}
