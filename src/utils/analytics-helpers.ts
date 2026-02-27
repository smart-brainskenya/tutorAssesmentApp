import { subDays } from 'date-fns';

interface Attempt {
  completed_at: string;
  percentage: number;
  user_id?: string;
}

export interface TrendResult {
  value: number; // Absolute difference
  direction: 'up' | 'down' | 'neutral';
  percentageChange?: number; // Relative change
}

/**
 * Calculates the trend of average score between current period and previous period.
 */
export function calculateScoreTrend(attempts: Attempt[], periodDays: number = 30): TrendResult {
  const now = new Date();
  const currentStart = subDays(now, periodDays);
  const previousStart = subDays(currentStart, periodDays);

  const currentAttempts = attempts.filter(a => {
    const d = new Date(a.completed_at);
    return d >= currentStart && d <= now;
  });

  const previousAttempts = attempts.filter(a => {
    const d = new Date(a.completed_at);
    return d >= previousStart && d < currentStart;
  });

  const currentAvg = currentAttempts.length > 0
    ? currentAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / currentAttempts.length
    : 0;

  const previousAvg = previousAttempts.length > 0
    ? previousAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / previousAttempts.length
    : 0;

  // Calculate difference
  const diff = currentAvg - previousAvg;
  // If no previous data, consider it neutral or handle as new
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';

  return {
    value: Math.round(Math.abs(diff)),
    direction,
    percentageChange: previousAvg !== 0 ? Math.round((diff / previousAvg) * 100) : 0
  };
}

/**
 * Calculates the trend of active tutors (unique users who submitted attempts)
 */
export function calculateActiveTutorsTrend(attempts: Attempt[], periodDays: number = 30): TrendResult {
  const now = new Date();
  const currentStart = subDays(now, periodDays);
  const previousStart = subDays(currentStart, periodDays);

  const currentAttempts = attempts.filter(a => {
    const d = new Date(a.completed_at);
    return d >= currentStart && d <= now;
  });

  const previousAttempts = attempts.filter(a => {
    const d = new Date(a.completed_at);
    return d >= previousStart && d < currentStart;
  });

  const currentActiveTutors = new Set(currentAttempts.map(a => a.user_id)).size;
  const previousActiveTutors = new Set(previousAttempts.map(a => a.user_id)).size;

  const diff = currentActiveTutors - previousActiveTutors;
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';

  return {
    value: Math.abs(diff),
    direction,
    percentageChange: previousActiveTutors !== 0 ? Math.round((diff / previousActiveTutors) * 100) : 0
  };
}
