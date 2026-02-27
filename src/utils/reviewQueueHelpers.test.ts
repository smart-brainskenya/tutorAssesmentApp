import { describe, it, expect } from 'vitest';
import { filterQueue, getUniqueValues, ReviewQueueItem } from './reviewQueueHelpers';

const mockQueue: ReviewQueueItem[] = [
  {
    attempt_id: '1',
    submitted_at: '2023-01-01T10:00:00Z',
    tutor_name: 'Alice',
    category_name: 'Math',
    pending_questions: 2,
  },
  {
    attempt_id: '2',
    submitted_at: '2023-01-02T10:00:00Z',
    tutor_name: 'Bob',
    category_name: 'Science',
    pending_questions: 3,
  },
  {
    attempt_id: '3',
    submitted_at: '2023-01-03T10:00:00Z',
    tutor_name: 'Alice',
    category_name: 'Science',
    pending_questions: 1,
  },
  {
    attempt_id: '4',
    submitted_at: '2023-01-04T10:00:00Z',
    tutor_name: 'Bob',
    category_name: 'Math',
    pending_questions: 4,
  },
];

describe('reviewQueueHelpers', () => {
  describe('getUniqueValues', () => {
    it('should return unique assessments and tutors', () => {
      const { assessments, tutors } = getUniqueValues(mockQueue);
      expect(assessments).toEqual(['Math', 'Science']);
      expect(tutors).toEqual(['Alice', 'Bob']);
    });
  });

  describe('filterQueue', () => {
    it('should return all items if no filters are applied', () => {
      const result = filterQueue(mockQueue, {});
      expect(result.length).toBe(4);
    });

    it('should filter by assessment', () => {
      const result = filterQueue(mockQueue, { assessment: 'Math' });
      expect(result.length).toBe(2);
      expect(result.map((i) => i.attempt_id)).toEqual(expect.arrayContaining(['1', '4']));
    });

    it('should filter by tutor', () => {
      const result = filterQueue(mockQueue, { tutor: 'Alice' });
      expect(result.length).toBe(2);
      expect(result.map((i) => i.attempt_id)).toEqual(expect.arrayContaining(['1', '3']));
    });

    it('should filter by both assessment and tutor', () => {
      const result = filterQueue(mockQueue, { assessment: 'Science', tutor: 'Bob' });
      expect(result.length).toBe(1);
      expect(result[0].attempt_id).toBe('2');
    });

    it('should sort by oldest first (default)', () => {
      const result = filterQueue(mockQueue, {});
      expect(result.map((i) => i.attempt_id)).toEqual(['1', '2', '3', '4']);
    });

    it('should sort by newest first', () => {
      const result = filterQueue(mockQueue, { sortBy: 'newest' });
      expect(result.map((i) => i.attempt_id)).toEqual(['4', '3', '2', '1']);
    });
  });
});
