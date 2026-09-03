export type DifficultyTier = 'Novice' | 'Intermediate' | 'Proficient' | 'Advanced' | 'Master';

export interface TopicMastery {
  topicId: string;
  topicName: string;
  subjectId: string;
  masteryPercentage: number; // 0 - 100
  questionsAttempted: number;
  questionsCorrect: number;
  avgResponseTimeMs: number;
  lastUpdated: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  difficulty: number; // 0 - 1000
  difficultyTier: DifficultyTier;
  text: string;
  codeSnippet?: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
  hint?: string;
  discrimination?: number; // IRT parameter a (default 1.0 - 2.5)
  author?: string;
  isAiGenerated?: boolean;
  tags?: string[];
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  topics: {
    id: string;
    name: string;
    description: string;
  }[];
}

export interface QuizQuestionAnswer {
  question: Question;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpentMs: number;
  abilityBefore: number;
  abilityAfter: number;
  difficulty: number;
  expectedProbability: number;
  delta: number;
}

export interface AbilityHistoryPoint {
  timestamp: string;
  abilityScore: number;
  quizSessionId: string;
  subjectId: string;
  delta: number;
}

export interface QuizSession {
  id: string;
  learnerId: string;
  learnerName: string;
  subjectId: string;
  subjectName: string;
  topicIds: string[];
  mode: 'standard_adaptive' | 'diagnostic' | 'weak_topics_drill' | 'speed_challenge';
  startedAt: string;
  completedAt?: string;
  initialAbility: number;
  finalAbility: number;
  abilityDelta: number;
  answers: QuizQuestionAnswer[];
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  avgResponseTimeMs: number;
  identifiedWeakTopics: string[];
  aiDiagnostics?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendedActions: string[];
  };
}

export interface LearnerProfile {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'teacher' | 'admin';
  gradeLevel?: string;
  currentAbilityScore: number; // Global overall 0-1000
  subjectAbilities: Record<string, number>; // subjectId -> ability score
  topicMasteries: Record<string, TopicMastery>; // topicId -> TopicMastery
  history: AbilityHistoryPoint[];
  sessions: QuizSession[];
  streakDays: number;
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  subjectId: string;
  topicIds: string[];
  targetQuestionCount: number;
  startingDifficulty: number;
  dueDate: string;
  assignedStudentIds: string[];
  status: 'active' | 'completed' | 'draft';
}
