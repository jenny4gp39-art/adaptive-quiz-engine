import React, { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Clock,
  Target,
  BrainCircuit,
  BarChart3,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { AbilityBadge } from '../common/AbilityBadge';
import { AiExplainModal } from '../common/AiExplainModal';
import { getDifficultyTier, getTierColor } from '../../engine/adaptiveEngine';
import { Question, TopicMastery } from '../../types';

export const QuizResults: React.FC = () => {
  const {
    currentSession,
    currentProfile,
    setActiveView,
    startQuiz,
    subjects,
    startTargetedRemediationDrill,
  } = useQuiz();

  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [selectedQuestionForAi, setSelectedQuestionForAi] = useState<Question | null>(null);

  if (!currentSession) {
    return (
      <div className="text-center py-20 text-slate-400">
        No active session results found.{' '}
        <button
          onClick={() => setActiveView('subjects')}
          className="text-indigo-400 underline font-semibold ml-2"
        >
          Return to Subjects
        </button>
      </div>
    );
  }

  const subject = subjects.find((s) => s.id === currentSession.subjectId) || subjects[0];
  const finalTier = getDifficultyTier(currentSession.finalAbility);
  const finalTierColors = getTierColor(finalTier);

  const filteredAnswers = currentSession.answers.filter((ans) => {
    if (filterMode === 'incorrect') return !ans.isCorrect;
    if (filterMode === 'correct') return ans.isCorrect;
    return true;
  });

  // Calculate weak topics from this session & profile
  const weakTopicsInSubject = (Object.values(currentProfile.topicMasteries) as TopicMastery[]).filter(
    (m) => m.subjectId === currentSession.subjectId && m.masteryPercentage < 55
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Hero Summary */}
      <div
        id="quiz-results-hero-card"
        className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Session Complete • {currentSession.subjectName}
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                {currentSession.mode.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Adaptive Evaluation Summary
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              The engine converged on your calibrated ability rating across {currentSession.answers.length} dynamic questions.
            </p>
          </div>

          {/* Ability Score Hero Box */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 self-start lg:self-auto">
            <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Final Demonstrated Ability</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-white font-sans">
                  {currentSession.finalAbility}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 1000</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    currentSession.abilityDelta >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {currentSession.abilityDelta >= 0
                    ? `+${currentSession.abilityDelta}`
                    : currentSession.abilityDelta}{' '}
                  Delta
                </span>
              </div>
              <div className={`text-xs font-semibold mt-1 ${finalTierColors.text}`}>
                Tier: {finalTier}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-slate-400">Accuracy</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {currentSession.accuracyPercentage}%
              <span className="text-xs font-normal text-slate-400 ml-1">
                ({currentSession.correctAnswers}/{currentSession.totalQuestions})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-slate-400">Avg Response Time</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {(currentSession.avgResponseTimeMs / 1000).toFixed(1)}s
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-slate-400">Starting Ability</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {currentSession.initialAbility}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-slate-400">Gaps Detected</div>
            <div className={`text-lg font-bold mt-0.5 ${weakTopicsInSubject.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {weakTopicsInSubject.length > 0 ? `${weakTopicsInSubject.length} Topics` : 'None!'}
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Progression Timeline & Step Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Adaptive Calibration Trajectory
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {currentSession.answers.length} items evaluated
          </span>
        </div>

        {/* Step-by-Step Trajectory Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {currentSession.answers.map((ans, idx) => {
              const qTier = getDifficultyTier(ans.difficulty);
              const qColor = getTierColor(qTier);
              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[110px] p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex flex-col justify-between space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Q{idx + 1}</span>
                    {ans.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 truncate">{ans.question.topicName}</div>
                    <div className="font-bold text-white mt-0.5">
                      Diff: <span className={qColor.text}>{ans.difficulty}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">θ: {ans.abilityAfter}</span>
                    <span className={ans.delta >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {ans.delta >= 0 ? `+${ans.delta}` : ans.delta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Notice how correct answers systematically raise difficulty to probe your ceiling, while errors adjust difficulty back to steady-state baseline.
          </p>
        </div>
      </div>

      {/* Topic Mastery Breakdown & Weak Topic Remediation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic Mastery Meters */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-400" />
            Subject Mastery Breakdown
          </h3>

          <div className="space-y-3">
            {subject.topics.map((t) => {
              const mastery = currentProfile.topicMasteries[t.id]?.masteryPercentage ?? 50;
              const isWeak = mastery < 55;
              const isHigh = mastery >= 80;

              return (
                <div key={t.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{t.name}</span>
                    <span
                      className={`font-bold ${
                        isWeak ? 'text-rose-400' : isHigh ? 'text-emerald-400' : 'text-cyan-400'
                      }`}
                    >
                      {mastery}% {isWeak ? '(Weak Area)' : isHigh ? '(Mastered)' : ''}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isWeak ? 'bg-rose-500' : isHigh ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Learning-Gap Diagnostics & Action Plan */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Gap Diagnostics
              </h3>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Gemini Cognitive Analysis
              </span>
            </div>

            {currentSession.aiDiagnostics ? (
              <div className="space-y-3 text-xs text-slate-300">
                <p className="leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-200">
                  {currentSession.aiDiagnostics.summary}
                </p>

                {currentSession.aiDiagnostics.weaknesses?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Core Learning Vulnerabilities:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {currentSession.aiDiagnostics.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                Evaluating cognitive error patterns and topic response speeds...
              </div>
            )}
          </div>

          {/* Quick Action Remediate Button */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              id="start-remediation-drill-btn"
              onClick={() => {
                const weakIds = weakTopicsInSubject.map((w) => w.topicId);
                const targetTopics = weakIds.length > 0 ? weakIds : subject.topics.map((t) => t.id);
                startTargetedRemediationDrill(subject.id, targetTopics);
              }}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Targeted Remediation Practice (5 Questions)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Question-by-Question Review */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Diagnostic Item Review
            </h3>
            <p className="text-xs text-slate-400">
              Review answers, difficulty scores, and step-by-step logic
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="filter-all-questions-btn"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({currentSession.answers.length})
            </button>
            <button
              id="filter-incorrect-questions-btn"
              onClick={() => setFilterMode('incorrect')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'incorrect'
                  ? 'bg-rose-950/60 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Incorrect ({currentSession.answers.filter((a) => !a.isCorrect).length})
            </button>
            <button
              id="filter-correct-questions-btn"
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1 rounded-lg transition ${
                filterMode === 'correct'
                  ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Correct ({currentSession.answers.filter((a) => a.isCorrect).length})
            </button>
          </div>
        </div>

        {/* Question Review Cards */}
        <div className="space-y-3">
          {filteredAnswers.map((ans, idx) => {
            const q = ans.question;
            const qTier = getDifficultyTier(q.difficulty);
            const qTierColor = getTierColor(qTier);
            const selectedOpt = q.options.find((o) => o.id === ans.selectedOptionId);
            const correctOpt = q.options.find((o) => o.id === q.correctOptionId);

            return (
              <div
                key={q.id || idx}
                id={`review-question-card-${idx}`}
                className={`p-4 rounded-xl border text-xs space-y-3 transition ${
                  ans.isCorrect
                    ? 'bg-slate-950/40 border-slate-800/80'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {ans.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-300">Question #{idx + 1}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-indigo-400 font-semibold">{q.topicName}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${qTierColor.badge}`}>
                          Diff: {q.difficulty} ({qTier})
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white leading-relaxed">{q.text}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-slate-400 font-mono">{(ans.timeSpentMs / 1000).toFixed(1)}s</span>
                    <div className={ans.delta >= 0 ? 'text-emerald-400 font-bold font-mono' : 'text-rose-400 font-bold font-mono'}>
                      {ans.delta >= 0 ? `+${ans.delta}` : ans.delta} θ
                    </div>
                  </div>
                </div>

                {/* Option Choice Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                  <div className={`p-2.5 rounded-lg border ${ans.isCorrect ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-rose-950/40 border-rose-500/30 text-rose-200'}`}>
                    <span className="text-[10px] opacity-80 block font-semibold">Your Selection:</span>
                    <span className="font-medium">({selectedOpt?.id?.toUpperCase()}) {selectedOpt?.text}</span>
                  </div>

                  {!ans.isCorrect && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
                      <span className="text-[10px] opacity-80 block font-semibold">Correct Answer:</span>
                      <span className="font-medium">({correctOpt?.id?.toUpperCase()}) {correctOpt?.text}</span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="p-3 rounded-lg bg-slate-900 text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300 block mb-1">Explanation:</strong>
                  {q.explanation}
                </div>

                {/* Ask AI Tutor on this item */}
                <div className="flex justify-end">
                  <button
                    id={`ask-ai-tutor-question-${idx}`}
                    onClick={() => setSelectedQuestionForAi(q)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Deep Dive with Gemini Socratic Tutor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          id="back-to-subjects-btn"
          onClick={() => setActiveView('subjects')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Choose Another Subject
        </button>

        <button
          id="view-full-progress-dashboard-btn"
          onClick={() => setActiveView('learner_dashboard')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <span>View Longitudinal Progress Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Socratic Deep Dive Modal */}
      {selectedQuestionForAi && (
        <AiExplainModal
          isOpen={Boolean(selectedQuestionForAi)}
          onClose={() => setSelectedQuestionForAi(null)}
          question={selectedQuestionForAi}
        />
      )}
    </div>
  );
};
