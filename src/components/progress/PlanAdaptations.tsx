'use client';

import { useState } from 'react';

interface Adaptation {
  _id: string;
  type: 'RESCHEDULE' | 'DIFFICULTY_ADJUSTMENT' | 'CONTENT_ADDITION' | 'PLAN_REBALANCE' | 'REMEDIAL_CONTENT';
  description: string;
  reason: string;
  date: string;
  topicId?: string;
  topicName?: string;
  taskId?: string;
  taskTitle?: string;
}

interface PlanAdaptationsProps {
  adaptations: Adaptation[];
}

export default function PlanAdaptations({ adaptations }: PlanAdaptationsProps) {
  const [filter, setFilter] = useState<string | null>(null);

  // Get adaptation type display name
  const getAdaptationTypeName = (type: string) => {
    switch (type) {
      case 'RESCHEDULE':
        return 'Task Rescheduled';
      case 'DIFFICULTY_ADJUSTMENT':
        return 'Difficulty Adjusted';
      case 'CONTENT_ADDITION':
        return 'Content Added';
      case 'PLAN_REBALANCE':
        return 'Plan Rebalanced';
      case 'REMEDIAL_CONTENT':
        return 'Remedial Content Added';
      default:
        return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    }
  };

  // Get adaptation type color
  const getAdaptationTypeColor = (type: string) => {
    switch (type) {
      case 'RESCHEDULE':
        return 'bg-blue-100 text-blue-600';
      case 'DIFFICULTY_ADJUSTMENT':
        return 'bg-indigo-100 text-indigo-600';
      case 'CONTENT_ADDITION':
        return 'bg-teal-100 text-teal-600';
      case 'PLAN_REBALANCE':
        return 'bg-amber-100 text-amber-600';
      case 'REMEDIAL_CONTENT':
        return 'bg-blue-100 text-archer-light-blue';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Get adaptation icon
  const getAdaptationIcon = (type: string) => {
    switch (type) {
      case 'RESCHEDULE':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'DIFFICULTY_ADJUSTMENT':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        );
      case 'CONTENT_ADDITION':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'PLAN_REBALANCE':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'REMEDIAL_CONTENT':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get filtered adaptations
  const filteredAdaptations = filter
    ? adaptations.filter(adaptation => adaptation.type === filter)
    : adaptations;

  // Get unique adaptation types
  const adaptationTypes = Array.from(new Set(adaptations.map(a => a.type)));

  return (
    <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-archer-dark-text">Plan Adaptations</h2>

        <div className="flex space-x-2">
          <button
            className={`px-3 py-2 ${!filter ? 'bg-archer-bright-teal text-white' : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'} rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm`}
            onClick={() => setFilter(null)}
          >
            All
          </button>

          {adaptationTypes.map(type => (
            <button
              key={type}
              className={`px-3 py-2 ${filter === type ? 'bg-archer-bright-teal text-white' : 'bg-light-bg-secondary text-archer-dark-text hover:bg-light-bg-gradient-end'} rounded-lg font-medium shadow-button hover:shadow-card-hover transition-all hover:-translate-y-1 text-sm`}
              onClick={() => setFilter(type)}
            >
              {getAdaptationTypeName(type)}
            </button>
          ))}
        </div>
      </div>

      {filteredAdaptations.length > 0 ? (
        <div className="space-y-4">
          {filteredAdaptations.map(adaptation => (
            <div key={adaptation._id} className="bg-card-background-light rounded-lg p-5 shadow-card hover:shadow-card-hover transition-all border border-border-color-light">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1 w-10 h-10 rounded-full bg-light-bg-secondary flex items-center justify-center shadow-button">
                  {getAdaptationIcon(adaptation.type)}
                </div>

                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`text-xs font-medium px-3 py-1 rounded-lg shadow-button ${getAdaptationTypeColor(adaptation.type)}`}>
                        {getAdaptationTypeName(adaptation.type)}
                      </span>
                      <span className="ml-3 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                        {new Date(adaptation.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-archer-dark-text">{adaptation.description}</p>

                  <div className="mt-3 text-xs text-archer-dark-text/80 bg-light-bg-secondary p-3 rounded-lg">
                    <span className="font-medium text-archer-bright-teal">Reason:</span> {adaptation.reason}

                    {adaptation.topicName && (
                      <div className="mt-2">
                        <span className="font-medium text-archer-bright-teal">Topic:</span> {adaptation.topicName}
                      </div>
                    )}

                    {adaptation.taskTitle && (
                      <div className="mt-2">
                        <span className="font-medium text-archer-bright-teal">Task:</span> {adaptation.taskTitle}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-light-bg-secondary rounded-lg shadow-card border border-border-color-light">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4 shadow-button">
            <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-archer-dark-text">No adaptations yet</h3>
          <p className="mt-2 text-sm text-archer-dark-text/80 max-w-md mx-auto">
            Your study plan will adapt automatically as you progress through your studies.
          </p>
        </div>
      )}
    </div>
  );
}
