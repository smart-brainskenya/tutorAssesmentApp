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
  published: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  category_id: string;
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
  expected_keywords?: { keyword: string; weight: number }[];
  max_score?: number;
  explanation?: string;
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  category_id: string;
  score: number;
  percentage: number;
  completed_at: string;
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option?: 'A' | 'B' | 'C' | 'D'; // For MC
  text_response?: string; // For Short Answer
  score: number;
  matched_keywords?: { keyword: string; weight: number }[];
  is_correct: boolean;
}
