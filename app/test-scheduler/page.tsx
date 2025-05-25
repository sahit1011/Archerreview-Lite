"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TestSchedulerPage() {
  const [testUser, setTestUser] = useState<any>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [topicsCount, setTopicsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Setup test data
  useEffect(() => {
    async function setupTestData() {
      try {
        setLoading(true);
        const response = await fetch('/api/test-scheduler');
        const data = await response.json();

        if (data.success) {
          setTestUser(data.testUser);
          setStudyPlan(data.studyPlan);
          setTopicsCount(data.topicsCount);
          setMessage(data.message);
        } else {
          setError(data.message || 'Failed to set up test data');
        }
      } catch (err) {
        setError('An error occurred while setting up test data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    setupTestData();
  }, []);

  // Generate plan
  const handleGeneratePlan = async () => {
    if (!testUser) {
      setError('No test user available');
      return;
    }

    try {
      setLoading(true);
      setMessage('Generating study plan...');

      const response = await fetch('/api/plan-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testUser._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedPlan(data.studyPlan);
        setTasks(data.tasks);
        setValidation(data.validation);
        setIsPersonalized(data.isPersonalized);
        setMessage(data.message || 'Study plan generated successfully!');
      } else {
        setError(data.message || 'Failed to generate study plan');
      }
    } catch (err) {
      setError('An error occurred while generating the study plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Scheduler Agent Test
        </h1>

        {loading && (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-700">{message || 'Loading...'}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {message && !loading && (
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-green-700">{message}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Setup</h2>
          <p className="mb-2">Topics in database: <span className="font-medium">{topicsCount}</span></p>

          {testUser && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Test User</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>Name: {testUser.name}</p>
                <p>Email: {testUser.email}</p>
                <p>Exam Date: {new Date(testUser.examDate).toLocaleDateString()}</p>
                <p>Available Days: {testUser.preferences.availableDays.join(', ')}</p>
                <p>Study Hours Per Day: {testUser.preferences.studyHoursPerDay}</p>
                <p>Preferred Study Time: {testUser.preferences.preferredStudyTime}</p>
              </div>
            </div>
          )}

          {studyPlan ? (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Existing Study Plan</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>ID: {studyPlan._id}</p>
                <p>Start Date: {new Date(studyPlan.startDate).toLocaleDateString()}</p>
                <p>End Date: {new Date(studyPlan.endDate).toLocaleDateString()}</p>
                <p>Personalized: {studyPlan.isPersonalized ? 'Yes' : 'No'}</p>
              </div>
            </div>
          ) : (
            <p className="mb-4">No study plan exists for this user yet.</p>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={loading || !testUser}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Generate Study Plan
          </button>
        </div>

        {generatedPlan && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Generated Plan</h2>
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <p>Plan ID: {generatedPlan._id}</p>
              <p>User ID: {generatedPlan.user}</p>
              <p>Start Date: {new Date(generatedPlan.startDate).toLocaleDateString()}</p>
              <p>End Date: {new Date(generatedPlan.endDate).toLocaleDateString()}</p>
              <p>Personalized: {generatedPlan.isPersonalized ? 'Yes' : 'No'}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Plan Details</h3>
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <p className="font-medium">Plan Type: {isPersonalized ? 'Personalized' : 'Default'}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {isPersonalized
                    ? 'This plan was personalized based on diagnostic assessment results.'
                    : 'This is a default plan generated without diagnostic assessment.'}
                </p>
              </div>
            </div>

            {validation && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Plan Validation</h3>
                <div className={`p-4 rounded-md mb-4 ${validation.isValid ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <p className={`font-medium ${validation.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                    {validation.isValid
                      ? '✓ Plan validation successful'
                      : '⚠ Plan has some optimization suggestions'}
                  </p>

                  {!validation.isValid && (
                    <div className="mt-3">
                      {validation.issues.prerequisiteViolations.length > 0 && (
                        <div className="mb-2">
                          <p className="font-medium text-sm">Prerequisite Issues: {validation.issues.prerequisiteViolations.length}</p>
                          <p className="text-xs text-gray-600">Some topics are scheduled before their prerequisites.</p>
                        </div>
                      )}

                      {validation.issues.workloadIssues.length > 0 && (
                        <div className="mb-2">
                          <p className="font-medium text-sm">Workload Issues: {validation.issues.workloadIssues.length}</p>
                          <p className="text-xs text-gray-600">Some days have more study time than recommended.</p>
                        </div>
                      )}

                      {validation.issues.difficultyIssues.length > 0 && (
                        <div className="mb-2">
                          <p className="font-medium text-sm">Difficulty Progression Issues: {validation.issues.difficultyIssues.length}</p>
                          <p className="text-xs text-gray-600">Difficulty level changes too rapidly between some days.</p>
                        </div>
                      )}

                      {validation.issues.spacedRepetitionIssues.length > 0 && (
                        <div className="mb-2">
                          <p className="font-medium text-sm">Spaced Repetition Issues: {validation.issues.spacedRepetitionIssues.length}</p>
                          <p className="text-xs text-gray-600">Some topics need more review sessions or better spacing.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <h3 className="text-lg font-medium mb-2">Generated Tasks ({tasks.length})</h3>

            {tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Title</th>
                      <th className="py-2 px-4 border-b">Type</th>
                      <th className="py-2 px-4 border-b">Date</th>
                      <th className="py-2 px-4 border-b">Time</th>
                      <th className="py-2 px-4 border-b">Duration</th>
                      <th className="py-2 px-4 border-b">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id}>
                        <td className="py-2 px-4 border-b">{task.title}</td>
                        <td className="py-2 px-4 border-b">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            task.type === 'REVIEW' ? 'bg-purple-100 text-purple-800' :
                            task.type === 'QUIZ' ? 'bg-blue-100 text-blue-800' :
                            task.type === 'VIDEO' ? 'bg-green-100 text-green-800' :
                            task.type === 'READING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.type}
                          </span>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Date(task.startTime).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 px-4 border-b">{task.duration} min</td>
                        <td className="py-2 px-4 border-b">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            task.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                            task.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            task.difficulty === 'HARD' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.difficulty}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No tasks generated.</p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
