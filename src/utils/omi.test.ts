import { describe, it, expect } from 'vitest';
import { calculateOMI } from './omi';

describe('calculateOMI', () => {
  it('should return null when input is null or undefined', () => {
    expect(calculateOMI(null as any)).toBeNull();
    expect(calculateOMI(undefined as any)).toBeNull();
  });

  it('should return null when input is an empty array', () => {
    expect(calculateOMI([])).toBeNull();
  });

  it('should return null when no categories match OMI groups', () => {
    const attempts = [
      { categories: { name: 'Unknown Test' }, percentage: 100 }
    ];
    expect(calculateOMI(attempts)).toBeNull();
  });

  it('should calculate OMI for a single group', () => {
    const attempts = [
      { categories: { name: 'Platform Operations Test' }, percentage: 80 }
    ];
    // PLATFORM weight: 40. OMI = (80 * 40) / 40 = 80
    expect(calculateOMI(attempts)).toBe(80);
  });

  it('should average multiple attempts within the same group', () => {
    const attempts = [
      { categories: { name: 'HTML Curriculum Test' }, percentage: 70 },
      { categories: { name: 'Robotics Test' }, percentage: 90 }
    ];
    // CURRICULUM weight: 20. Avg = (70 + 90) / 2 = 80. OMI = (80 * 20) / 20 = 80
    expect(calculateOMI(attempts)).toBe(80);
  });

  it('should calculate weighted average across multiple groups', () => {
    const attempts = [
      { categories: { name: 'Platform Operations Test' }, percentage: 100 }, // Weight 40
      { categories: { name: 'Company Culture Test' }, percentage: 50 }       // Weight 10
    ];
    // Total Weight: 40 + 10 = 50
    // Weighted Sum: (100 * 40) + (50 * 10) = 4000 + 500 = 4500
    // OMI: 4500 / 50 = 90
    expect(calculateOMI(attempts)).toBe(90);
  });

  it('should correctly normalize OMI when some groups are missing', () => {
    const attempts = [
      { categories: { name: 'Field Operations Test' }, percentage: 75 },      // Weight 30
      { categories: { name: 'HTML Curriculum Test' }, percentage: 85 }        // Weight 20
    ];
    // Total Weight: 30 + 20 = 50
    // Weighted Sum: (75 * 30) + (85 * 20) = 2250 + 1700 = 3950
    // OMI: 3950 / 50 = 79
    expect(calculateOMI(attempts)).toBe(79);
  });

  it('should calculate correct OMI when all groups are present', () => {
    const attempts = [
      { categories: { name: 'Platform Operations Test' }, percentage: 100 }, // 40
      { categories: { name: 'Field Operations Test' }, percentage: 100 },    // 30
      { categories: { name: 'Foundations Curriculum Test' }, percentage: 100 }, // 20
      { categories: { name: 'Company Culture Test' }, percentage: 100 }      // 10
    ];
    expect(calculateOMI(attempts)).toBe(100);
  });

  it('should round the result to the nearest integer', () => {
    // Case rounding up:
    const attemptsUp = [
      { categories: { name: 'Platform Operations Test' }, percentage: 85 }, // 40
      { categories: { name: 'Field Operations Test' }, percentage: 80 }     // 30
    ];
    // Sum: 85*40 + 80*30 = 3400 + 2400 = 5800. 5800 / 70 = 82.857... -> 83
    expect(calculateOMI(attemptsUp)).toBe(83);

    // Case rounding down:
    const attemptsDown = [
      { categories: { name: 'Platform Operations Test' }, percentage: 85 }, // 40
      { categories: { name: 'Field Operations Test' }, percentage: 90 }     // 30
    ];
    // Sum: 85*40 + 90*30 = 3400 + 2700 = 6100. 6100 / 70 = 87.142... -> 87
    expect(calculateOMI(attemptsDown)).toBe(87);
  });

  it('should ignore attempts with missing category names', () => {
    const attempts = [
      { categories: { name: 'Platform Operations Test' }, percentage: 100 },
      { categories: {}, percentage: 0 },
      { categories: null, percentage: 0 }
    ];
    expect(calculateOMI(attempts)).toBe(100);
  });
});
