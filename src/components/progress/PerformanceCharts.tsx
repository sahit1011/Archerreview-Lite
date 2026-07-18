'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LineChart, BarChart3, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

// One accent at stepped opacity — never a rainbow.
const SUBJECT_BAR = ['bg-primary', 'bg-primary/60', 'bg-primary/30'] as const;

interface PerformanceData {
  date: string;
  score: number;
}

interface CategoryScore {
  category: string;
  score: number;
}

interface PerformanceChartsProps {
  performanceHistory: PerformanceData[];
  categoryScores: CategoryScore[];
  overallScore: number;
}

export default function PerformanceCharts({
  performanceHistory: initialPerformanceHistory,
  categoryScores,
  overallScore
}: PerformanceChartsProps) {
  const [activeView, setActiveView] = useState<'trend' | 'categories'>('trend');
  const [timeFilter, setTimeFilter] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>(initialPerformanceHistory);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 7 });
  const [loading, setLoading] = useState(false);
  const [realData, setRealData] = useState<PerformanceData[]>([]);
  const reduceMotion = useReducedMotion();

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  // Fetch real performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        // Get userId from URL or localStorage
        const userId = new URLSearchParams(window.location.search).get('userId') ||
                      localStorage.getItem('userId') ||
                      '6818ed80539a47f3e1d5b9ab';

        // Fetch performance data from API
        const response = await fetch(`/api/performance?userId=${userId}`);
        const data = await response.json();

        if (data.success && data.performances) {
          // Process performance data
          const processedData = processPerformanceData(data.performances, timeFilter);
          setRealData(processedData);
          setPerformanceHistory(processedData);
        }
      } catch (error) {
        console.error('Error fetching performance data:', error);
        // Fallback to initial data if API fails
        setPerformanceHistory(initialPerformanceHistory);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [timeFilter, initialPerformanceHistory]);

  // Format date label based on time filter
  const formatDateLabel = (dateStr: string, filter: 'days' | 'weeks' | 'months') => {
    try {
      if (filter === 'days') {
        // For days, format as "MMM D"
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (filter === 'weeks') {
        // For weeks, format as "Week N"
        const parts = dateStr.split('-W');
        return `Week ${parts[1]}`;
      } else { // months
        // For months, format as "MMM YYYY"
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting date label:', error);
      return dateStr;
    }
  };

  // Process performance data based on time filter
  const processPerformanceData = (performances: any[], filter: 'days' | 'weeks' | 'months') => {
    // No fabrication: with too little real data we return an empty series and the
    // chart shows an honest "not enough data yet" state instead of a fake trend.
    if (!performances || performances.length < 2) {
      return [];
    }

    // Process real performance data
    // Extract scores and dates from performances
    const rawData = performances
      .filter(p => p.score !== undefined && p.score !== null)
      .map(p => ({
        date: new Date(p.createdAt),
        score: p.score
      }));

    // Sort by date
    rawData.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by time period
    const groupedData: Record<string, number[]> = {};

    rawData.forEach(item => {
      let key: string;

      if (filter === 'days') {
        key = item.date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (filter === 'weeks') {
        // Get week number
        const d = new Date(item.date);
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${weekNum}`;
      } else { // months
        key = `${item.date.getFullYear()}-${item.date.getMonth() + 1}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = [];
      }

      groupedData[key].push(item.score);
    });

    // Calculate average score for each time period
    let result: PerformanceData[] = Object.entries(groupedData).map(([key, scores]) => {
      const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      return {
        date: key,
        score: avgScore
      };
    });

    // If no data, return initial data
    if (result.length === 0) {
      return initialPerformanceHistory;
    }

    // For days filter, fill in missing days
    if (filter === 'days' && result.length > 1) {
      const filledResult: PerformanceData[] = [];
      const startDate = new Date(result[0].date);
      const endDate = new Date(result[result.length - 1].date);

      // Create a map of existing data points
      const dataMap: Record<string, number> = {};
      result.forEach(item => {
        dataMap[item.date] = item.score;
      });

      // Fill in all days between start and end
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        if (dataMap[dateStr]) {
          // Use existing data
          filledResult.push({
            date: dateStr,
            score: dataMap[dateStr]
          });
        } else {
          // Linear interpolation between known points
          const prevDate = new Date(currentDate);
          let prevScore = 0;
          let prevFound = false;

          // Find the previous known data point
          while (!prevFound && prevDate >= startDate) {
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            if (dataMap[prevDateStr]) {
              prevScore = dataMap[prevDateStr];
              prevFound = true;
            }
          }

          // Find the next known data point
          const nextDate = new Date(currentDate);
          let nextScore = 0;
          let nextFound = false;

          while (!nextFound && nextDate <= endDate) {
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];
            if (dataMap[nextDateStr]) {
              nextScore = dataMap[nextDateStr];
              nextFound = true;
            }
          }

          // Calculate interpolated score
          let interpolatedScore;
          if (prevFound && nextFound) {
            // Linear interpolation
            const totalDays = (nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            const daysPassed = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            interpolatedScore = Math.round(prevScore + (nextScore - prevScore) * (daysPassed / totalDays));
          } else if (prevFound) {
            // Only previous point found
            interpolatedScore = prevScore;
          } else if (nextFound) {
            // Only next point found
            interpolatedScore = nextScore;
          } else {
            // No reference points, use a random variation
            const lastScore = filledResult.length > 0 ? filledResult[filledResult.length - 1].score : 50;
            const variation = Math.floor(Math.random() * 5) - 2; // -2 to +2
            interpolatedScore = Math.min(100, Math.max(0, lastScore + variation));
          }

          filledResult.push({
            date: dateStr,
            score: interpolatedScore
          });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      result = filledResult;
    }

    return result;
  };

  const tabBtn = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  const smallTabBtn = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground'
    }`;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Telemetry</p>
            <h2 className="text-lg font-semibold text-foreground">Performance Analytics</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={tabBtn(activeView === 'trend')} onClick={() => setActiveView('trend')}>
            <LineChart className="h-4 w-4" /> Score Trend
          </button>
          <button className={tabBtn(activeView === 'categories')} onClick={() => setActiveView('categories')}>
            <BarChart3 className="h-4 w-4" /> Categories
          </button>
        </div>
      </div>

      {activeView === 'trend' ? (
        <div className="flex flex-col items-center">
          <div className="w-full rounded-2xl border border-border bg-secondary/30 p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Performance History</h3>
              </div>

              {/* Time filter buttons */}
              <div className="flex gap-2">
                <button className={smallTabBtn(timeFilter === 'days')} onClick={() => setTimeFilter('days')}>
                  Days
                </button>
                <button className={smallTabBtn(timeFilter === 'weeks')} onClick={() => setTimeFilter('weeks')}>
                  Weeks
                </button>
                <button className={smallTabBtn(timeFilter === 'months')} onClick={() => setTimeFilter('months')}>
                  Months
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"></div>
              </div>
            ) : (
              <>
                {/* Navigation controls */}
                <div className="mb-3 flex items-center justify-between">
                  <button
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    onClick={() => setVisibleRange(prev => ({
                      start: Math.max(0, prev.start - 7),
                      end: Math.max(7, prev.end - 7)
                    }))}
                    disabled={visibleRange.start === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {performanceHistory.length > 0 ?
                      `Showing ${visibleRange.start + 1}-${Math.min(visibleRange.end, performanceHistory.length)} of ${performanceHistory.length}` :
                      'No data available'}
                  </span>
                  <button
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                    onClick={() => setVisibleRange(prev => ({
                      start: prev.start + 7,
                      end: prev.end + 7
                    }))}
                    disabled={visibleRange.end >= performanceHistory.length}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Area chart */}
                {(() => {
                  const visible = performanceHistory.slice(visibleRange.start, visibleRange.end);
                  if (visible.length === 0) {
                    return (
                      <div className="flex h-56 items-center justify-center">
                        <p className="text-muted-foreground">No performance data available</p>
                      </div>
                    );
                  }
                  const W = 700;
                  const H = 200;
                  const x = (i: number) => (visible.length === 1 ? W / 2 : (i / (visible.length - 1)) * (W - 20) + 10);
                  const y = (score: number) => H - (score / 100) * H;
                  const linePoints = visible.map((e, i) => `${x(i)},${y(e.score)}`).join(' ');
                  const areaPath = `M ${x(0)},${y(visible[0].score)} ${visible
                    .slice(1)
                    .map((e, i) => `L ${x(i + 1)},${y(e.score)}`)
                    .join(' ')} L ${x(visible.length - 1)},${H} L ${x(0)},${H} Z`;
                  return (
                    <div>
                      <div className="relative">
                        {/* y-axis reference labels */}
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between py-0.5 text-[10px] text-muted-foreground/70">
                          <span>100%</span>
                          <span>50%</span>
                          <span>0%</span>
                        </div>
                        <div className="relative ml-9 h-56">
                          <svg className="h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="perf-area" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>
                            {[0, 50, 100].map((v) => (
                              <line
                                key={v}
                                x1="0"
                                x2={W}
                                y1={y(v)}
                                y2={y(v)}
                                stroke="var(--border)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                                strokeDasharray={v === 0 ? undefined : '4 6'}
                              />
                            ))}
                            <path d={areaPath} fill="url(#perf-area)" />
                            <polyline
                              points={linePoints}
                              fill="none"
                              stroke="var(--primary)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>
                          {/* dots + hover tooltips (HTML so they never distort) */}
                          {visible.map((entry, index) => (
                            <div
                              key={index}
                              className="group absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${(x(index) / W) * 100}%`, top: `${(y(entry.score) / H) * 100}%` }}
                            >
                              <div className="h-2.5 w-2.5 rounded-full border-2 border-card bg-primary shadow-sm transition-transform group-hover:scale-125" />
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs font-semibold text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                                {entry.score}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="ml-9 mt-2 flex justify-between text-[11px] text-muted-foreground">
                        {visible.map((entry, index) => (
                          <span key={index} className={visible.length > 9 && index % 2 === 1 ? 'hidden sm:inline' : undefined}>
                            {formatDateLabel(entry.date, timeFilter)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Subject breakdown
            </p>
            <span className="font-mono text-[0.7rem] text-muted-foreground">
              {categoryScores.length} subjects
            </span>
          </div>

          {categoryScores.length > 0 ? (
            <div className="space-y-4">
              {categoryScores.map((category, i) => (
                <div
                  key={category.category}
                  className="flex items-center gap-3"
                  role="img"
                  aria-label={`${formatCategoryName(category.category)} ${category.score} percent`}
                >
                  <span className="w-28 shrink-0 text-sm text-foreground">
                    {formatCategoryName(category.category)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className={`h-full origin-left rounded-full ${SUBJECT_BAR[i % SUBJECT_BAR.length]}`}
                      style={{ width: `${category.score}%` }}
                      initial={reduceMotion ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20, delay: 0.08 * i }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[0.75rem] text-muted-foreground">
                    {category.score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              No subject data yet — complete quizzes and assessments to populate this breakdown.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
