import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LearnerProfile,
  Question,
  QuizQuestionAnswer,
  QuizSession,
  Subject,
  TeacherAssignment,
  TopicMastery,
} from '../types';
import {
  INITIAL_ASSIGNMENTS,
  INITIAL_PROFILES,
  INITIAL_QUESTIONS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHER,
} from '../data/initialData';
import {
  calculateAbilityDelta,
  DEFAULT_STARTING_ABILITY,
  selectNextQuestion,
  updateTopicMasteries,
} from '../engine/adaptiveEngine';
import { generateFreshQuestionBank } from '../engine/questionGenerator';
import { getAiDiagnostics, generateFullBankWithAi } from '../services/aiService';
import confetti from 'canvas-confetti';

interface QuizContextType {
  // Navigation & Role
  activeView: 'subjects' | 'active_quiz' | 'quiz_results' | 'learner_dashboard' | 'teacher_dashboard' | 'admin_dashboard';
  setActiveView: (view: 'subjects' | 'active_quiz' | 'quiz_results' | 'learner_dashboard' | 'teacher_dashboard' | 'admin_dashboard') => void;
  currentProfile: LearnerProfile;
  profiles: LearnerProfile[];
  switchProfile: (profileId: string) => void;
  updateProfileName: (name: string) => void;

  // Subjects & Question Bank
  subjects: Subject[];
  questions: Question[];
  addCustomQuestion: (q: Question) => void;
  addMultipleQuestions: (qs: Question[]) => void;
  assignments: TeacherAssignment[];
  createAssignment: (assignment: TeacherAssignment) => void;

  // Fresh Question Bank Session State
  isGeneratingBank: boolean;
  bankGeneratedAt: string;
  bankNotification: string | null;
  clearBankNotification: () => void;
  regenerateQuestionBank: (options?: { includeAi?: boolean }) => Promise<void>;

  // Active Quiz State
  selectedSubject: Subject | null;
  selectedTopicIds: string[];
  quizMode: 'standard_adaptive' | 'diagnostic' | 'weak_topics_drill' | 'speed_challenge';
  quizTargetLength: number;
  currentSession: QuizSession | null;
  activeQuestion: Question | null;
  activeQuestionIndex: number;
  currentRunningAbility: number;
  consecutiveStreak: number;
  isEvaluatingAnswer: boolean;
  lastAnswerResult: QuizQuestionAnswer | null;
  selectedOptionId: string | null;
  
  // Actions
  startQuiz: (params: {
    subject: Subject;
    topicIds?: string[];
    mode?: 'standard_adaptive' | 'diagnostic' | 'weak_topics_drill' | 'speed_challenge';
    targetLength?: number;
    initialStartingAbility?: number;
  }) => void;
  submitAnswer: (optionId: string, timeSpentMs: number) => void;
  proceedToNextQuestion: () => void;
  abortQuiz: () => void;
  startTargetedRemediationDrill: (subjectId: string, topicIds: string[]) => void;
  resetAllData: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const STORAGE_KEY_PROFILES = 'adaptive_quiz_profiles_v1';
const STORAGE_KEY_QUESTIONS = 'adaptive_quiz_questions_v1';
const STORAGE_KEY_ASSIGNMENTS = 'adaptive_quiz_assignments_v1';
const STORAGE_KEY_CURRENT_PROFILE_ID = 'adaptive_quiz_current_profile_id_v1';

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Profiles State
  const [profiles, setProfiles] = useState<LearnerProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved profiles', e);
      }
    }
    return [...INITIAL_PROFILES, INITIAL_TEACHER];
  });

  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CURRENT_PROFILE_ID) || 'student_alex';
  });

  // Questions Bank State - generates fresh question bank every time app is opened!
  const [questions, setQuestions] = useState<Question[]>(() => {
    return generateFreshQuestionBank();
  });
  const [isGeneratingBank, setIsGeneratingBank] = useState<boolean>(false);
  const [bankGeneratedAt, setBankGeneratedAt] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const [bankNotification, setBankNotification] = useState<string | null>(
    '✨ Fresh question set generated for this session across all topics.'
  );

  // When the app opens, generate additional AI items with Gemini in the background
  useEffect(() => {
    let isMounted = true;
    setIsGeneratingBank(true);
    generateFullBankWithAi(8)
      .then((aiItems) => {
        if (isMounted && aiItems.length > 0) {
          setQuestions((prev) => [...aiItems, ...prev]);
          setBankNotification(`✨ Generated ${aiItems.length} novel AI psychometric questions to enrich this session.`);
        }
        if (isMounted) setIsGeneratingBank(false);
      })
      .catch((err) => {
        console.warn('AI bank generation issue:', err);
        if (isMounted) setIsGeneratingBank(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const clearBankNotification = () => setBankNotification(null);

  const regenerateQuestionBank = async (options?: { includeAi?: boolean }) => {
    setIsGeneratingBank(true);
    const freshProcedural = generateFreshQuestionBank();
    setQuestions(freshProcedural);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBankGeneratedAt(timeStr);
    setBankNotification(`✨ Generated fresh question set (${freshProcedural.length} items calibrated).`);

    if (options?.includeAi !== false) {
      try {
        const aiItems = await generateFullBankWithAi(8);
        if (aiItems.length > 0) {
          setQuestions((prev) => [...aiItems, ...prev]);
          setBankNotification(`✨ Brand-new question bank active: ${freshProcedural.length + aiItems.length} items (including Gemini AI additions).`);
        }
      } catch (e) {
        console.warn('AI bank addition failed', e);
      }
    }
    setIsGeneratingBank(false);
  };

  // Assignments
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved assignments', e);
      }
    }
    return INITIAL_ASSIGNMENTS;
  });

  // Active Navigation View
  const [activeView, setActiveView] = useState<'subjects' | 'active_quiz' | 'quiz_results' | 'learner_dashboard' | 'teacher_dashboard' | 'admin_dashboard'>('subjects');

  // Active Quiz State
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [quizMode, setQuizMode] = useState<'standard_adaptive' | 'diagnostic' | 'weak_topics_drill' | 'speed_challenge'>('standard_adaptive');
  const [quizTargetLength, setQuizTargetLength] = useState<number>(6);
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [currentRunningAbility, setCurrentRunningAbility] = useState<number>(DEFAULT_STARTING_ABILITY);
  const [consecutiveStreak, setConsecutiveStreak] = useState<number>(0);
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState<boolean>(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<QuizQuestionAnswer | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0] || INITIAL_PROFILES[0];

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_PROFILE_ID, currentProfileId);
  }, [currentProfileId]);

  const switchProfile = (profileId: string) => {
    setCurrentProfileId(profileId);
    const target = profiles.find((p) => p.id === profileId);
    if (target?.role === 'teacher') {
      setActiveView('teacher_dashboard');
    } else if (target?.role === 'admin') {
      setActiveView('admin_dashboard');
    } else {
      setActiveView('subjects');
    }
  };

  const updateProfileName = (name: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? { ...p, name } : p))
    );
  };

  const addCustomQuestion = (q: Question) => {
    setQuestions((prev) => [q, ...prev]);
  };

  const addMultipleQuestions = (qs: Question[]) => {
    setQuestions((prev) => [...qs, ...prev]);
  };

  const createAssignment = (assignment: TeacherAssignment) => {
    setAssignments((prev) => [assignment, ...prev]);
  };

  // Start Quiz
  const startQuiz = (params: {
    subject: Subject;
    topicIds?: string[];
    mode?: 'standard_adaptive' | 'diagnostic' | 'weak_topics_drill' | 'speed_challenge';
    targetLength?: number;
    initialStartingAbility?: number;
  }) => {
    const {
      subject,
      topicIds = subject.topics.map((t) => t.id),
      mode = 'standard_adaptive',
      targetLength = 6,
      initialStartingAbility,
    } = params;

    // Determine initial ability: from specific subject profile or global ability or override
    const startingAbility =
      initialStartingAbility ??
      currentProfile.subjectAbilities[subject.id] ??
      currentProfile.currentAbilityScore ??
      DEFAULT_STARTING_ABILITY;

    setSelectedSubject(subject);
    setSelectedTopicIds(topicIds);
    setQuizMode(mode);
    setQuizTargetLength(targetLength);
    setCurrentRunningAbility(startingAbility);
    setConsecutiveStreak(0);
    setActiveQuestionIndex(0);
    setIsEvaluatingAnswer(false);
    setLastAnswerResult(null);
    setSelectedOptionId(null);

    const pool = questions.filter((q) => q.subjectId === subject.id);
    const initialAnswered = new Set<string>();
    setAnsweredQuestionIds(initialAnswered);

    const firstQuestion = selectNextQuestion({
      currentAbility: startingAbility,
      questionPool: pool,
      answeredQuestionIds: initialAnswered,
      targetTopicIds: topicIds,
      topicMasteries: currentProfile.topicMasteries,
    });

    if (!firstQuestion) {
      console.warn('No questions found for subject', subject.id);
      return;
    }

    const newSession: QuizSession = {
      id: `session_${Date.now()}`,
      learnerId: currentProfile.id,
      learnerName: currentProfile.name,
      subjectId: subject.id,
      subjectName: subject.name,
      topicIds,
      mode,
      startedAt: new Date().toISOString(),
      initialAbility: startingAbility,
      finalAbility: startingAbility,
      abilityDelta: 0,
      answers: [],
      totalQuestions: targetLength,
      correctAnswers: 0,
      accuracyPercentage: 0,
      avgResponseTimeMs: 0,
      identifiedWeakTopics: [],
    };

    setCurrentSession(newSession);
    setActiveQuestion(firstQuestion);
    setActiveView('active_quiz');
  };

  // Submit Answer
  const submitAnswer = (optionId: string, timeSpentMs: number) => {
    if (!activeQuestion || !currentSession || isEvaluatingAnswer) return;

    setSelectedOptionId(optionId);
    setIsEvaluatingAnswer(true);

    const isCorrect = optionId === activeQuestion.correctOptionId;
    const newStreak = isCorrect
      ? Math.max(1, consecutiveStreak + 1)
      : Math.min(-1, consecutiveStreak <= 0 ? consecutiveStreak - 1 : -1);

    setConsecutiveStreak(newStreak);

    // Compute mathematical ability delta using IRT Engine
    const deltaResult = calculateAbilityDelta({
      currentAbility: currentRunningAbility,
      questionDifficulty: activeQuestion.difficulty,
      isCorrect,
      timeSpentMs,
      consecutiveStreak: newStreak,
      totalAttempts: currentSession.answers.length + 1,
    });

    const newAbility = deltaResult.newAbility;
    setCurrentRunningAbility(newAbility);

    const answerRecord: QuizQuestionAnswer = {
      question: activeQuestion,
      selectedOptionId: optionId,
      isCorrect,
      timeSpentMs,
      abilityBefore: currentRunningAbility,
      abilityAfter: newAbility,
      difficulty: activeQuestion.difficulty,
      expectedProbability: deltaResult.expectedProbability,
      delta: deltaResult.delta,
    };

    setLastAnswerResult(answerRecord);

    // Update answered set
    const updatedAnswered = new Set(answeredQuestionIds);
    updatedAnswered.add(activeQuestion.id);
    setAnsweredQuestionIds(updatedAnswered);

    // Update current session answers
    const updatedAnswers = [...currentSession.answers, answerRecord];
    const correctCount = updatedAnswers.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / updatedAnswers.length) * 100);
    const avgTime = Math.round(
      updatedAnswers.reduce((sum, a) => sum + a.timeSpentMs, 0) / updatedAnswers.length
    );

    const updatedSession: QuizSession = {
      ...currentSession,
      answers: updatedAnswers,
      finalAbility: newAbility,
      abilityDelta: newAbility - currentSession.initialAbility,
      correctAnswers: correctCount,
      accuracyPercentage: accuracy,
      avgResponseTimeMs: avgTime,
    };

    setCurrentSession(updatedSession);

    // Confetti effect for streaks >= 3
    if (isCorrect && newStreak >= 3) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  // Proceed to next question or finalize quiz
  const proceedToNextQuestion = async () => {
    if (!currentSession || !selectedSubject) return;

    const nextIndex = activeQuestionIndex + 1;

    // Check if quiz completed
    if (nextIndex >= quizTargetLength) {
      finalizeQuizSession(currentSession);
      return;
    }

    // Select next optimal adaptive question
    const pool = questions.filter((q) => q.subjectId === selectedSubject.id);
    const nextQ = selectNextQuestion({
      currentAbility: currentRunningAbility,
      questionPool: pool,
      answeredQuestionIds,
      targetTopicIds: selectedTopicIds,
      topicMasteries: currentProfile.topicMasteries,
      lastAnswerWasCorrect: lastAnswerResult?.isCorrect,
    });

    if (!nextQ) {
      // Out of unused questions, finalize early
      finalizeQuizSession(currentSession);
      return;
    }

    setActiveQuestionIndex(nextIndex);
    setActiveQuestion(nextQ);
    setSelectedOptionId(null);
    setLastAnswerResult(null);
    setIsEvaluatingAnswer(false);
  };

  // Finalize Quiz Session
  const finalizeQuizSession = async (session: QuizSession) => {
    if (!selectedSubject) return;

    const completedSession: QuizSession = {
      ...session,
      completedAt: new Date().toISOString(),
    };

    // Update Topic Masteries
    const updatedMasteries = updateTopicMasteries(
      currentProfile.topicMasteries,
      session.answers,
      selectedSubject.id
    );

    // Identify weak topics (mastery < 55%)
    const weakTopics = Object.values(updatedMasteries)
      .filter((m) => m.subjectId === selectedSubject.id && m.masteryPercentage < 55)
      .map((m) => m.topicName);

    completedSession.identifiedWeakTopics = weakTopics;

    // Trigger celebration confetti
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
    });

    // Update Profile state
    const newHistoryPoint = {
      timestamp: new Date().toISOString().split('T')[0],
      abilityScore: completedSession.finalAbility,
      quizSessionId: completedSession.id,
      subjectId: selectedSubject.id,
      delta: completedSession.abilityDelta,
    };

    const updatedProfile: LearnerProfile = {
      ...currentProfile,
      currentAbilityScore: completedSession.finalAbility,
      subjectAbilities: {
        ...currentProfile.subjectAbilities,
        [selectedSubject.id]: completedSession.finalAbility,
      },
      topicMasteries: updatedMasteries,
      history: [...currentProfile.history, newHistoryPoint],
      sessions: [completedSession, ...currentProfile.sessions],
      totalQuizzesTaken: currentProfile.totalQuizzesTaken + 1,
      totalQuestionsAnswered: currentProfile.totalQuestionsAnswered + session.answers.length,
      streakDays: currentProfile.streakDays + 1,
    };

    setProfiles((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? updatedProfile : p))
    );

    setCurrentSession(completedSession);
    setActiveView('quiz_results');

    // Asynchronously fetch AI diagnostic insights
    try {
      const aiDiag = await getAiDiagnostics({
        learnerName: currentProfile.name,
        subjectName: selectedSubject.name,
        abilityScore: completedSession.finalAbility,
        answers: completedSession.answers,
        topicMasteries: updatedMasteries,
      });

      setCurrentSession((prev) =>
        prev && prev.id === completedSession.id
          ? {
              ...prev,
              aiDiagnostics: {
                summary: aiDiag.summary,
                strengths: aiDiag.strengths,
                weaknesses: aiDiag.weaknesses,
                recommendedActions: aiDiag.recommendedActions,
              },
            }
          : prev
      );
    } catch (err) {
      console.warn('AI diagnostics non-blocking error:', err);
    }
  };

  const abortQuiz = () => {
    setCurrentSession(null);
    setActiveQuestion(null);
    setActiveView('subjects');
  };

  const startTargetedRemediationDrill = (subjectId: string, topicIds: string[]) => {
    const subject = INITIAL_SUBJECTS.find((s) => s.id === subjectId) || INITIAL_SUBJECTS[0];
    startQuiz({
      subject,
      topicIds,
      mode: 'weak_topics_drill',
      targetLength: 5,
    });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_PROFILES);
    localStorage.removeItem(STORAGE_KEY_QUESTIONS);
    localStorage.removeItem(STORAGE_KEY_ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEY_CURRENT_PROFILE_ID);
    setProfiles([...INITIAL_PROFILES, INITIAL_TEACHER]);
    setCurrentProfileId('student_alex');
    setQuestions(generateFreshQuestionBank());
    setBankGeneratedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setBankNotification('✨ Question bank regenerated with a fresh calibrated set.');
    setAssignments(INITIAL_ASSIGNMENTS);
    setActiveView('subjects');
  };

  return (
    <QuizContext.Provider
      value={{
        activeView,
        setActiveView,
        currentProfile,
        profiles,
        switchProfile,
        updateProfileName,
        subjects: INITIAL_SUBJECTS,
        questions,
        addCustomQuestion,
        addMultipleQuestions,
        assignments,
        createAssignment,
        isGeneratingBank,
        bankGeneratedAt,
        bankNotification,
        clearBankNotification,
        regenerateQuestionBank,
        selectedSubject,
        selectedTopicIds,
        quizMode,
        quizTargetLength,
        currentSession,
        activeQuestion,
        activeQuestionIndex,
        currentRunningAbility,
        consecutiveStreak,
        isEvaluatingAnswer,
        lastAnswerResult,
        selectedOptionId,
        startQuiz,
        submitAnswer,
        proceedToNextQuestion,
        abortQuiz,
        startTargetedRemediationDrill,
        resetAllData,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
