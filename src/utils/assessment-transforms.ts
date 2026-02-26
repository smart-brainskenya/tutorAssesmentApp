/* eslint-disable @typescript-eslint/no-explicit-any */
interface RawCategoryData {
  sections?: {
    section_type: string;
    questions?: { count: number }[];
  }[];
  [key: string]: any;
}

// Helper to transform category data with counts and estimates
export const transformCategoryData = (data: RawCategoryData[]) => {
  return data.map(cat => {
    const sections = cat.sections || [];
    const totalSections = sections.length;

    let totalQuestions = 0;
    let sectionACount = 0;
    let sectionBCount = 0;

    sections.forEach((sec) => {
      const qCount = sec.questions?.[0]?.count || 0;
      totalQuestions += qCount;
      if (sec.section_type === 'A') {
        sectionACount += qCount;
      } else if (sec.section_type === 'B') {
        sectionBCount += qCount;
      }
    });

    // Estimate time: 1.5 min per MC (A), 10 min per SA (B)
    const estimatedTime = Math.round((sectionACount * 1.5) + (sectionBCount * 10));

    return {
      ...cat,
      section_count: totalSections,
      question_count: totalQuestions,
      section_a_count: sectionACount,
      section_b_count: sectionBCount,
      estimated_time: estimatedTime
    };
  });
};
