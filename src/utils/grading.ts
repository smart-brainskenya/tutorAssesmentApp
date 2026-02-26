export interface Submission {
  id: string;
  questions: {
    points: number;
  };
}

export const getPresetScore = (maxPoints: number, percentage: number): number => {
  return Math.round(maxPoints * percentage);
};

export const calculateRunningTotal = (
  sectionAScore: number,
  sectionBSubmissions: Submission[],
  scores: Record<string, number>
): number => {
  const sectionBTotal = sectionBSubmissions.reduce((acc, sub) => {
    return acc + (scores[sub.id] || 0);
  }, 0);
  return sectionAScore + sectionBTotal;
};

export const calculateMaxTotal = (
  sectionAMax: number,
  sectionBSubmissions: Submission[]
): number => {
  const sectionBMax = sectionBSubmissions.reduce((acc, sub) => {
    return acc + (sub.questions.points || 0);
  }, 0);
  return sectionAMax + sectionBMax;
};
