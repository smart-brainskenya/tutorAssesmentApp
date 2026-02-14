export type UserRole = 'admin' | 'tutor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  retake_allowed_at?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
}

export interface Section {
  id: string;
  category_id: string;
  section_type: 'A' | 'B';
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface Question {
  id: string;
  section_id: string;
  question_type: 'multiple_choice' | 'short_answer';
  question_text: string;
  // MC fields
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: 'A' | 'B' | 'C' | 'D';
  // Short Answer fields
  min_word_count?: number;
  rubric_criteria?: { label: string; max: number }[];
  points?: number;
  explanation?: string;
  created_at: string;
}


export interface Attempt {
  id: string;
  user_id: string;
  category_id: string;
  score: number;
  percentage: number;
  status: 'in_progress' | 'submitted' | 'graded';
  completed_at: string;
}

