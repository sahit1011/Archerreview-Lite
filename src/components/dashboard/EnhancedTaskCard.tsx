"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fadeInUp, hoverScale } from '@/utils/animationUtils';

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

  const getTaskColors = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return {
          bg: 'from-blue-500/20 to-blue-600/20',
          border: 'border-blue-500/30',
          icon: 'bg-blue-100 text-blue-600',
          accent: 'bg-blue-500'
        };
      case 'QUIZ':
        return {
          bg: 'from-purple-500/20 to-purple-600/20',
          border: 'border-purple-500/30',
          icon: 'bg-purple-100 text-purple-600',
          accent: 'bg-purple-500'
        };
      case 'READING':
        return {
          bg: 'from-green-500/20 to-green-600/20',
          border: 'border-green-500/30',
          icon: 'bg-green-100 text-green-600',
          accent: 'bg-green-500'
        };
      case 'PRACTICE':
        return {
          bg: 'from-amber-500/20 to-amber-600/20',
          border: 'border-amber-500/30',
          icon: 'bg-amber-100 text-amber-600',
          accent: 'bg-amber-500'
        };
      case 'REVIEW':
        return {
          bg: 'from-red-500/20 to-red-600/20',
          border: 'border-red-500/30',
          icon: 'bg-red-100 text-red-600',
          accent: 'bg-red-500'
        };
      default:
        return {
          bg: 'from-gray-500/20 to-gray-600/20',
          border: 'border-gray-500/30',
          icon: 'bg-gray-100 text-gray-600',
          accent: 'bg-gray-500'
        };
    }
  };

  const colors = getTaskColors(task.type);
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
      whileHover={hoverScale}
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-sm
        bg-gradient-to-br ${colors.bg} ${colors.border}
        p-4 transition-all duration-300 hover:shadow-lg
        ${isClickable ? 'cursor-pointer' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Accent line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${colors.accent}`} />
      
      {/* Floating particles for completed tasks */}
      {task.status === 'COMPLETED' && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-green-400 rounded-full"
              style={{
                top: `${20 + i * 15}%`,
                right: `${10 + i * 5}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Task Icon */}
          <motion.div
            className={`
              flex-shrink-0 w-10 h-10 rounded-lg ${colors.icon}
              flex items-center justify-center shadow-sm
            `}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {getTaskIcon(task.type)}
          </motion.div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">
              {task.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-1">
              {task.type === 'QUIZ' ? `${task.description} • ${task.duration} min` : task.description}
            </p>
            
            {/* Time and Status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">
                  {format(new Date(task.startTime), 'h:mm a')}
                </span>
              </div>
              
              {task.status === 'COMPLETED' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-1 text-green-600"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Done</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {task.status !== 'COMPLETED' && (
          <motion.button
            onClick={handleComplete}
            disabled={isCompleting}
            className={`
              flex-shrink-0 w-8 h-8 rounded-full
              bg-green-100 text-green-600 hover:bg-green-200
              flex items-center justify-center transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-sm hover:shadow-md
            `}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCompleting ? (
              <motion.div
                className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </motion.button>
        )}
      </div>

      {/* Progress indicator for quiz tasks */}
      {task.type === 'QUIZ' && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Click to start quiz</span>
            <div className="flex items-center space-x-1 text-purple-600">
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