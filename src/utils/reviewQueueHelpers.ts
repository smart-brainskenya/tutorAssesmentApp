export interface ReviewQueueItem {
  attempt_id: string;
  submitted_at: string;
  tutor_name: string;
  category_name: string;
  pending_questions: number;
}

export type SortOrder = 'oldest' | 'newest';

export interface FilterOptions {
  assessment?: string;
  tutor?: string;
  sortBy?: SortOrder;
}

export const filterQueue = (
  queue: ReviewQueueItem[],
  filters: FilterOptions
): ReviewQueueItem[] => {
  const { assessment, tutor, sortBy = 'oldest' } = filters;

  let filtered = [...queue];

  if (assessment) {
    filtered = filtered.filter((item) => item.category_name === assessment);
  }

  if (tutor) {
    filtered = filtered.filter((item) => item.tutor_name === tutor);
  }

  filtered.sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime();
    const dateB = new Date(b.submitted_at).getTime();

    if (sortBy === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  return filtered;
};

export const getUniqueValues = (queue: ReviewQueueItem[]) => {
  const assessments = Array.from(new Set(queue.map((item) => item.category_name))).sort();
  const tutors = Array.from(new Set(queue.map((item) => item.tutor_name))).sort();

  return { assessments, tutors };
};
