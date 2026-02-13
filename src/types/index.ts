export type UserRole = 'admin' | 'tutor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
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
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
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
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
}
