'use client';

interface Topic {
  _id: string;
  name: string;
  score?: number;
}

interface ReadinessDetailsProps {
  overallScore: number;
  projectedScore: number;
  daysUntilExam: number;
  weakAreas: Topic[];
  strongAreas: Topic[];
}

export default function ReadinessDetails({
  overallScore,
  projectedScore,
  daysUntilExam,
  weakAreas,
  strongAreas
}: ReadinessDetailsProps) {
  // Get readiness status text and color
  const getReadinessStatus = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { text: 'Good', color: 'text-archer-light-blue' };
    if (score >= 65) return { text: 'Moderate', color: 'text-yellow-600' };
    if (score >= 55) return { text: 'Needs Improvement', color: 'text-orange-600' };
    return { text: 'Critical', color: 'text-red-600' };
  };

  const readinessStatus = getReadinessStatus(overallScore);
  const projectedStatus = getReadinessStatus(projectedScore);

  return (
    <div className="bg-card-background-light rounded-xl shadow-card hover:shadow-card-hover transition-all p-6 mb-6 border border-border-color-light">
      <h2 className="text-2xl font-bold text-archer-dark-text mb-6 bg-archer-bright-teal/10 px-5 py-3 rounded-lg shadow-button inline-block">Readiness Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card-background-light rounded-lg p-6 shadow-card border border-border-color-light">
          <h3 className="text-lg font-semibold text-archer-dark-text mb-4 bg-light-bg-secondary px-4 py-2 rounded-lg shadow-button inline-block">Current Readiness</h3>

          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-4xl font-bold text-archer-bright-teal">{overallScore}%</div>
              <div className={`text-sm font-medium ${readinessStatus.color} mt-1`}>{readinessStatus.text}</div>
            </div>

            <div className="relative h-28 w-28">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E1E1E1"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--archer-bright-teal)"
                  strokeWidth="3"
                  strokeDasharray={`${overallScore}, 100`}
                />
              </svg>
            </div>
          </div>

          <p className="text-sm text-archer-dark-text/80 bg-light-bg-secondary p-3 rounded-lg">
            Your current readiness score is based on your performance across all completed tasks and assessments.
          </p>
        </div>

        <div className="bg-card-background-light rounded-lg p-6 shadow-card border border-border-color-light">
          <h3 className="text-lg font-semibold text-archer-dark-text mb-4 bg-light-bg-secondary px-4 py-2 rounded-lg shadow-button inline-block">Projected Readiness</h3>

          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-4xl font-bold text-archer-light-blue">{projectedScore}%</div>
              <div className={`text-sm font-medium ${projectedStatus.color} mt-1`}>{projectedStatus.text}</div>
            </div>

            <div className="relative h-28 w-28">
              <svg className="h-full w-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E1E1E1"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--archer-light-blue)"
                  strokeWidth="3"
                  strokeDasharray={`${projectedScore}, 100`}
                />
              </svg>
            </div>
          </div>

          <p className="text-sm text-archer-dark-text/80 bg-light-bg-secondary p-3 rounded-lg">
            Your projected readiness score is an estimate of your exam readiness on your scheduled exam date,
            {daysUntilExam} days from now.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-background-light rounded-lg p-6 shadow-card border border-border-color-light">
          <h3 className="text-lg font-semibold text-archer-dark-text mb-4 bg-light-bg-secondary px-4 py-2 rounded-lg shadow-button inline-block">Areas to Focus On</h3>

          {weakAreas.length > 0 ? (
            <div className="space-y-4">
              {weakAreas.map(area => (
                <div key={area._id} className="bg-light-bg-secondary rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all border-l-4 border-red-400 border border-border-color-light">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-archer-dark-text">{area.name}</h4>
                    {area.score !== undefined && (
                      <span className="text-sm font-medium bg-red-100 text-red-600 px-3 py-1 rounded-lg shadow-button">
                        {area.score}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-archer-dark-text/80 bg-light-bg-secondary p-4 rounded-lg">No specific weak areas identified yet. Continue completing tasks to get more detailed insights.</p>
          )}
        </div>

        <div className="bg-card-background-light rounded-lg p-6 shadow-card border border-border-color-light">
          <h3 className="text-lg font-semibold text-archer-dark-text mb-4 bg-light-bg-secondary px-4 py-2 rounded-lg shadow-button inline-block">Your Strengths</h3>

          {strongAreas.length > 0 ? (
            <div className="space-y-4">
              {strongAreas.map(area => (
                <div key={area._id} className="bg-light-bg-secondary rounded-lg p-4 shadow-card hover:shadow-card-hover transition-all border-l-4 border-green-400 border border-border-color-light">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-archer-dark-text">{area.name}</h4>
                    {area.score !== undefined && (
                      <span className="text-sm font-medium bg-green-100 text-green-600 px-3 py-1 rounded-lg shadow-button">
                        {area.score}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-archer-dark-text/80 bg-light-bg-secondary p-4 rounded-lg">No specific strengths identified yet. Continue completing tasks to get more detailed insights.</p>
          )}
        </div>
      </div>
    </div>
  );
}
