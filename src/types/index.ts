export interface Question {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  time_limit: number;
  question_order: number;
  image_url?: string;
}

export interface ActivityState {
  id: number;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'finished';
  current_question_id: number | null;
  timer_state: number;
}

export interface AppState {
  activity: ActivityState;
  currentQuestion: Question | null;
  currentQuestionNumber: number;
  totalQuestions: number;
}
