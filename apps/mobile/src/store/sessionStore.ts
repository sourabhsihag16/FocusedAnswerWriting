import { create } from 'zustand';

export type SessionPhase = 'idle' | 'reading' | 'thinking' | 'writing' | 'completed';

interface Question {
  id: number;
  title: string;
  content: string;
  category: string;
  difficulty: string;
  subject?: string;
  marks: number;
  word_limit: number;
}

interface SessionConfig {
  read_time_seconds: number;
  think_time_seconds: number;
  write_time_seconds: number;
  warning_time_seconds: number;
}

interface SessionState {
  sessionId: number | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  questions: Question[];
  phase: SessionPhase;
  timeRemaining: number;
  totalSessionTime: number;
  config: SessionConfig;
  completedQuestions: number[];
  focusModeEnabled: boolean;

  setQuestions: (questions: Question[]) => void;
  startSession: (sessionId: number, question: Question) => void;
  setPhase: (phase: SessionPhase) => void;
  setTimeRemaining: (time: number) => void;
  incrementTotalTime: () => void;
  completeQuestion: (questionId: number) => void;
  nextQuestion: () => void;
  resetSession: () => void;
  setConfig: (config: SessionConfig) => void;
  setFocusMode: (enabled: boolean) => void;
}

const defaultConfig: SessionConfig = {
  read_time_seconds: 20,
  think_time_seconds: 30,
  write_time_seconds: 300,
  warning_time_seconds: 30,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  questions: [],
  phase: 'idle',
  timeRemaining: 0,
  totalSessionTime: 0,
  config: defaultConfig,
  completedQuestions: [],
  focusModeEnabled: true,

  setQuestions: (questions) => set({ questions }),

  startSession: (sessionId, question) =>
    set({
      sessionId,
      currentQuestion: question,
      phase: 'reading',
      timeRemaining: get().config.read_time_seconds,
      totalSessionTime: 0,
    }),

  setPhase: (phase) => {
    const { config } = get();
    let timeRemaining = 0;

    switch (phase) {
      case 'reading':
        timeRemaining = config.read_time_seconds;
        break;
      case 'thinking':
        timeRemaining = config.think_time_seconds;
        break;
      case 'writing':
        timeRemaining = config.write_time_seconds;
        break;
    }

    set({ phase, timeRemaining });
  },

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  incrementTotalTime: () =>
    set((state) => ({
      totalSessionTime: state.totalSessionTime + 1,
    })),

  completeQuestion: (questionId) =>
    set((state) => ({
      completedQuestions: [...state.completedQuestions, questionId],
    })),

  nextQuestion: () => {
    const { currentQuestionIndex, questions, config } = get();
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      set({
        currentQuestionIndex: nextIndex,
        currentQuestion: questions[nextIndex],
        phase: 'reading',
        timeRemaining: config.read_time_seconds,
      });
    } else {
      set({ phase: 'completed' });
    }
  },

  resetSession: () =>
    set({
      sessionId: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      phase: 'idle',
      timeRemaining: 0,
      totalSessionTime: 0,
      completedQuestions: [],
    }),

  setConfig: (config) => set({ config }),

  setFocusMode: (enabled) => set({ focusModeEnabled: enabled }),
}));
