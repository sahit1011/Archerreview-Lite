"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fadeInUp } from '@/utils/animationUtils';

interface Task {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  startTime: string;
  duration: number;
  content?: any;
}

interface EnhancedTaskCardProps {
  task: Task;
  index: number;
  onStatusChange: (taskId: string, newStatus: string) => Promise<any>;
  onTaskClick?: (task: Task) => void;
  userId?: string;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
  task,
  index,
  onStatusChange,
  onTaskClick,
  userId
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const getTaskIcon = (type: string) => {
    const iconClasses = "h-6 w-6";
    switch (type) {
      case 'VIDEO':
        return (
          <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'QUIZ':
        return (
          <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        );
      case 'READING':
        return (
          <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c-1.255 0-2.443.29-3.5.804v-10A7.968 7.968 0 0114.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'PRACTICE':
        return (
          <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'REVIEW':
        return (
          <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Flat, on-system surface. The single restrained accent lives in the icon chip:
  // primary for QUIZ (the actionable type), neutral for everything else.
  const getIconChip = (type: string) =>
    type === 'QUIZ' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground';

  const iconChip = getIconChip(task.type);
  const isClickable = task.type === 'QUIZ' && task.content;

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      await onStatusChange(task._id, 'COMPLETED');
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCardClick = () => {
    if (isClickable && onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay: index * 0.1 }}
      className={`
        relative overflow-hidden rounded-xl border border-border bg-card
        p-4 transition-colors hover:bg-secondary/50 hover:border-primary/30
        ${isClickable ? 'cursor-pointer' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Hairline accent line */}
      <div className="absolute top-0 left-0 w-full h-px bg-border" />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Task Icon */}
          <div
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg ${iconChip}
              flex items-center justify-center
            `}
          >
            {getTaskIcon(task.type)}
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base mb-1 truncate">
              {task.title}
            </h3>
            <p className="text-muted-foreground text-sm mb-2 line-clamp-1">
              {task.type === 'QUIZ' ? `${task.description} • ${task.duration} min` : task.description}
            </p>

            {/* Time and Status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-muted-foreground">
                  {format(new Date(task.startTime), 'h:mm a')}
                </span>
              </div>

              {task.status === 'COMPLETED' && (
                <div className="flex items-center space-x-1 text-success">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Done</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {task.status !== 'COMPLETED' && (
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className={`
              press flex-shrink-0 w-8 h-8 rounded-full
              bg-success/10 text-success hover:bg-success/20 border border-success/30
              flex items-center justify-center transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isCompleting ? (
              <motion.div
                className="w-3 h-3 border-2 border-success border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Progress indicator for quiz tasks */}
      {task.type === 'QUIZ' && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Click to start quiz</span>
            <div className="flex items-center space-x-1 text-primary">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedTaskCard;