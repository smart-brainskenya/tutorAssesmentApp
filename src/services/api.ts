import { supabase } from '../lib/supabase';
import { Category, Question, Attempt, Answer } from '../types';

export const api = {
  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Category[];
  },

  createCategory: async (name: string, description: string, published: boolean = false) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description, published }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  deleteCategory: async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Questions
  getQuestionsByCategory: async (categoryId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category_id', categoryId);
    
    if (error) throw error;
    return data as Question[];
  },

  createQuestion: async (question: Omit<Question, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('questions')
      .insert([question])
      .select()
      .single();
    
    if (error) throw error;
    return data as Question;
  },

  // Attempts & Answers
  submitAttempt: async (attempt: Omit<Attempt, 'id' | 'completed_at'>, answers: Omit<Answer, 'id' | 'attempt_id'>[]) => {
    const { data: attemptData, error: attemptError } = await supabase
      .from('attempts')
      .insert([attempt])
      .select()
      .single();

    if (attemptError) throw attemptError;

    const answersToInsert = answers.map(ans => ({
      ...ans,
      attempt_id: attemptData.id
    }));

    const { error: answersError } = await supabase
      .from('answers')
      .insert(answersToInsert);

    if (answersError) throw answersError;

    return attemptData as Attempt;
  },

  getTutorAttempts: async (userId: string) => {
    const { data, error } = await supabase
      .from('attempts')
      .select(`
        *,
        categories (name)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Admin Analytics & Leaderboard
  getAdminStats: async () => {
    const { data: tutors, error: tutorError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'tutor');

    const { data: attempts, error: attemptError } = await supabase
      .from('attempts')
      .select('*, categories(name)');

    if (tutorError || attemptError) throw tutorError || attemptError;

    const totalTutors = tutors.length;
    const avgGlobalScore = attempts.length > 0 
      ? attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length 
      : 0;

    // Category Performance
    const catPerformance: Record<string, { total: number, count: number }> = {};
    attempts.forEach(a => {
      const name = a.categories?.name || 'Unknown';
      if (!catPerformance[name]) catPerformance[name] = { total: 0, count: 0 };
      catPerformance[name].total += a.percentage;
      catPerformance[name].count += 1;
    });

    const catStats = Object.entries(catPerformance).map(([name, data]) => ({
      name,
      avg: data.total / data.count
    })).sort((a, b) => b.avg - a.avg);

    const mostPassed = catStats[0]?.name || 'N/A';
    const mostFailed = catStats[catStats.length - 1]?.name || 'N/A';

    // Leaderboard & Risk
    const tutorStats = tutors.map(t => {
      const tAttempts = attempts.filter(a => a.user_id === t.id);
      const avg = tAttempts.length > 0 
        ? tAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / tAttempts.length 
        : 0;
      return {
        ...t,
        avgPercentage: avg,
        testsTaken: tAttempts.length
      };
    });

    const leaderboard = [...tutorStats].sort((a, b) => b.avgPercentage - a.avgPercentage);
    const below60 = tutorStats.filter(t => t.testsTaken > 0 && t.avgPercentage < 60);
    const inactive = tutorStats.filter(t => t.testsTaken === 0);

    return {
      metrics: {
        totalTutors,
        avgGlobalScore: Math.round(avgGlobalScore),
        mostPassed,
        mostFailed,
        atRiskCount: below60.length
      },
      leaderboard,
      risk: {
        below60,
        inactive
      },
      rawAttempts: attempts
    };
  }
};
