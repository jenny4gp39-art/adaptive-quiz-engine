import { DifficultyTier, Question, QuizQuestionAnswer, TopicMastery } from '../types';

export const MIN_ABILITY = 50;
export const MAX_ABILITY = 990;
export const DEFAULT_STARTING_ABILITY = 500;

export function getDifficultyTier(score: number): DifficultyTier {
  if (score < 350) return 'Novice';
  if (score < 550) return 'Intermediate';
  if (score < 700) return 'Proficient';
  if (score < 850) return 'Advanced';
  return 'Master';
}

export function getTierColor(tier: DifficultyTier): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  progress: string;
} {
  switch (tier) {
    case 'Novice':
      return {
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        progress: 'bg-emerald-500',
      };
    case 'Intermediate':
      return {
        bg: 'bg-cyan-950/40',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        progress: 'bg-cyan-500',
      };
    case 'Proficient':
      return {
        bg: 'bg-blue-950/40',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        progress: 'bg-blue-500',
      };
    case 'Advanced':
      return {
        bg: 'bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        progress: 'bg-amber-500',
      };
    case 'Master':
      return {
        bg: 'bg-purple-950/40',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        progress: 'bg-purple-500',
      };
  }
}

/**
 * Calculates theoretical probability of answering correctly based on IRT Elo formula
 * P = c + (1 - c) / (1 + 10^((Difficulty - Ability) / 400))
 * c = guessing baseline (0.20 for 4 options with guessing penalty consideration)
 */
export function calculateWinProbability(ability: number, difficulty: number): number {
  const c = 0.20;
  const exponent = (difficulty - ability) / 400;
  const logistic = 1 / (1 + Math.pow(10, exponent));
  const probability = c + (1 - c) * logistic;
  return Math.min(0.98, Math.max(0.05, probability));
}

/**
 * Calculates adaptive ability delta after an answer
 */
export function calculateAbilityDelta(params: {
  currentAbility: number;
  questionDifficulty: number;
  isCorrect: boolean;
  timeSpentMs: number;
  consecutiveStreak: number;
  totalAttempts: number;
}): { delta: number; newAbility: number; expectedProbability: number } {
  const {
    currentAbility,
    questionDifficulty,
    isCorrect,
    timeSpentMs,
    consecutiveStreak,
    totalAttempts,
  } = params;

  const expectedProbability = calculateWinProbability(currentAbility, questionDifficulty);
  const actualOutcome = isCorrect ? 1.0 : 0.0;

  // Adaptive K-factor: higher sensitivity early in test, tapering smoothly
  const baseK = totalAttempts < 5 ? 42 : totalAttempts < 12 ? 34 : 26;

  // Speed multiplier: reward efficient mastery, slightly temper slow correct answers
  const seconds = timeSpentMs / 1000;
  let speedMultiplier = 1.0;

  if (isCorrect) {
    if (seconds <= 10) {
      speedMultiplier = 1.25; // Quick mastery
    } else if (seconds <= 25) {
      speedMultiplier = 1.05;
    } else if (seconds >= 60) {
      speedMultiplier = 0.85; // Hesitant / struggled
    }
  } else {
    if (seconds <= 4) {
      speedMultiplier = 1.15; // Rushed error
    } else {
      speedMultiplier = 0.95; // Deliberate attempt, milder penalty
    }
  }

  // Streak bonus / mitigation
  let streakMultiplier = 1.0;
  if (isCorrect && consecutiveStreak >= 2) {
    streakMultiplier = 1.0 + Math.min(0.35, consecutiveStreak * 0.08); // accelerates to true ceiling
  } else if (!isCorrect && consecutiveStreak <= -2) {
    streakMultiplier = 1.0 + Math.min(0.25, Math.abs(consecutiveStreak) * 0.06); // quickly steps down to comfort level
  }

  // Raw delta calculation
  const rawDelta = baseK * (actualOutcome - expectedProbability) * speedMultiplier * streakMultiplier;

  // Difficulty adjustment dampening: correct answer on much easier question gives small delta; correct answer on hard question gives large delta
  const roundedDelta = Math.round(rawDelta);
  const clampedDelta = Math.max(-65, Math.min(65, roundedDelta));

  const newAbility = Math.max(MIN_ABILITY, Math.min(MAX_ABILITY, currentAbility + clampedDelta));

  return {
    delta: clampedDelta,
    newAbility,
    expectedProbability,
  };
}

/**
 * Selects the optimal next question from available pool
 * Maximizes Fisher Information near the learner's zone of proximal development (ZPD)
 */
