'use client';

import React from 'react';

interface CalendarSkeletonProps {
  view?: 'day' | 'week' | 'month';
}

export default function CalendarSkeleton({ view = 'month' }: CalendarSkeletonProps) {
  // Generate skeleton for day view
  const renderDayViewSkeleton = () => {
    return (
      <div className="animate-pulse">
        {/* Header */}
        <div className="h-12 bg-muted rounded-t-lg mb-4"></div>
        
        {/* Time slots */}
        <div className="space-y-4 px-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-start">
              <div className="w-16 h-6 bg-muted rounded mr-4"></div>
              <div className="flex-1 h-16 bg-secondary rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate skeleton for week view
  const renderWeekViewSkeleton = () => {
    return (
      <div className="animate-pulse">
        {/* Header */}
        <div className="h-12 bg-muted rounded-t-lg mb-4"></div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded"></div>
          ))}
        </div>
        
        {/* Time slots */}
        <div className="space-y-4 px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start">
              <div className="w-16 h-6 bg-muted rounded mr-4"></div>
              <div className="flex-1 grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-12 bg-secondary rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate skeleton for month view
  const renderMonthViewSkeleton = () => {
    return (
      <div className="animate-pulse">
        {/* Header */}
        <div className="h-12 bg-muted rounded-t-lg mb-4"></div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded"></div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-secondary rounded p-1">
              <div className="w-6 h-6 bg-muted rounded-full mb-2"></div>
              <div className="space-y-1">
                <div className="w-full h-4 bg-muted rounded"></div>
                <div className="w-3/4 h-4 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the appropriate skeleton based on the view
  return (
    <div className="rounded-xl border border-border bg-card backdrop-blur-sm overflow-hidden">
      {view === 'day' && renderDayViewSkeleton()}
      {view === 'week' && renderWeekViewSkeleton()}
      {view === 'month' && renderMonthViewSkeleton()}
    </div>
  );
}
