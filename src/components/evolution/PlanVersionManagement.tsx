'use client';

import React, { useState, useEffect } from 'react';
import { DocumentDuplicateIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';

interface PlanVersionManagementProps {
  userId: string;
}

interface PlanVersion {
  _id: string;
  versionNumber: number;
  createdAt: Date;
  reason: string;
  description: string;
  changes: {
    type: 'TASK_ADDED' | 'TASK_REMOVED' | 'TASK_MODIFIED' | 'DIFFICULTY_ADJUSTED' | 'SCHEDULE_REBALANCED' | 'REVIEW_ADDED';
    description: string;
    taskId?: string;
    topicId?: string;
    metadata?: Record<string, any>;
  }[];
  metrics: {
    taskCount: number;
    averageDifficulty: number;
    topicCoverage: number;
    reviewFrequency: number;
    workloadBalance: number;
  };
  isActive: boolean;
  createdBy: 'USER' | 'ADAPTATION_AGENT' | 'EVOLUTION_AGENT';
}

const PlanVersionManagement: React.FC<PlanVersionManagementProps> = ({ userId }) => {
  const [planVersions, setPlanVersions] = useState<PlanVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareVersion, setCompareVersion] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState<boolean>(false);

  useEffect(() => {
    const fetchPlanVersions = async () => {
      try {
        setLoading(true);
        // This endpoint doesn't exist yet, but we're designing the UI for it
        const response = await fetch(`/api/evolution/plan-versions?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setPlanVersions(data.planVersions);
          // Set the active version as selected by default
          const activeVersion = data.planVersions.find((v: PlanVersion) => v.isActive);
          if (activeVersion) {
            setSelectedVersion(activeVersion._id);
          }
        } else {
          setError(data.message || 'Failed to fetch plan versions');
        }
      } catch (err) {
        // For now, let's use mock data since the endpoint doesn't exist
        const mockVersions = generateMockPlanVersions();
        setPlanVersions(mockVersions);
        setSelectedVersion(mockVersions[0]._id);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPlanVersions();
    }
  }, [userId]);

  // Generate mock data for UI development
  const generateMockPlanVersions = (): PlanVersion[] => {
    return [
      {
        _id: 'v1',
        versionNumber: 1,
        createdAt: new Date('2023-05-01'),
        reason: 'Initial plan generation',
        description: 'Initial study plan based on diagnostic assessment',
        changes: [],
        metrics: {
          taskCount: 120,
          averageDifficulty: 1.8,
          topicCoverage: 85,
          reviewFrequency: 0.2,
          workloadBalance: 75
        },
        isActive: false,
        createdBy: 'SCHEDULER_AGENT'
      } as PlanVersion,
      {
        _id: 'v2',
        versionNumber: 2,
        createdAt: new Date('2023-05-15'),
        reason: 'Performance-based adaptation',
        description: 'Adjusted difficulty based on quiz performance',
        changes: [
          {
            type: 'DIFFICULTY_ADJUSTED',
            description: 'Increased difficulty for Pharmacology topics',
            topicId: 'topic1',
            metadata: { oldDifficulty: 'MEDIUM', newDifficulty: 'HARD' }
          },
          {
            type: 'SCHEDULE_REBALANCED',
            description: 'Redistributed workload to reduce overloaded days',
            metadata: { affectedDays: 5 }
          }
        ],
        metrics: {
          taskCount: 125,
          averageDifficulty: 2.1,
          topicCoverage: 88,
          reviewFrequency: 0.25,
          workloadBalance: 82
        },
        isActive: false,
        createdBy: 'ADAPTATION_AGENT'
      } as PlanVersion,
      {
        _id: 'v3',
        versionNumber: 3,
        createdAt: new Date('2023-06-01'),
        reason: 'Long-term trend optimization',
        description: 'Optimized plan based on 1-month performance trends',
        changes: [
          {
            type: 'TASK_ADDED',
            description: 'Added remedial content for struggling topics',
            topicId: 'topic2',
            metadata: { count: 3 }
          },
          {
            type: 'REVIEW_ADDED',
            description: 'Increased review frequency for weak areas',
            topicId: 'topic3',
            metadata: { oldFrequency: 0.2, newFrequency: 0.35 }
          }
        ],
        metrics: {
          taskCount: 130,
          averageDifficulty: 2.2,
          topicCoverage: 92,
          reviewFrequency: 0.3,
          workloadBalance: 85
        },
        isActive: true,
        createdBy: 'EVOLUTION_AGENT'
      } as PlanVersion
    ];
  };

  // Get change type icon
  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK_ADDED':
        return (
          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
      case 'TASK_REMOVED':
        return (
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'DIFFICULTY_ADJUSTED':
        return (
          <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'SCHEDULE_REBALANCED':
        return (
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
          </svg>
        );
      case 'REVIEW_ADDED':
        return (
          <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
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

  // Get creator badge color
  const getCreatorBadge = (creator: string) => {
    switch (creator) {
      case 'USER':
        return <span className="bg-archer-bright-teal/20 text-archer-bright-teal text-xs px-2 py-1 rounded-full">User</span>;
      case 'ADAPTATION_AGENT':
        return <span className="bg-blue-900/20 text-blue-400 text-xs px-2 py-1 rounded-full">Adaptation Agent</span>;
      case 'EVOLUTION_AGENT':
        return <span className="bg-indigo-900/20 text-indigo-400 text-xs px-2 py-1 rounded-full">Evolution Agent</span>;
      default:
        return <span className="bg-archer-dark-teal/30 text-archer-light-text text-xs px-2 py-1 rounded-full">System</span>;
    }
  };

  // Handle version activation
  const handleActivateVersion = async (versionId: string) => {
    try {
      // This endpoint doesn't exist yet, but we're designing the UI for it
      const response = await fetch(`/api/evolution/plan-versions/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ versionId, userId }),
      });

      // For now, let's just update the UI
      setPlanVersions(prevVersions =>
        prevVersions.map(v => ({
          ...v,
          isActive: v._id === versionId
        }))
      );
      setSelectedVersion(versionId);
    } catch (err) {
      console.error('Error activating plan version:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Plan Version Management</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-archer-bright-teal border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-archer-light-text">Loading plan versions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-archer-white">Plan Version Management</h2>
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

  const selectedVersionData = planVersions.find(v => v._id === selectedVersion);
  const compareVersionData = planVersions.find(v => v._id === compareVersion);

  return (
    <div className="bg-card-background-lighter rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-archer-white">Plan Version Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCompare(!showCompare)}
            className={`px-3 py-1 rounded-lg text-sm shadow-button ${showCompare ? 'bg-archer-bright-teal text-archer-dark-bg' : 'bg-archer-dark-teal/50 text-archer-light-text/70'}`}
          >
            {showCompare ? 'Hide Compare' : 'Compare Versions'}
          </button>
        </div>
      </div>

      <div className={`grid ${showCompare ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
        {/* Version List */}
        <div className="bg-card-background-dark p-5 rounded-lg shadow-card">
          <h3 className="text-lg font-medium text-archer-white mb-4">Plan Versions</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {planVersions.map((version) => (
              <div
                key={version._id}
                className={`p-4 rounded-lg cursor-pointer transition-all transform hover:-translate-y-1 ${
                  version._id === selectedVersion
                    ? 'bg-archer-bright-teal/20 border border-archer-bright-teal/40'
                    : 'bg-archer-dark-teal/30 hover:bg-archer-dark-teal/50'
                }`}
                onClick={() => {
                  if (showCompare && version._id !== selectedVersion) {
                    setCompareVersion(version._id);
                  } else {
                    setSelectedVersion(version._id);
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DocumentDuplicateIcon className="h-5 w-5 text-archer-bright-teal mr-2" />
                    <span className="font-medium text-archer-white">Version {version.versionNumber}</span>
                  </div>
                  {version.isActive && (
                    <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded-full">Active</span>
                  )}
                </div>
                <div className="mt-2 text-sm text-archer-light-text/80">{version.description}</div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-archer-light-text/70">
                    {new Date(version.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  {getCreatorBadge(version.createdBy)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version Details */}
        {selectedVersionData && (
          <div className="bg-card-background-dark p-5 rounded-lg shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-archer-white">
                {showCompare && compareVersionData
                  ? `Version ${selectedVersionData.versionNumber} vs ${compareVersionData.versionNumber}`
                  : `Version ${selectedVersionData.versionNumber} Details`
                }
              </h3>
              {!selectedVersionData.isActive && !showCompare && (
                <button
                  onClick={() => handleActivateVersion(selectedVersionData._id)}
                  className="flex items-center bg-archer-bright-teal text-archer-dark-bg px-3 py-1 rounded-lg text-sm shadow-button hover:bg-archer-bright-teal/80 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Activate
                </button>
              )}
            </div>

            {showCompare && compareVersionData ? (
              <>
                {/* Compare View */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div key="selected-version" className="p-4 bg-archer-dark-teal/30 rounded-lg">
                    <div key="selected-version-label" className="text-sm text-archer-light-text/80 mb-1">Version {selectedVersionData.versionNumber}</div>
                    <div key="selected-version-desc" className="text-archer-white font-medium">{selectedVersionData.description}</div>
                    <div key="selected-version-date" className="mt-2 text-xs text-archer-light-text/70">
                      {new Date(selectedVersionData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div key="compare-version" className="p-4 bg-archer-dark-teal/30 rounded-lg">
                    <div key="compare-version-label" className="text-sm text-archer-light-text/80 mb-1">Version {compareVersionData.versionNumber}</div>
                    <div key="compare-version-desc" className="text-archer-white font-medium">{compareVersionData.description}</div>
                    <div key="compare-version-date" className="mt-2 text-xs text-archer-light-text/70">
                      {new Date(compareVersionData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Metrics Comparison */}
                <div className="mb-4">
                  <h4 className="text-md font-medium text-archer-white mb-2">Metrics Comparison</h4>
                  <div className="space-y-3">
                    {[
                      { id: "tasks", label: "Tasks", value1: selectedVersionData.metrics.taskCount, value2: compareVersionData.metrics.taskCount },
                      { id: "difficulty", label: "Avg. Difficulty", value1: selectedVersionData.metrics.averageDifficulty.toFixed(1), value2: compareVersionData.metrics.averageDifficulty.toFixed(1) },
                      { id: "coverage", label: "Topic Coverage", value1: `${selectedVersionData.metrics.topicCoverage}%`, value2: `${compareVersionData.metrics.topicCoverage}%` },
                      { id: "workload", label: "Workload Balance", value1: `${selectedVersionData.metrics.workloadBalance}%`, value2: `${compareVersionData.metrics.workloadBalance}%` }
                    ].map((metric) => (
                      <div key={metric.id} className="bg-archer-dark-teal/20 p-3 rounded-lg">
                        <div key={`metric-label-${metric.id}`} className="text-sm font-medium text-archer-white mb-2">{metric.label}</div>
                        <div key={`metric-grid-${metric.id}`} className="grid grid-cols-2 gap-4">
                          <div key={`${metric.id}-v1`}>
                            <div key={`${metric.id}-v1-label`} className="text-xs text-archer-light-text/70 mb-1">Version {selectedVersionData.versionNumber}</div>
                            <div key={`${metric.id}-v1-value`} className="text-lg font-medium text-archer-white">{metric.value1}</div>
                          </div>
                          <div key={`${metric.id}-v2`}>
                            <div key={`${metric.id}-v2-label`} className="text-xs text-archer-light-text/70 mb-1">Version {compareVersionData.versionNumber}</div>
                            <div key={`${metric.id}-v2-value`} className="text-lg font-medium text-archer-white">{metric.value2}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Changes Comparison */}
                <div className="mb-4">
                  <h4 className="text-md font-medium text-archer-white mb-2">Changes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div key="selected-version-changes" className="bg-archer-dark-teal/20 p-3 rounded-lg">
                      <div className="text-xs text-archer-light-text/70 mb-2">Version {selectedVersionData.versionNumber} Changes</div>
                      {selectedVersionData.changes.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {selectedVersionData.changes.map((change, index) => (
                            <div
                              key={`selected-${change.type}-${index}`}
                              className="bg-archer-dark-teal/30 p-2 rounded-lg flex items-start"
                            >
                              <div key={`selected-icon-${index}`} className="flex-shrink-0 mt-1">
                                {getChangeTypeIcon(change.type)}
                              </div>
                              <div key={`selected-content-${index}`} className="ml-2">
                                <div key={`selected-title-${index}`} className="text-xs font-medium text-archer-white">{change.type.split('_').join(' ')}</div>
                                <div key={`selected-desc-${index}`} className="text-xs text-archer-light-text/80">{change.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-archer-light-text/70">No changes</div>
                      )}
                    </div>
                    <div key="compare-version-changes" className="bg-archer-dark-teal/20 p-3 rounded-lg">
                      <div className="text-xs text-archer-light-text/70 mb-2">Version {compareVersionData.versionNumber} Changes</div>
                      {compareVersionData.changes.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                          {compareVersionData.changes.map((change, index) => (
                            <div
                              key={`compare-${change.type}-${index}`}
                              className="bg-archer-dark-teal/30 p-2 rounded-lg flex items-start"
                            >
                              <div key={`compare-icon-${index}`} className="flex-shrink-0 mt-1">
                                {getChangeTypeIcon(change.type)}
                              </div>
                              <div key={`compare-content-${index}`} className="ml-2">
                                <div key={`compare-title-${index}`} className="text-xs font-medium text-archer-white">{change.type.split('_').join(' ')}</div>
                                <div key={`compare-desc-${index}`} className="text-xs text-archer-light-text/80">{change.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-archer-light-text/70">No changes</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Regular View */}
                <div className="mb-4 p-4 bg-archer-dark-teal/30 rounded-lg">
                  <div className="text-sm text-archer-light-text/80 mb-1">Reason for Change</div>
                  <div className="text-archer-white">{selectedVersionData.reason}</div>
                  <div className="mt-3 text-sm text-archer-light-text/80 mb-1">Description</div>
                  <div className="text-archer-white">{selectedVersionData.description}</div>
                  <div className="mt-3 text-sm text-archer-light-text/80 mb-1">Created</div>
                  <div className="text-archer-white flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1 text-archer-light-text/70" />
                    {new Date(selectedVersionData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-md font-medium text-archer-white mb-2">Plan Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "tasks", label: "Tasks", value: selectedVersionData.metrics.taskCount },
                      { id: "difficulty", label: "Avg. Difficulty", value: selectedVersionData.metrics.averageDifficulty.toFixed(1) },
                      { id: "coverage", label: "Topic Coverage", value: `${selectedVersionData.metrics.topicCoverage}%` },
                      { id: "workload", label: "Workload Balance", value: `${selectedVersionData.metrics.workloadBalance}%` }
                    ].map((metric) => (
                      <div key={metric.id} className="bg-archer-dark-teal/20 p-3 rounded-lg">
                        <div key={`regular-metric-label-${metric.id}`} className="text-xs text-archer-light-text/70 mb-1">{metric.label}</div>
                        <div key={`regular-metric-value-${metric.id}`} className="text-lg font-medium text-archer-white">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedVersionData.changes.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-archer-white mb-2">Changes</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {selectedVersionData.changes.map((change, index) => (
                        <div
                          key={`${change.type}-${index}-${change.description.substring(0, 10)}`}
                          className="bg-archer-dark-teal/20 p-3 rounded-lg flex items-start"
                        >
                          <div key={`regular-icon-${index}`} className="flex-shrink-0 mt-1">
                            {getChangeTypeIcon(change.type)}
                          </div>
                          <div key={`regular-content-${index}`} className="ml-3">
                            <div key={`regular-title-${index}`} className="text-sm font-medium text-archer-white">{change.type.split('_').join(' ')}</div>
                            <div key={`regular-desc-${index}`} className="text-sm text-archer-light-text/80">{change.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border-color-dark text-xs text-archer-light-text/60">
        <p>The Evolution Agent maintains a history of your study plan versions, allowing you to track changes and revert to previous versions if needed.</p>
      </div>
    </div>
  );
};

export default PlanVersionManagement;
