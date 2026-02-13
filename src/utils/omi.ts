/**
 * SBK Tutor Intelligence - OMI Calculation Utility
 */

export const OMI_GROUPS = {
  PLATFORM: { name: 'Platform Operations', weight: 40, categories: ['Platform Operations Test'] },
  FIELD: { name: 'Field Operations', weight: 30, categories: ['Field Operations Test'] },
  CURRICULUM: { name: 'Curriculum', weight: 20, categories: ['HTML Curriculum Test', 'Scratch Curriculum Test', 'Foundations Curriculum Test', 'Robotics Test'] },
  CULTURE: { name: 'Company Culture', weight: 10, categories: ['Company Culture Test'] },
};

export interface GroupScore {
  score: number;
  count: number;
}

/**
 * Calculates the Operational Maturity Index (OMI) based on latest attempts per category.
 * Dynamically normalizes weights if groups are missing.
 */
export function calculateOMI(latestAttempts: any[]): number | null {
  if (!latestAttempts || latestAttempts.length === 0) return null;

  const scores: Record<string, GroupScore> = {
    PLATFORM: { score: 0, count: 0 },
    FIELD: { score: 0, count: 0 },
    CURRICULUM: { score: 0, count: 0 },
    CULTURE: { score: 0, count: 0 },
  };

  // 1. Aggregate scores by OMI groups
  latestAttempts.forEach((attempt) => {
    const catName = attempt.categories?.name;
    if (!catName) return;

    if (OMI_GROUPS.PLATFORM.categories.includes(catName)) {
      scores.PLATFORM.score += attempt.percentage;
      scores.PLATFORM.count++;
    } else if (OMI_GROUPS.FIELD.categories.includes(catName)) {
      scores.FIELD.score += attempt.percentage;
      scores.FIELD.count++;
    } else if (OMI_GROUPS.CURRICULUM.categories.includes(catName)) {
      scores.CURRICULUM.score += attempt.percentage;
      scores.CURRICULUM.count++;
    } else if (OMI_GROUPS.CULTURE.categories.includes(catName)) {
      scores.CULTURE.score += attempt.percentage;
      scores.CULTURE.count++;
    }
  });

  // 2. Compute averages per group and determine active weights
  let weightedSum = 0;
  let totalAvailableWeight = 0;

  (Object.keys(OMI_GROUPS) as Array<keyof typeof OMI_GROUPS>).forEach((key) => {
    const group = scores[key];
    if (group.count > 0) {
      const avgGroupScore = group.score / group.count;
      const weight = OMI_GROUPS[key].weight;
      
      weightedSum += avgGroupScore * weight;
      totalAvailableWeight += weight;
    }
  });

  // 3. Normalize OMI (scale to 100 based on available categories)
  if (totalAvailableWeight === 0) return null;
  
  return Math.round(weightedSum / totalAvailableWeight);
}
