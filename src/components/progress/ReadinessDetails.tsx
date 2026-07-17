'use client';

import { ShieldCheck, TrendingUp, Target, Award } from 'lucide-react';

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
    if (score >= 85) return { text: 'Excellent', color: 'text-success' };
    if (score >= 75) return { text: 'Good', color: 'text-primary' };
    if (score >= 65) return { text: 'Moderate', color: 'text-warning' };
    if (score >= 55) return { text: 'Needs Improvement', color: 'text-warning' };
    return { text: 'Critical', color: 'text-destructive' };
  };

  const readinessStatus = getReadinessStatus(overallScore);
  const projectedStatus = getReadinessStatus(projectedScore);

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Readiness Details</h2>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Current Readiness
          </h3>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-display text-4xl font-bold text-primary">{overallScore}%</div>
              <div className={`mt-1 text-sm font-medium ${readinessStatus.color}`}>{readinessStatus.text}</div>
            </div>

            <div className="relative h-28 w-28">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${overallScore}, 100`}
                />
              </svg>
            </div>
          </div>

          <p className="rounded-xl border border-border bg-card/60 p-3 text-sm text-muted-foreground">
            Your current readiness score is based on your performance across all completed tasks and assessments.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> Projected Readiness
          </h3>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-display text-4xl font-bold text-primary">{projectedScore}%</div>
              <div className={`mt-1 text-sm font-medium ${projectedStatus.color}`}>{projectedStatus.text}</div>
            </div>

            <div className="relative h-28 w-28">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${projectedScore}, 100`}
                />
              </svg>
            </div>
          </div>

          <p className="rounded-xl border border-border bg-card/60 p-3 text-sm text-muted-foreground">
            Your projected readiness score is an estimate of your exam readiness on your scheduled exam date,
            {daysUntilExam} days from now.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Target className="h-4 w-4 text-destructive" /> Areas to Focus On
          </h3>

          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.map(area => (
                <div key={area._id} className="rounded-xl border border-border border-l-4 border-l-destructive/60 bg-card/60 p-4 transition-all hover:bg-accent">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{area.name}</h4>
                    {area.score !== undefined && (
                      <span className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
                        {area.score}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">No specific weak areas identified yet. Continue completing tasks to get more detailed insights.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Award className="h-4 w-4 text-success" /> Your Strengths
          </h3>

          {strongAreas.length > 0 ? (
            <div className="space-y-3">
              {strongAreas.map(area => (
                <div key={area._id} className="rounded-xl border border-border border-l-4 border-l-success/60 bg-card/60 p-4 transition-all hover:bg-accent">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{area.name}</h4>
                    {area.score !== undefined && (
                      <span className="rounded-lg border border-success/30 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                        {area.score}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">No specific strengths identified yet. Continue completing tasks to get more detailed insights.</p>
          )}
        </div>
      </div>
    </div>
  );
}
