'use client';

import React, { useState, useEffect } from 'react';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface PlanReviewOptimizationProps {
  userId: string;
}

interface PlanReview {
  _id: string;
  reviewDate: Date;
  nextReviewDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED';
  optimizationSuggestions: {
    type: 'DIFFICULTY_ADJUSTMENT' | 'CONTENT_ADDITION' | 'SCHEDULE_REBALANCE' | 'REVIEW_FREQUENCY' | 'TOPIC_FOCUS';
    description: string;
    reason: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    approved: boolean;
    applied: boolean;
  }[];
  metrics: {
    performanceImprovement: number;
    timeOptimization: number;
    topicCoverageIncrease: number;
    readinessBoost: number;
  };
  summary: string;
}

const PlanReviewOptimization: React.FC<PlanReviewOptimizationProps> = ({ userId }) => {
  const [planReviews, setPlanReviews] = useState<PlanReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanReviews = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        console.log('Fetching plan reviews for userId:', userId || 'No user ID provided');

        // Check if userId is available
        if (!userId) {
          console.warn('No userId provided, using mock data');
          const mockReviews = generateMockPlanReviews();
          setPlanReviews(mockReviews);
          if (mockReviews.length > 0) {
            setSelectedReview(mockReviews[0]._id);
          }
          setLoading(false);
          return;
        }

        try {
          // Make API call to fetch plan reviews
          console.log(`Making API call to /api/evolution/plan-reviews?userId=${userId}`);
          const response = await fetch(`/api/evolution/plan-reviews?userId=${userId}`);
          console.log('API response status:', response.status);

          if (!response.ok) {
            console.warn(`API returned status ${response.status}`);
            throw new Error(`API returned status ${response.status}`);
          }

          const data = await response.json();
          console.log('API response data:', data);

          if (data.success && Array.isArray(data.planReviews)) {
            console.log('Received plan reviews from API:', data.planReviews);
            setPlanReviews(data.planReviews);
            if (data.planReviews.length > 0) {
              setSelectedReview(data.planReviews[0]._id);
            }
          } else {
            // If API call fails, use mock data as fallback
            console.warn('API call failed, using mock data:', data.message);
            const mockReviews = generateMockPlanReviews();
            setPlanReviews(mockReviews);
            if (mockReviews.length > 0) {
              setSelectedReview(mockReviews[0]._id);
            }
          }
        } catch (apiError) {
          console.error('API call error:', apiError);
          // Use mock data as fallback on error
          console.log('Using mock data as fallback due to API error');
          const mockReviews = generateMockPlanReviews();
          setPlanReviews(mockReviews);
          if (mockReviews.length > 0) {
            setSelectedReview(mockReviews[0]._id);
          }
        }
      } catch (err) {
        console.error('Error in fetchPlanReviews:', err);
        // Use mock data as fallback on error
        const mockReviews = generateMockPlanReviews();
        setPlanReviews(mockReviews);
        if (mockReviews.length > 0) {
          setSelectedReview(mockReviews[0]._id);
        }
      } finally {
        setLoading(false);
      }
    };

    // Always fetch data, even if userId is empty - will use mock data as fallback
    fetchPlanReviews();
  }, [userId]);

  // Generate mock data for UI development
  const generateMockPlanReviews = (): PlanReview[] => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    return [
      {
        _id: 'review1',
        reviewDate: today,
        nextReviewDate: nextMonth,
        status: 'IN_PROGRESS',
        optimizationSuggestions: [
          {
            type: 'DIFFICULTY_ADJUSTMENT',
            description: 'Increase difficulty for Pharmacology topics',
            reason: 'Performance has consistently exceeded targets in this area',
            impact: 'MEDIUM',
            approved: false,
            applied: false
          },
          {
            type: 'CONTENT_ADDITION',
            description: 'Add more practice questions for Psychosocial Integrity',
            reason: 'Performance is below target in this area',
            impact: 'HIGH',
            approved: false,
            applied: false
          },
          {
            type: 'SCHEDULE_REBALANCE',
            description: 'Redistribute workload to reduce overloaded days',
            reason: 'Several days have more than 4 hours of scheduled tasks',
            impact: 'MEDIUM',
            approved: false,
            applied: false
          }
        ],
        metrics: {
          performanceImprovement: 8,
          timeOptimization: 15,
          topicCoverageIncrease: 5,
          readinessBoost: 7
        },
        summary: 'This monthly review identified several opportunities for optimization. Implementing these changes could improve your readiness score by approximately 7% while making your study schedule more balanced and effective.'
      },
      {
        _id: 'review2',
        reviewDate: lastMonth,
        nextReviewDate: today,
        status: 'COMPLETED',
        optimizationSuggestions: [
          {
            type: 'REVIEW_FREQUENCY',
            description: 'Increase review frequency for Management of Care',
            reason: 'Retention metrics show decline in this area',
            impact: 'HIGH',
            approved: true,
            applied: true
          },
          {
            type: 'TOPIC_FOCUS',
            description: 'Allocate more time to Physiological Adaptation',
            reason: 'This is a high-value topic with below-average performance',
            impact: 'HIGH',
            approved: true,
            applied: true
          },
          {
            type: 'DIFFICULTY_ADJUSTMENT',
            description: 'Decrease difficulty for Health Promotion temporarily',
            reason: 'Recent performance has declined significantly',
            impact: 'MEDIUM',
            approved: false,
            applied: false
          }
        ],
        metrics: {
          performanceImprovement: 12,
          timeOptimization: 10,
          topicCoverageIncrease: 8,
          readinessBoost: 9
        },
        summary: 'The previous monthly review resulted in significant improvements to your study plan. The implemented changes have contributed to a 12% increase in performance in the targeted areas.'
      }
    ];
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded-full">Completed</span>;
      case 'IN_PROGRESS':
        return <span className="bg-blue-900/20 text-blue-400 text-xs px-2 py-1 rounded-full">In Progress</span>;
      case 'PENDING':
        return <span className="bg-amber-900/20 text-amber-400 text-xs px-2 py-1 rounded-full">Pending</span>;
      case 'SCHEDULED':
        return <span className="bg-indigo-900/20 text-indigo-400 text-xs px-2 py-1 rounded-full">Scheduled</span>;
      default:
        return <span className="bg-archer-dark-teal/30 text-archer-light-text text-xs px-2 py-1 rounded-full">{status}</span>;
    }
  };

  // Get impact badge
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded-full">High Impact</span>;
      case 'MEDIUM':
        return <span className="bg-blue-900/20 text-blue-400 text-xs px-2 py-1 rounded-full">Medium Impact</span>;
      case 'LOW':
        return <span className="bg-archer-dark-teal/30 text-archer-light-text text-xs px-2 py-1 rounded-full">Low Impact</span>;
      default:
        return null;
    }
  };

  // Get suggestion type icon
  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'DIFFICULTY_ADJUSTMENT':
        return (
          <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'CONTENT_ADDITION':
        return (
          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
      case 'SCHEDULE_REBALANCE':
        return (
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
          </svg>
        );
      case 'REVIEW_FREQUENCY':
        return (
          <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        );
      case 'TOPIC_FOCUS':
        return (
          <svg className="h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-archer-light-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Handle suggestion approval
  const handleSuggestionApproval = async (reviewId: string, suggestionIndex: number, approve: boolean) => {
    try {
      // This endpoint doesn't exist yet, but we're designing the UI for it
      const response = await fetch(`/api/evolution/plan-reviews/approve-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          suggestionIndex,
          approve,
          userId
        }),
      });

      // For now, let's just update the UI
      setPlanReviews(prevReviews =>
        prevReviews.map(review => {
          if (review._id === reviewId) {
            const updatedSuggestions = [...review.optimizationSuggestions];
            updatedSuggestions[suggestionIndex] = {
              ...updatedSuggestions[suggestionIndex],
              approved: approve
            };
            return {
              ...review,
              optimizationSuggestions: updatedSuggestions
            };
          }
          return review;
        })
      );
    } catch (err) {
      console.error('Error approving suggestion:', err);
    }
  };

  // Handle apply all approved suggestions
  const handleApplyApproved = async (reviewId: string) => {
    try {
      // This endpoint doesn't exist yet, but we're designing the UI for it
      const response = await fetch(`/api/evolution/plan-reviews/apply-approved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          userId
        }),
      });

      // For now, let's just update the UI
      setPlanReviews(prevReviews =>
        prevReviews.map(review => {
          if (review._id === reviewId) {
            const updatedSuggestions = review.optimizationSuggestions.map(suggestion => ({
              ...suggestion,
              applied: suggestion.approved ? true : suggestion.applied
            }));
            return {
              ...review,
              optimizationSuggestions: updatedSuggestions,
              status: 'COMPLETED'
            };
          }
          return review;
        })
      );
    } catch (err) {
      console.error('Error applying suggestions:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Plan Review & Optimization</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-archer-light-text">Loading plan reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Plan Review & Optimization</h2>
        </div>
        <div className="p-4 bg-red-900/20 text-red-400 rounded-lg shadow-button border border-red-900/30">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (planReviews.length === 0) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Plan Review & Optimization</h2>
        </div>
        <div className="p-4 bg-blue-900/20 text-blue-400 rounded-lg shadow-button border border-blue-900/30">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <p>No plan reviews scheduled yet. The Evolution Agent will automatically schedule periodic reviews of your study plan.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedReviewData = planReviews.find(r => r._id === selectedReview);

  return (
    <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-archer-white">Plan Review & Optimization</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {/* Trigger manual review */}}
            className="px-3 py-1 rounded-lg text-sm shadow-button bg-archer-dark-teal/50 text-archer-light-text/70 hover:bg-archer-dark-teal/70 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 inline mr-1" />
            Request Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Review List */}
        <div className="md:col-span-1 bg-card-background-dark p-5 rounded-lg shadow-card">
          <h3 className="text-lg font-medium text-archer-white mb-4">Review History</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {planReviews.map((review) => (
              <div
                key={review._id}
                className={`p-4 rounded-lg cursor-pointer transition-all transform hover:-translate-y-1 ${
                  review._id === selectedReview
                    ? 'bg-archer-bright-teal/20 border border-archer-bright-teal/40'
                    : 'bg-archer-dark-teal/30 hover:bg-archer-dark-teal/50'
                }`}
                onClick={() => setSelectedReview(review._id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-archer-bright-teal mr-2" />
                    <span className="font-medium text-archer-white">
                      {new Date(review.reviewDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {getStatusBadge(review.status)}
                </div>
                <div className="mt-2 text-sm text-archer-light-text/80">
                  {review.optimizationSuggestions.length} suggestions
                </div>
                <div className="mt-2 text-xs text-archer-light-text/70">
                  Next review: {new Date(review.nextReviewDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Details */}
        {selectedReviewData && (
          <div className="md:col-span-2 bg-card-background-dark p-5 rounded-lg shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-archer-white">
                Review from {new Date(selectedReviewData.reviewDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              {selectedReviewData.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleApplyApproved(selectedReviewData._id)}
                  className="flex items-center bg-archer-bright-teal text-archer-dark-bg px-3 py-1 rounded-lg text-sm shadow-button hover:bg-archer-bright-teal/80 transition-colors"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Apply Approved
                </button>
              )}
            </div>

            <div className="mb-4 p-4 bg-archer-dark-teal/30 rounded-lg">
              <div className="text-archer-white">{selectedReviewData.summary}</div>
            </div>

            <div className="mb-4">
              <h4 className="text-md font-medium text-archer-white mb-2">Expected Improvements</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-archer-dark-teal/20 p-3 rounded-lg">
                  <div className="text-xs text-archer-light-text/70 mb-1">Performance</div>
                  <div className="text-lg font-medium text-green-400">+{selectedReviewData.metrics.performanceImprovement}%</div>
                </div>
                <div className="bg-archer-dark-teal/20 p-3 rounded-lg">
                  <div className="text-xs text-archer-light-text/70 mb-1">Time Saved</div>
                  <div className="text-lg font-medium text-blue-400">{selectedReviewData.metrics.timeOptimization}%</div>
                </div>
                <div className="bg-archer-dark-teal/20 p-3 rounded-lg">
                  <div className="text-xs text-archer-light-text/70 mb-1">Topic Coverage</div>
                  <div className="text-lg font-medium text-indigo-400">+{selectedReviewData.metrics.topicCoverageIncrease}%</div>
                </div>
                <div className="bg-archer-dark-teal/20 p-3 rounded-lg">
                  <div className="text-xs text-archer-light-text/70 mb-1">Readiness Boost</div>
                  <div className="text-lg font-medium text-amber-400">+{selectedReviewData.metrics.readinessBoost}%</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-archer-white mb-2">Optimization Suggestions</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {selectedReviewData.optimizationSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-archer-dark-teal/20 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {getSuggestionTypeIcon(suggestion.type)}
                      </div>
                      <div className="ml-3 flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-archer-white">{suggestion.description}</div>
                            <div className="text-xs text-archer-light-text/80 mt-1">{suggestion.reason}</div>
                          </div>
                          <div>
                            {getImpactBadge(suggestion.impact)}
                          </div>
                        </div>

                        {selectedReviewData.status === 'IN_PROGRESS' && !suggestion.applied && (
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => handleSuggestionApproval(selectedReviewData._id, index, true)}
                              className={`px-3 py-1 rounded text-xs flex items-center ${
                                suggestion.approved
                                  ? 'bg-green-900/30 text-green-400 border border-green-900/40'
                                  : 'bg-archer-dark-teal/30 text-archer-light-text hover:bg-green-900/20 hover:text-green-400'
                              }`}
                            >
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleSuggestionApproval(selectedReviewData._id, index, false)}
                              className={`px-3 py-1 rounded text-xs flex items-center ${
                                !suggestion.approved
                                  ? 'bg-red-900/30 text-red-400 border border-red-900/40'
                                  : 'bg-archer-dark-teal/30 text-archer-light-text hover:bg-red-900/20 hover:text-red-400'
                              }`}
                            >
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              Decline
                            </button>
                          </div>
                        )}

                        {suggestion.applied && (
                          <div className="mt-2 text-xs text-green-400 flex items-center">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Applied to plan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border-color-dark text-xs text-archer-light-text/60">
        <p>The Evolution Agent periodically reviews your study plan and suggests optimizations based on your performance and progress.</p>
      </div>
    </div>
  );
};

export default PlanReviewOptimization;
