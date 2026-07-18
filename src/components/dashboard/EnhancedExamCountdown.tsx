"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PartyPopper, AlertTriangle } from 'lucide-react';

interface EnhancedExamCountdownProps {
  examDate: Date | string;
}

interface TimeUnit {
  value: number;
  label: string;
}

const EnhancedExamCountdown: React.FC<EnhancedExamCountdownProps> = ({ examDate }) => {
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([]);
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
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

      setIsUrgent(days <= 7);

      setTimeLeft([
        { value: days, label: days === 1 ? 'Day' : 'Days' },
        { value: hours, label: hours === 1 ? 'Hour' : 'Hours' },
        { value: minutes, label: minutes === 1 ? 'Minute' : 'Minutes' },
        { value: seconds, label: seconds === 1 ? 'Second' : 'Seconds' }
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
        transition={{ duration: 0.5 }}
        className="text-center p-8 rounded-xl border border-border bg-card"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PartyPopper className="h-7 w-7" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Exam Day!</h3>
        <p className="text-muted-foreground">Good luck with your NEET/JEE exam!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Main countdown display */}
      <div className="text-center mb-6">
        <p className="text-muted-foreground text-sm mb-2">
          {formattedDate}
        </p>
        {isUrgent && (
          <div className="inline-flex items-center gap-1.5 text-destructive text-sm font-semibold mb-2">
            <AlertTriangle className="h-4 w-4" />
            Exam Soon!
          </div>
        )}
      </div>

      {/* Time units grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {timeLeft.slice(0, 4).map((unit) => (
          <div
            key={unit.label}
            className={`
              rounded-xl p-3 text-center border border-border shadow-sm
              ${isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground'}
            `}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold mb-1 leading-none">
                {unit.value.toString().padStart(2, '0')}
              </div>
              <div className="text-xs font-medium text-muted-foreground leading-none">
                {unit.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar showing days until exam */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progress to Exam</span>
          <span>{timeLeft[0]?.value || 0} days left</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isUrgent ? 'bg-destructive' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(10, Math.min(100, ((90 - (timeLeft[0]?.value || 0)) / 90) * 100))}%`
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`
          text-center p-4 rounded-lg border
          ${isUrgent
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-primary/30 bg-primary/10 text-primary'
          }
        `}
      >
        <p className="text-sm font-medium">
          {isUrgent
            ? "Final stretch! Stay focused and review your weak areas."
            : "You've got this! Keep up the consistent study routine."
          }
        </p>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedExamCountdown;
