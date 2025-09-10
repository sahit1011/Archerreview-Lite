"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fadeIn, bounceIn, pulseAnimation } from '@/utils/animationUtils';

interface EnhancedExamCountdownProps {
  examDate: Date | string;
}

interface TimeUnit {
  value: number;
  label: string;
  color: string;
}

const EnhancedExamCountdown: React.FC<EnhancedExamCountdownProps> = ({ examDate }) => {
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([]);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  // Log component rendering
  console.log('EnhancedExamCountdown rendering');

  useEffect(() => {
    console.log('EnhancedExamCountdown useEffect running');
    const examDateObj = new Date(examDate);
    setFormattedDate(format(examDateObj, 'MMMM d, yyyy'));

    const calculateTimeLeft = () => {
      const now = new Date();
      const timeDiff = examDateObj.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeLeft([]);
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      // Determine urgency and colors
      const urgent = days <= 7;
      setIsUrgent(urgent);

      const getColor = (unit: string) => {
        if (urgent) {
          return unit === 'days' ? 'from-red-500 to-red-600' : 
                 unit === 'hours' ? 'from-orange-500 to-orange-600' :
                 unit === 'minutes' ? 'from-yellow-500 to-yellow-600' :
                 'from-red-400 to-red-500';
        }
        return unit === 'days' ? 'from-indigo-500 to-indigo-600' : 
               unit === 'hours' ? 'from-blue-500 to-blue-600' :
               unit === 'minutes' ? 'from-purple-500 to-purple-600' :
               'from-pink-500 to-pink-600';
      };

      setTimeLeft([
        { value: days, label: days === 1 ? 'Day' : 'Days', color: getColor('days') },
        { value: hours, label: hours === 1 ? 'Hour' : 'Hours', color: getColor('hours') },
        { value: minutes, label: minutes === 1 ? 'Minute' : 'Minutes', color: getColor('minutes') },
        { value: seconds, label: seconds === 1 ? 'Second' : 'Seconds', color: getColor('seconds') }
      ]);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [examDate]);

  if (timeLeft.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center p-8 rounded-xl border border-green-500/30"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-green-600 mb-2">Exam Day!</h3>
        <p className="text-green-700">Good luck with your NCLEX exam!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden"
      onAnimationComplete={() => console.log('EnhancedExamCountdown animation completed')}
    >
      {/* Background particles for urgent countdown */}
      {isUrgent && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-red-400 rounded-full opacity-30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      )}

      {/* Main countdown display */}
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm mb-2">
          {formattedDate}
        </p>
        {isUrgent && (
          <motion.div
            className="text-red-600 text-sm font-semibold mb-2"
            variants={pulseAnimation}
            animate="pulse"
          >
            ⚠️ Exam Soon!
          </motion.div>
        )}
      </div>

      {/* Time units grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {timeLeft.slice(0, 4).map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="relative"
          >
            <div className={`
              bg-gradient-to-br ${unit.color} rounded-xl p-3 text-white shadow-lg
              text-center
            `}>
              {/* Removed glow effect background */}
              
              <motion.div
                key={unit.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center"
              >
                <div className="text-2xl font-bold mb-1 leading-none">
                  {unit.value.toString().padStart(2, '0')}
                </div>
                <div className="text-xs font-medium opacity-90 leading-none">
                  {unit.label}
                </div>
              </motion.div>

              {/* Animated border */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-white/30"
                animate={{
                  borderColor: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar showing days until exam */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress to Exam</span>
          <span>{timeLeft[0]?.value || 0} days left</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${isUrgent ? 'from-red-500 to-red-600' : 'from-indigo-500 to-indigo-600'} rounded-full relative`}
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.max(10, Math.min(100, ((90 - (timeLeft[0]?.value || 0)) / 90) * 100))}%`
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`
          text-center p-4 rounded-lg
          ${isUrgent
            ? 'border border-red-200 text-red-800'
            : 'border border-indigo-200 text-indigo-800'
          }
        `}
      >
        <p className="text-sm font-medium">
          {isUrgent 
            ? "🔥 Final stretch! Stay focused and review your weak areas."
            : "💪 You've got this! Keep up the consistent study routine."
          }
        </p>
      </motion.div>

      {/* Floating success indicators for good progress */}
      {!isUrgent && timeLeft[0]?.value > 30 && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full opacity-60"
              style={{
                top: `${20 + i * 20}%`,
                right: `${10 + i * 10}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
};

export default EnhancedExamCountdown;