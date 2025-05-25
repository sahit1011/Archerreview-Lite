'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await fetch('/api/seed-achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.message || 'Failed to seed achievements');
      }
    } catch (err) {
      console.error('Error seeding achievements:', err);
      setError('An error occurred while seeding achievements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-archer-darker-teal to-archer-medium-teal p-8">
      <div className="max-w-3xl mx-auto bg-card-background-dark rounded-xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-archer-white mb-6">Admin: Seed Database</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-archer-white mb-4">Seed Achievements</h2>
          <p className="text-archer-light-text mb-4">
            This will populate the database with initial achievement data. This should only be run once.
          </p>
          
          <motion.button
            className="px-6 py-3 bg-archer-bright-teal text-archer-dark-teal rounded-lg font-medium shadow-button hover:shadow-lg transition-all"
            onClick={handleSeedAchievements}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-archer-dark-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Seeding...
              </span>
            ) : (
              'Seed Achievements'
            )}
          </motion.button>
        </div>
        
        {error && (
          <div className="bg-red-900/20 text-red-400 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {results && (
          <div className="bg-archer-dark-teal/30 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-archer-white mb-3">Results:</h3>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-archer-dark-teal/50">
                    <th className="text-left py-2 px-4 text-archer-light-text">Achievement</th>
                    <th className="text-left py-2 px-4 text-archer-light-text">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result: any, index: number) => (
                    <tr key={index} className="border-b border-archer-dark-teal/30">
                      <td className="py-2 px-4 text-archer-white">{result.name}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.status === 'created' 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-yellow-900/20 text-yellow-400'
                        }`}>
                          {result.status === 'created' ? 'Created' : 'Skipped'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
