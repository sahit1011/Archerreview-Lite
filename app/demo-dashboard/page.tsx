'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import AppLayout from '@/components/layouts/AppLayout';
import DemoAlertButton from '@/components/demo/DemoAlertButton';
import DemoMonitorSummary from '@/components/demo/DemoMonitorSummary';
import DemoMonitorInsights from '@/components/demo/DemoMonitorInsights';

export default function DemoDashboardPage() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'progress'>('dashboard');

  return (
    <AppLayout>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demo Dashboard</h1>
          <p className="text-gray-600">
            This is a mockup dashboard showcasing the AI calendar features.
            <Link href="/" className="ml-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              ← Back to Home
            </Link>
          </p>
        </div>
        <DemoAlertButton position="top-right" />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'progress'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {/* Monitor Summary */}
            <DemoMonitorSummary />

            {/* Today's Tasks */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Today's Tasks</h2>
                <span className="text-sm text-gray-500">{format(new Date(), 'MMMM d, yyyy')}</span>
              </div>

              <div className="space-y-4">
                {/* Task 1 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                          <path d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Fluid and Electrolyte Balance Video</h3>
                        <div className="text-sm text-gray-500">
                          Watch the video lecture on fluid and electrolyte balance • 30 minutes
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      9:00 AM
                    </div>
                  </div>
                </div>

                {/* Task 2 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Acid-Base Balance Quiz</h3>
                        <div className="text-sm text-gray-500">
                          Complete the quiz on acid-base balance concepts • 20 minutes
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      10:00 AM
                    </div>
                  </div>
                </div>

                {/* Task 3 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Pharmacology Reading</h3>
                        <div className="text-sm text-gray-500">
                          Read chapter on medication administration • 45 minutes
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      1:30 PM
                    </div>
                  </div>
                </div>

                {/* Task 4 */}
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Practice Questions</h3>
                        <div className="text-sm text-gray-500">
                          Complete 25 practice questions on prioritization • 40 minutes
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      3:00 PM
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  onClick={() => setActiveTab('calendar')}
                >
                  View Full Schedule →
                </button>
              </div>
            </div>

            {/* Recommended Focus Areas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Recommended Focus Areas</h2>
                <span className="text-sm text-gray-500">Based on your performance</span>
              </div>

              <div className="space-y-4">
                {/* Focus Area 1 - Needs Improvement */}
                <div className="border-l-4 border-red-500 bg-red-50 rounded-r-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-red-800">Pediatrics</h3>
                      <p className="text-sm text-red-700 mt-1">
                        This area needs improvement. Your quiz scores are below 50% in pediatric nursing concepts.
                      </p>
                      <div className="mt-3 flex items-center">
                        <div className="w-full bg-red-200 rounded-full h-2.5 mr-2">
                          <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-xs font-medium text-red-800">45%</span>
                      </div>
                      <div className="mt-3">
                        <button className="text-sm bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-3 rounded transition-colors">
                          View Recommended Resources
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Focus Area 2 - Needs Improvement */}
                <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <svg className="h-6 w-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-800">Prioritization & Delegation</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        You're struggling with prioritization questions. Focus on understanding the principles of patient care prioritization.
                      </p>
                      <div className="mt-3 flex items-center">
                        <div className="w-full bg-amber-200 rounded-full h-2.5 mr-2">
                          <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '52%' }}></div>
                        </div>
                        <span className="text-xs font-medium text-amber-800">52%</span>
                      </div>
                      <div className="mt-3">
                        <button className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-1 px-3 rounded transition-colors">
                          View Recommended Resources
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Focus Area 3 - Strong Area */}
                <div className="border-l-4 border-green-500 bg-green-50 rounded-r-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800">Pharmacology</h3>
                      <p className="text-sm text-green-700 mt-1">
                        You're doing well in this area! Continue practicing to maintain your strong performance in medication administration.
                      </p>
                      <div className="mt-3 flex items-center">
                        <div className="w-full bg-green-200 rounded-full h-2.5 mr-2">
                          <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-xs font-medium text-green-800">75%</span>
                      </div>
                      <div className="mt-3">
                        <button className="text-sm bg-green-100 hover:bg-green-200 text-green-800 font-medium py-1 px-3 rounded transition-colors">
                          View Advanced Content
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  onClick={() => setActiveTab('progress')}
                >
                  View All Performance Metrics →
                </button>
              </div>
            </div>
          </div>

          <div>
            {/* NCLEX Readiness */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">NCLEX Readiness</h2>
              <div className="flex justify-center mb-4">
                <div className="relative h-36 w-36">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600">68%</div>
                      <div className="text-sm text-gray-500">Ready</div>
                    </div>
                  </div>
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                      strokeDasharray="100, 100"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="3"
                      strokeDasharray="68, 100"
                      className="animate-[dash_1.5s_ease-in-out_forwards]"
                      style={{ animationDelay: '0.5s' }}
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Pharmacology</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Medical-Surgical</span>
                    <span className="font-medium">62%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Pediatrics</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  onClick={() => setActiveTab('progress')}
                >
                  View Detailed Progress →
                </button>
              </div>
            </div>

            {/* Exam Countdown */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam Countdown</h2>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  45
                </div>
                <div className="text-gray-600">Days Remaining</div>
                <div className="mt-4 text-sm text-gray-500">
                  Exam Date: {format(new Date(new Date().setDate(new Date().getDate() + 45)), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div>
          {/* Alert Button for Calendar View */}
          <div className="flex justify-end mb-4">
            <DemoAlertButton position="top-right" />
          </div>

          {/* Calendar View Controls */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-indigo-700 to-purple-600 p-4 flex justify-between items-center">
              <h2 className="text-white font-semibold">May 2023</h2>
              <div className="flex space-x-4">
                <button className="text-white/90 hover:text-white">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="px-3 py-1 bg-white/20 text-white rounded-md text-sm">
                  Today
                </button>
                <button className="text-white/90 hover:text-white">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 mb-2 text-center font-medium text-gray-700">
                <div className="bg-gray-50 p-2">Sun</div>
                <div className="bg-gray-50 p-2">Mon</div>
                <div className="bg-gray-50 p-2">Tue</div>
                <div className="bg-gray-50 p-2">Wed</div>
                <div className="bg-gray-50 p-2">Thu</div>
                <div className="bg-gray-50 p-2">Fri</div>
                <div className="bg-gray-50 p-2">Sat</div>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Week 1 */}
                <div className="bg-gray-100 p-2 min-h-24 text-gray-400">30</div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">1</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">9:00 AM Video</div>
                    <div className="text-xs p-1 bg-purple-100 text-purple-800 rounded truncate">10:00 AM Quiz</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">2</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-green-100 text-green-800 rounded truncate">11:00 AM Reading</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">3</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">4</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-amber-100 text-amber-800 rounded truncate">2:00 PM Practice</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">5</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">6</div>
                </div>

                {/* Week 2 */}
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">7</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">8</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">9:00 AM Video</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">9</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">10</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-purple-100 text-purple-800 rounded truncate">1:00 PM Quiz</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">11</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">12</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-green-100 text-green-800 rounded truncate">10:00 AM Reading</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">13</div>
                </div>

                {/* Week 3 */}
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">14</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">15</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-amber-100 text-amber-800 rounded truncate">3:00 PM Practice</div>
                  </div>
                </div>
                <div className="bg-blue-50 p-2 min-h-24 border-2 border-blue-500">
                  <div className="font-bold text-blue-800">16</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">9:00 AM Video</div>
                    <div className="text-xs p-1 bg-purple-100 text-purple-800 rounded truncate">10:00 AM Quiz</div>
                    <div className="text-xs p-1 bg-green-100 text-green-800 rounded truncate">1:30 PM Reading</div>
                    <div className="text-xs p-1 bg-amber-100 text-amber-800 rounded truncate">3:00 PM Practice</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">17</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">18</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">9:00 AM Video</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">19</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">20</div>
                </div>

                {/* Week 4 */}
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">21</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">22</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-purple-100 text-purple-800 rounded truncate">11:00 AM Quiz</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">23</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">24</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-green-100 text-green-800 rounded truncate">1:00 PM Reading</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">25</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">26</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-amber-100 text-amber-800 rounded truncate">2:00 PM Practice</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">27</div>
                </div>

                {/* Week 5 */}
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">28</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">29</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">9:00 AM Video</div>
                  </div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">30</div>
                </div>
                <div className="bg-white p-2 min-h-24">
                  <div className="font-medium">31</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-xs p-1 bg-purple-100 text-purple-800 rounded truncate">10:00 AM Quiz</div>
                  </div>
                </div>
                <div className="bg-gray-100 p-2 min-h-24 text-gray-400">1</div>
                <div className="bg-gray-100 p-2 min-h-24 text-gray-400">2</div>
                <div className="bg-gray-100 p-2 min-h-24 text-gray-400">3</div>
              </div>
            </div>

            {/* Calendar Legend */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-100 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Video</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-100 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Quiz</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Reading</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-100 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Practice</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Schedule */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Today's Schedule</h2>
              <span className="text-sm text-gray-500">May 16, 2023</span>
            </div>

            <div className="space-y-6">
              {/* Time Slot 1 */}
              <div className="flex">
                <div className="w-20 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-500">9:00 AM</div>
                </div>
                <div className="flex-grow pl-4 border-l border-gray-200">
                  <div className="bg-blue-100 text-blue-800 p-3 rounded-lg">
                    <h3 className="font-medium">Fluid and Electrolyte Balance Video</h3>
                    <p className="text-sm mt-1">Watch the video lecture on fluid and electrolyte balance</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span>30 minutes</span>
                      <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Video</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Slot 2 */}
              <div className="flex">
                <div className="w-20 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-500">10:00 AM</div>
                </div>
                <div className="flex-grow pl-4 border-l border-gray-200">
                  <div className="bg-purple-100 text-purple-800 p-3 rounded-lg">
                    <h3 className="font-medium">Acid-Base Balance Quiz</h3>
                    <p className="text-sm mt-1">Complete the quiz on acid-base balance concepts</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span>20 minutes</span>
                      <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Quiz</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Slot 3 */}
              <div className="flex">
                <div className="w-20 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-500">1:30 PM</div>
                </div>
                <div className="flex-grow pl-4 border-l border-gray-200">
                  <div className="bg-green-100 text-green-800 p-3 rounded-lg">
                    <h3 className="font-medium">Pharmacology Reading</h3>
                    <p className="text-sm mt-1">Read chapter on medication administration</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span>45 minutes</span>
                      <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded">Reading</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Slot 4 */}
              <div className="flex">
                <div className="w-20 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-500">3:00 PM</div>
                </div>
                <div className="flex-grow pl-4 border-l border-gray-200">
                  <div className="bg-amber-100 text-amber-800 p-3 rounded-lg">
                    <h3 className="font-medium">Practice Questions</h3>
                    <p className="text-sm mt-1">Complete 25 practice questions on prioritization</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span>40 minutes</span>
                      <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Practice</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div>
          {/* Monitor Agent Insights */}
          <DemoMonitorInsights />

          {/* Overall Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">NCLEX Readiness Progress</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Readiness Chart */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Overall Readiness</h3>
                <div className="flex justify-center">
                  <div className="relative h-48 w-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-indigo-600">68%</div>
                        <div className="text-sm text-gray-500">Ready</div>
                      </div>
                    </div>
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                        strokeDasharray="100, 100"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="3"
                        strokeDasharray="68, 100"
                        className="animate-[dash_1.5s_ease-in-out_forwards]"
                        style={{ animationDelay: '0.5s' }}
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p>Based on your performance in quizzes and practice questions</p>
                </div>
              </div>

              {/* Progress Over Time */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Progress Over Time</h3>
                <div className="h-48 flex items-end space-x-2">
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-indigo-100 rounded-t-sm" style={{ height: '30%' }}></div>
                    <div className="mt-2 text-xs text-gray-500">Mar</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-indigo-300 rounded-t-sm" style={{ height: '45%' }}></div>
                    <div className="mt-2 text-xs text-gray-500">Apr</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-indigo-500 rounded-t-sm" style={{ height: '68%' }}></div>
                    <div className="mt-2 text-xs text-gray-500">May</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t-sm" style={{ height: '0%' }}></div>
                    <div className="mt-2 text-xs text-gray-500">Jun</div>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t-sm" style={{ height: '0%' }}></div>
                    <div className="mt-2 text-xs text-gray-500">Jul</div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p>Your readiness score has improved by 38% since March</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Category Performance</h2>

            <div className="space-y-6">
              {/* Pharmacology */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800">Pharmacology</h3>
                    <p className="text-sm text-gray-500">Medication administration, drug interactions</p>
                  </div>
                  <div className="text-lg font-semibold text-indigo-600">75%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Completed: 15/20 tasks</span>
                  <span>Strong area</span>
                </div>
              </div>

              {/* Medical-Surgical */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800">Medical-Surgical</h3>
                    <p className="text-sm text-gray-500">Adult health, chronic conditions</p>
                  </div>
                  <div className="text-lg font-semibold text-indigo-600">62%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '62%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Completed: 12/20 tasks</span>
                  <span>Moderate area</span>
                </div>
              </div>

              {/* Pediatrics */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800">Pediatrics</h3>
                    <p className="text-sm text-gray-500">Child health, development</p>
                  </div>
                  <div className="text-lg font-semibold text-indigo-600">45%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Completed: 9/20 tasks</span>
                  <span>Needs improvement</span>
                </div>
              </div>

              {/* Mental Health */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800">Mental Health</h3>
                    <p className="text-sm text-gray-500">Psychiatric disorders, therapeutic communication</p>
                  </div>
                  <div className="text-lg font-semibold text-indigo-600">58%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '58%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Completed: 11/20 tasks</span>
                  <span>Moderate area</span>
                </div>
              </div>

              {/* Maternal-Newborn */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800">Maternal-Newborn</h3>
                    <p className="text-sm text-gray-500">Pregnancy, postpartum, newborn care</p>
                  </div>
                  <div className="text-lg font-semibold text-indigo-600">52%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '52%' }}></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Completed: 10/20 tasks</span>
                  <span>Moderate area</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>

            <div className="space-y-4">
              {/* Activity 1 */}
              <div className="border-l-4 border-green-500 pl-4 py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">Completed Quiz: Acid-Base Balance</h3>
                    <p className="text-sm text-gray-500">Score: 85% (17/20 correct)</p>
                  </div>
                  <div className="text-xs text-gray-500">Today, 10:25 AM</div>
                </div>
              </div>

              {/* Activity 2 */}
              <div className="border-l-4 border-blue-500 pl-4 py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">Watched Video: Fluid and Electrolyte Balance</h3>
                    <p className="text-sm text-gray-500">Duration: 28 minutes</p>
                  </div>
                  <div className="text-xs text-gray-500">Today, 9:45 AM</div>
                </div>
              </div>

              {/* Activity 3 */}
              <div className="border-l-4 border-amber-500 pl-4 py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">Completed Practice: Prioritization</h3>
                    <p className="text-sm text-gray-500">Score: 76% (19/25 correct)</p>
                  </div>
                  <div className="text-xs text-gray-500">Yesterday, 3:30 PM</div>
                </div>
              </div>

              {/* Activity 4 */}
              <div className="border-l-4 border-green-500 pl-4 py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">Completed Quiz: Medication Administration</h3>
                    <p className="text-sm text-gray-500">Score: 90% (18/20 correct)</p>
                  </div>
                  <div className="text-xs text-gray-500">Yesterday, 11:15 AM</div>
                </div>
              </div>

              {/* Activity 5 */}
              <div className="border-l-4 border-green-500 pl-4 py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">Completed Reading: Pharmacology Chapter</h3>
                    <p className="text-sm text-gray-500">Duration: 45 minutes</p>
                  </div>
                  <div className="text-xs text-gray-500">2 days ago, 2:10 PM</div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View All Activity →
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
