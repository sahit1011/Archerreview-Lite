'use client';

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const DemoMonitorSummary: React.FC = () => {
  // Mock data
  const mockData = {
    readinessScore: 68,
    completionRate: 65,
    daysUntilExam: 45,
    alertCount: 4,
    keyInsight: "Your performance in Pediatrics is below target. Consider allocating more study time to this area."
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Monitor Summary</h2>
        <span className="text-sm text-gray-500">Updated 2 hours ago</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="text-xs text-indigo-600 mb-1">Readiness Score</div>
          <div className="text-2xl font-bold text-gray-800">{mockData.readinessScore}%</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="text-xs text-indigo-600 mb-1">Completion Rate</div>
          <div className="text-2xl font-bold text-gray-800">{mockData.completionRate}%</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="text-xs text-indigo-600 mb-1">Exam Countdown</div>
          <div className="text-2xl font-bold text-gray-800">{mockData.daysUntilExam} days</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="text-xs text-indigo-600 mb-1">Alerts</div>
          <div className="text-2xl font-bold text-gray-800">{mockData.alertCount}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Key Insight</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            {mockData.keyInsight}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Attention Required</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">3 consecutive tasks missed</p>
                <p className="mt-1">Your schedule adherence has dropped below target. Consider adjusting your study plan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoMonitorSummary;
