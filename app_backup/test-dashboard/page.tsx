'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TestDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        const data = await response.json();

        if (data.success) {
          setUsers(data.users || []);
        } else {
          setError('Failed to fetch users');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('An error occurred while fetching users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = async (userId: string) => {
    try {
      // Navigate to our new dynamic dashboard view with user ID as query parameter
      router.push(`/test-dashboard-view?userId=${userId}`);
    } catch (err) {
      console.error('Error selecting user:', err);
      setError('An error occurred while selecting user');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-md p-8 my-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-md p-8 my-8">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">Test Dashboard with Different Users</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        <p className="mb-6 text-gray-600">
          Select a user to view the dashboard from their perspective. Each user represents a different scenario:
        </p>

        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleUserSelect(user._id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-sm text-gray-500">
                    Exam Date: {new Date(user.examDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                <Link
                  href={`/test-dashboard-view?userId=${user._id}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                >
                  View Dashboard
                </Link>
                <Link
                  href={`/test-calendar?userId=${user._id}`}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
                >
                  View Calendar
                </Link>
              </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
