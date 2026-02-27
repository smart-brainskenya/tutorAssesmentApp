import { describe, it, expect } from 'vitest';
import { getPresetScore, calculateRunningTotal, calculateMaxTotal } from './grading';

describe('grading utils', () => {
  it('getPresetScore calculates correct score', () => {
    expect(getPresetScore(10, 0.25)).toBe(3); // 2.5 rounded to 3
    expect(getPresetScore(10, 0.5)).toBe(5);
    expect(getPresetScore(10, 0.75)).toBe(8); // 7.5 rounded to 8
    expect(getPresetScore(10, 1.0)).toBe(10);

    expect(getPresetScore(4, 0.25)).toBe(1);
    expect(getPresetScore(4, 0.5)).toBe(2);
    expect(getPresetScore(4, 0.75)).toBe(3);
    expect(getPresetScore(4, 1.0)).toBe(4);
  });

  const mockSubmissions = [
    { id: 'sub1', questions: { points: 10 } },
    { id: 'sub2', questions: { points: 5 } }
  ];

  it('calculateRunningTotal sums section A and B scores', () => {
    const scores = { 'sub1': 8, 'sub2': 3 };
    const sectionAScore = 20;

    // Total = 20 + 8 + 3 = 31
    expect(calculateRunningTotal(sectionAScore, mockSubmissions, scores)).toBe(31);
  });

  it('calculateRunningTotal handles missing scores', () => {
    const scores = { 'sub1': 8 }; // sub2 missing, defaults to 0
    const sectionAScore = 20;

    // Total = 20 + 8 + 0 = 28
    expect(calculateRunningTotal(sectionAScore, mockSubmissions, scores)).toBe(28);
  });

  it('calculateMaxTotal sums section A max and B max points', () => {
    const sectionAMax = 25;
    // Total Max = 25 + 10 + 5 = 40
    expect(calculateMaxTotal(sectionAMax, mockSubmissions)).toBe(40);
  });
});
