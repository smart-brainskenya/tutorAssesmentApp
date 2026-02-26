import { supabase } from '../lib/supabase';
import { Category, Question, User, Section } from '../types';
import { calculateOMI } from '../utils/omi';
import { transformCategoryData, RawCategoryData } from '../utils/assessment-transforms';

interface RawSection extends Section {
  questions: { count: number }[];
}

export const api = {
  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, sections(questions(count), section_type)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return transformCategoryData(data as RawCategoryData[]) as (Category & {
      section_count: number;
      question_count: number;
      section_a_count: number;
      section_b_count: number;
      estimated_time: number;
    })[];
  },

  getPublishedCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*, sections(questions(count), section_type)')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    
    if (error) throw error;
    
    return transformCategoryData(data as RawCategoryData[]) as (Category & {
      section_count: number;
      question_count: number;
      section_a_count: number;
      section_b_count: number;
      estimated_time: number;
    })[];
  },

  createCategory: async (name: string, description: string, is_published: boolean = false) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        name, 
        description, 
        is_published,
        published_at: is_published ? new Date().toISOString() : null 
      }])
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
    // Check if category has attempts
    const { count } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      throw new Error('This category has existing tutor attempts and cannot be deleted. Unpublish it instead.');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Sections
  getSectionsByCategory: async (categoryId: string) => {
    const { data, error } = await supabase
      .from('sections')
      .select('*, questions(count)')
      .eq('category_id', categoryId)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return (data as RawSection[]).map((sec) => ({
      ...sec,
      question_count: sec.questions?.[0]?.count || 0
    })) as (Section & { question_count: number })[];
  },

  // Questions
  getQuestionsBySection: async (sectionId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('section_id', sectionId)
      .order('created_at', { ascending: true });
    
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

  updateQuestion: async (id: string, updates: Partial<Question>) => {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Question;
  },

  deleteQuestion: async (id: string) => {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Detail Fetchers
  getCategoryById: async (id: string) => {
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Category;
  },

  getSectionById: async (id: string) => {
    const { data, error } = await supabase.from('sections').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Section;
  },

  // Section CRUD
  createSection: async (section: Omit<Section, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('sections').insert([section]).select().single();
    if (error) throw error;
    return data as Section;
  },

  updateSection: async (id: string, updates: Partial<Section>) => {
    const { data, error } = await supabase.from('sections').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Section;
  },

  deleteSection: async (id: string) => {
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) throw error;
  },


  // Attempts
  submitHybridAssessment: async (params: {
    categoryId: string,
    sectionA: { rawScore: number, maxScore: number, snapshot: Record<string, string> },
    sectionB: { questionId: string, answerText: string }[]
  }) => {
    // Calls the atomic RPC to ensure attempt and sections are created together
    const { data, error } = await supabase.rpc('create_and_submit_hybrid_attempt', {
      p_category_id: params.categoryId,
      p_section_a: {
        raw_score: params.sectionA.rawScore,
        max_score: params.sectionA.maxScore,
        snapshot: params.sectionA.snapshot
      },
      p_section_b: params.sectionB.map(s => ({
        question_id: s.questionId,
        answer_text: s.answerText
      }))
    });

    if (error) throw error;
    return data; // Returns the new attempt_id
  },




  getTutorAttempts: async (userId: string, filterStatus: 'graded' | 'all' = 'graded') => {
    let query = supabase
      .from('attempts')
      .select(`
        *,
        categories (name)
      `)
      .eq('user_id', userId);

    if (filterStatus === 'graded') {
      query = query.eq('status', 'graded');
    }

    const { data, error } = await query.order('completed_at', { ascending: false });

    if (error) throw error;
    return data;
  },


  // Tutor Account Management
  getAllTutors: async () => {
    // Fetches all users with role 'tutor' and aggregates their attempt stats
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        attempts (
          percentage
        )
      `)
      .eq('role', 'tutor')
      .order('full_name', { ascending: true });

    if (userError) throw userError;

    return users.map((u: { attempts: { percentage: number }[] } & User) => {
      const attempts = u.attempts || [];
      const avg = attempts.length > 0 
        ? attempts.reduce((acc: number, curr: { percentage: number }) => acc + curr.percentage, 0) / attempts.length
        : null;
      
      return {
        ...u,
        total_attempts: attempts.length,
        average_score: avg
      };
    });
  },

  updateUserAccount: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  triggerPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  // Manual Unlock
  unlockTutorRetake: async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ retake_allowed_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Review Queue
  getReviewQueue: async () => {
    const { data, error } = await supabase
      .from('review_queue')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  getAttemptForReview: async (attemptId: string) => {
    // 1. Fetch Attempt & Section A Score
    const { data: attempt, error: aError } = await supabase
      .from('attempts')
      .select('*, categories(name), section_a_scores(*)')
      .eq('id', attemptId)
      .single();

    if (aError) throw aError;

    // 2. Fetch Section B Submissions with Question details
    const { data: submissions, error: sError } = await supabase
      .from('section_b_submissions')
      .select('*, questions(*)')
      .eq('attempt_id', attemptId);

    if (sError) throw sError;

    return {
      attempt,
      submissions
    };
  },

  submitReview: async (attemptId: string, reviews: { submission_id: string, score: number, feedback?: string }[]) => {
    // Fetch the reviewer ID once before the loop
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Insert into reviews table
    const { error: rError } = await supabase
      .from('reviews')
      .insert(reviews.map(r => ({
        ...r,
        reviewer_id: user?.id
      })));

    if (rError) throw rError;

    // 2. Call finalize function
    const { error: fError } = await supabase.rpc('finalize_attempt_review', {
      p_attempt_id: attemptId
    });

    if (fError) throw fError;

    return true;
  },

  getAdminStats: async () => {
    const { data: tutors, error: tutorError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'tutor');

    const { data: attempts, error: attemptError } = await supabase
      .from('attempts')
      .select('*, categories(name)')
      .eq('status', 'graded'); // Metrics only based on finalized reviews


    if (tutorError || attemptError) throw tutorError || attemptError;

    // Calculate individual tutor stats with OMI
    const tutorStats = tutors.map(t => {
      const tAttempts = attempts.filter(a => a.user_id === t.id);
      
      // Get latest attempt per category for OMI
      const latestByCategory: Record<string, typeof tAttempts[0]> = {};
      tAttempts.forEach(a => {
        if (!latestByCategory[a.category_id] || new Date(a.completed_at) > new Date(latestByCategory[a.category_id].completed_at)) {
          latestByCategory[a.category_id] = a;
        }
      });
      const latestAttempts = Object.values(latestByCategory);
      
      const hasTakenTests = tAttempts.length > 0;
      const avg = hasTakenTests 
        ? tAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / tAttempts.length 
        : null;
      
      const omi = calculateOMI(latestAttempts);
      
      return {
        ...t,
        avgPercentage: avg,
        omi: omi,
        testsTaken: tAttempts.length
      };
    });

    // 1. Global Metrics: ONLY include active tutors
    const activeTutors = tutorStats.filter(t => t.testsTaken > 0);
    const avgGlobalScore = activeTutors.length > 0 
      ? activeTutors.reduce((acc, curr) => acc + (curr.avgPercentage || 0), 0) / activeTutors.length 
      : 0;
    
    const avgGlobalOMI = activeTutors.length > 0
      ? activeTutors.reduce((acc, curr) => acc + (curr.omi || 0), 0) / activeTutors.length
      : 0;

    // 2. Category Performance (Normalization logic)
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

    // 3. Leaderboard: Excludes tutors with 0 attempts
    const leaderboard = [...activeTutors].sort((a, b) => (b.avgPercentage || 0) - (a.avgPercentage || 0));

    // 4. Risk Detection: average < 60 AND testsTaken > 0
    const below60 = activeTutors.filter(t => t.avgPercentage !== null && t.avgPercentage < 60);
    const inactive = tutorStats.filter(t => t.testsTaken === 0);

    return {
      metrics: {
        totalTutors: tutors.length,
        activeTutorsCount: activeTutors.length,
        avgGlobalScore: Math.round(avgGlobalScore),
        avgGlobalOMI: Math.round(avgGlobalOMI),
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