export function selectNextQuestion(params: {
  currentAbility: number;
  questionPool: Question[];
  answeredQuestionIds: Set<string>;
  targetTopicIds?: string[];
  topicMasteries?: Record<string, TopicMastery>;
  lastAnswerWasCorrect?: boolean;
}): Question | null {
  const {
    currentAbility,
    questionPool,
    answeredQuestionIds,
    targetTopicIds,
    topicMasteries,
    lastAnswerWasCorrect,
  } = params;

  // Filter out already answered questions
  let candidates = questionPool.filter((q) => !answeredQuestionIds.has(q.id));

  if (candidates.length === 0) return null;

  // If specific topics are targeted, filter by them
  if (targetTopicIds && targetTopicIds.length > 0) {
    const topicFiltered = candidates.filter((q) => targetTopicIds.includes(q.topicId));
    if (topicFiltered.length > 0) {
      candidates = topicFiltered;
    }
  }

  // Zone of Proximal Development Target:
  // If last was correct, target slightly above (+20 to +40)
  // If last was incorrect, target slightly below (-30 to -50)
  const zpdOffset = lastAnswerWasCorrect === undefined ? 0 : lastAnswerWasCorrect ? 25 : -35;
  const targetDifficulty = Math.max(MIN_ABILITY, Math.min(MAX_ABILITY, currentAbility + zpdOffset));

  // Score each candidate by:
  // 1. Closeness to target difficulty
  // 2. Topic priority (lower mastery topics prioritized)
  // 3. Random tie-breaker jitter to avoid deterministic repetition
  const scored = candidates.map((q) => {
    const diffDistance = Math.abs(q.difficulty - targetDifficulty);
    
    // Topic mastery deficit priority (higher deficit = higher priority)
    let topicPriority = 0;
    if (topicMasteries && topicMasteries[q.topicId]) {
      const mastery = topicMasteries[q.topicId].masteryPercentage;
      topicPriority = (100 - mastery) * 0.3; // up to 30 points weighting
    }

    // Combined score: lower is better (closer distance minus topic priority bonus)
    const score = diffDistance - topicPriority + (Math.random() * 15 - 7.5);

    return { question: q, score };
  });

  scored.sort((a, b) => a.score - b.score);

  return scored[0]?.question || candidates[0];
}

/**
 * Updates topic mastery stats after quiz session
 */
export function updateTopicMasteries(
  existingMasteries: Record<string, TopicMastery>,
  answers: QuizQuestionAnswer[],
  subjectId: string
): Record<string, TopicMastery> {
  const updated = { ...existingMasteries };

  const byTopic: Record<string, QuizQuestionAnswer[]> = {};
  for (const ans of answers) {
    const tId = ans.question.topicId;
    if (!byTopic[tId]) byTopic[tId] = [];
    byTopic[tId].push(ans);
  }

  for (const [topicId, topicAnswers] of Object.entries(byTopic)) {
    const sample = topicAnswers[0].question;
    const current = updated[topicId] || {
      topicId,
      topicName: sample.topicName,
      subjectId: sample.subjectId || subjectId,
      masteryPercentage: 50,
      questionsAttempted: 0,
      questionsCorrect: 0,
      avgResponseTimeMs: 0,
      lastUpdated: new Date().toISOString(),
      trend: 'stable' as const,
    };

    const sessionAttempts = topicAnswers.length;
    const sessionCorrect = topicAnswers.filter((a) => a.isCorrect).length;
    const sessionAccuracy = (sessionCorrect / sessionAttempts) * 100;

    // Weight difficulty achieved: answering a 800 difficulty question correctly contributes more to mastery than a 200 question
    let weightedScore = 0;
    let totalWeight = 0;
    for (const a of topicAnswers) {
      const weight = Math.max(0.5, a.question.difficulty / 500);
      totalWeight += weight;
      if (a.isCorrect) {
        weightedScore += weight * 100;
      }
    }
    const sessionWeightedMastery = totalWeight > 0 ? weightedScore / totalWeight : sessionAccuracy;

    // Smooth exponential moving average for mastery
    const alpha = 0.35;
    const previousMastery = current.masteryPercentage;
    const newMastery = Math.round(previousMastery * (1 - alpha) + sessionWeightedMastery * alpha);

    const trend: 'improving' | 'stable' | 'declining' =
      newMastery > previousMastery + 3 ? 'improving' : newMastery < previousMastery - 3 ? 'declining' : 'stable';

    const totalQuestions = current.questionsAttempted + sessionAttempts;
    const totalCorrect = current.questionsCorrect + sessionCorrect;

    const totalTime = current.avgResponseTimeMs * current.questionsAttempted + 
      topicAnswers.reduce((acc, a) => acc + a.timeSpentMs, 0);

    updated[topicId] = {
      ...current,
      masteryPercentage: Math.max(0, Math.min(100, newMastery)),
      questionsAttempted: totalQuestions,
      questionsCorrect: totalCorrect,
      avgResponseTimeMs: Math.round(totalTime / totalQuestions),
      lastUpdated: new Date().toISOString(),
      trend,
    };
  }

  return updated;
}
