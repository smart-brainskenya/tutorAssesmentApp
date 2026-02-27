import { describe, it, expect } from 'vitest';
import { transformCategoryData } from './assessment-transforms';

describe('transformCategoryData', () => {
  it('should correctly calculate counts and estimated time', () => {
    const mockData = [
      {
        id: 'cat1',
        name: 'Test Category',
        sections: [
          {
            id: 'sec1',
            section_type: 'A',
            questions: [{ count: 5 }] // 5 MC questions
          },
          {
            id: 'sec2',
            section_type: 'B',
            questions: [{ count: 2 }] // 2 SA questions
          }
        ]
      }
    ];

    const result = transformCategoryData(mockData);

    expect(result).toHaveLength(1);
    const cat = result[0];

    expect(cat.section_count).toBe(2);
    expect(cat.question_count).toBe(7); // 5 + 2
    expect(cat.section_a_count).toBe(5);
    expect(cat.section_b_count).toBe(2);

    // Estimated time: (5 * 1.5) + (2 * 10) = 7.5 + 20 = 27.5 -> rounded to 28
    expect(cat.estimated_time).toBe(28);
  });

  it('should handle empty sections', () => {
    const mockData = [
      {
        id: 'cat2',
        name: 'Empty Category',
        sections: []
      }
    ];

    const result = transformCategoryData(mockData);
    const cat = result[0];

    expect(cat.section_count).toBe(0);
    expect(cat.question_count).toBe(0);
    expect(cat.section_a_count).toBe(0);
    expect(cat.section_b_count).toBe(0);
    expect(cat.estimated_time).toBe(0);
  });

  it('should handle sections with no questions', () => {
     const mockData = [
      {
        id: 'cat3',
        name: 'No Questions',
        sections: [
            {
                id: 'sec3',
                section_type: 'A',
                questions: []
            }
        ]
      }
    ];

    const result = transformCategoryData(mockData);
    const cat = result[0];

    expect(cat.section_count).toBe(1);
    expect(cat.question_count).toBe(0);
    expect(cat.section_a_count).toBe(0);
    expect(cat.estimated_time).toBe(0);
  });
});
