/**
 * SBK Tutor Intelligence - Structured Grading Engine
 */

export interface GradingResult {
  score: number;
  percentage: number;
  matchedKeywords: { keyword: string; weight: number }[];
  isCorrect: boolean;
}

/**
 * Normalizes text: lowercase, removes punctuation, trims extra spaces.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Counts words in a string.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Grades a short answer response based on structured expected_keywords and word count.
 */
export function gradeShortAnswer(
  response: string,
  minWordCount: number = 0,
  expectedKeywords: { keyword: string; weight: number }[] = [],
  maxScore: number = 10
): GradingResult {
  const normalizedResponse = normalizeText(response);
  const wordCount = countWords(response);

  // 1. Validate minimum word count
  if (wordCount < minWordCount) {
    return {
      score: 0,
      percentage: 0,
      matchedKeywords: [],
      isCorrect: false,
    };
  }

  // 2. Keyword matching & Weighted scoring
  let totalScore = 0;
  const matchedKeywords: { keyword: string; weight: number }[] = [];

  expectedKeywords.forEach(({ keyword, weight }) => {
    const normalizedKeyword = normalizeText(keyword);
    // Strict string includes matching
    if (normalizedResponse.includes(normalizedKeyword)) {
      totalScore += weight;
      matchedKeywords.push({ keyword, weight });
    }
  });

  // 3. Normalize score (percentage calculation)
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    score: totalScore,
    percentage: Math.round(percentage),
    matchedKeywords,
    isCorrect: percentage >= 60,
  };
}
