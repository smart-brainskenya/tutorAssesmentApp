import { describe, it, expect } from 'vitest';
import { calculateScoreTrend, calculateActiveTutorsTrend } from './analytics-helpers';
import { subDays } from 'date-fns';

describe('analytics-helpers', () => {
  const now = new Date();
  const today = now.toISOString();
  const day15 = subDays(now, 15).toISOString();
  const day45 = subDays(now, 45).toISOString(); // Previous period

  describe('calculateScoreTrend', () => {
    it('should calculate upward trend correctly', () => {
      const attempts = [
        { completed_at: today, percentage: 80 },
        { completed_at: day15, percentage: 80 }, // Current avg = 80
        { completed_at: day45, percentage: 60 }  // Previous avg = 60
      ];
      // Diff = +20
      const result = calculateScoreTrend(attempts, 30);
      expect(result.direction).toBe('up');
      expect(result.value).toBe(20);
    });

    it('should calculate downward trend correctly', () => {
      const attempts = [
        { completed_at: today, percentage: 50 },
        { completed_at: day45, percentage: 70 }
      ];
      // Diff = -20
      const result = calculateScoreTrend(attempts, 30);
      expect(result.direction).toBe('down');
      expect(result.value).toBe(20);
    });

    it('should handle no previous data', () => {
        const attempts = [
            { completed_at: today, percentage: 80 }
        ];
        // Previous avg = 0. Diff = 80 - 0 = 80.
        const result = calculateScoreTrend(attempts, 30);
        expect(result.direction).toBe('up');
        expect(result.value).toBe(80);
    });
  });

  describe('calculateActiveTutorsTrend', () => {
    it('should count unique active tutors', () => {
      const attempts = [
        { completed_at: today, percentage: 80, user_id: 'u1' },
        { completed_at: day15, percentage: 80, user_id: 'u2' },
        { completed_at: day15, percentage: 80, user_id: 'u1' }, // u1 counted once
        // Current Active: u1, u2 = 2

        { completed_at: day45, percentage: 60, user_id: 'u3' }
        // Previous Active: u3 = 1
      ];
      // Diff = 2 - 1 = +1
      const result = calculateActiveTutorsTrend(attempts, 30);
      expect(result.direction).toBe('up');
      expect(result.value).toBe(1);
    });
  });
});
