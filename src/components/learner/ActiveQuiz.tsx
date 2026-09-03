import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Flame,
  Lightbulb,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  HelpCircle,
  X,
  Gauge,
} from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { AbilityBadge } from '../common/AbilityBadge';
import { AiExplainModal } from '../common/AiExplainModal';
import {
  calculateWinProbability,
  getDifficultyTier,
  getTierColor,
} from '../../engine/adaptiveEngine';

export const ActiveQuiz: React.FC = () => {
  const {
    selectedSubject,
    currentSession,
    activeQuestion,
    activeQuestionIndex,
    quizTargetLength,
    currentRunningAbility,
    consecutiveStreak,
    isEvaluatingAnswer,
    lastAnswerResult,
    selectedOptionId,
    submitAnswer,
    proceedToNextQuestion,
    abortQuiz,
  } = useQuiz();

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);

  // Timer interval
  useEffect(() => {
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setShowHint(false);

    if (isEvaluatingAnswer) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuestion?.id, isEvaluatingAnswer]);

  // Keyboard shortcut listener: A, B, C, D / 1, 2, 3, 4 / Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (aiModalOpen) return;

      if (!isEvaluatingAnswer && activeQuestion) {
        const key = e.key.toLowerCase();
        let targetId: string | null = null;
        if (key === 'a' || key === '1') targetId = 'a';
        else if (key === 'b' || key === '2') targetId = 'b';
        else if (key === 'c' || key === '3') targetId = 'c';
        else if (key === 'd' || key === '4') targetId = 'd';

        if (targetId) {
          const optionExists = activeQuestion.options.some((o) => o.id === targetId);
          if (optionExists) {
            const timeSpent = Date.now() - startTime;
            submitAnswer(targetId, timeSpent);
          }
        }
      } else if (isEvaluatingAnswer) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          proceedToNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEvaluatingAnswer, activeQuestion, startTime, aiModalOpen, submitAnswer, proceedToNextQuestion]);

  if (!activeQuestion || !currentSession || !selectedSubject) {
    return null;
  }

  const questionTier = getDifficultyTier(activeQuestion.difficulty);
  const questionTierColor = getTierColor(questionTier);
  const winProbability = Math.round(
    calculateWinProbability(currentRunningAbility, activeQuestion.difficulty) * 100
  );

  const handleSelectOption = (optId: string) => {
    if (isEvaluatingAnswer) return;
    const timeSpent = Date.now() - startTime;
    submitAnswer(optId, timeSpent);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Real-Time Adaptive HUD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Progress & Abort Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold">
              Q{activeQuestionIndex + 1} of {quizTargetLength}
            </span>
            <span className="font-semibold text-slate-300">
              {selectedSubject.name} • {activeQuestion.topicName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
              <Timer className="w-3.5 h-3.5 text-indigo-400" />
              <span>{elapsedSeconds}s</span>
            </div>
            <button
              id="abort-quiz-btn"
              onClick={() => {
                if (confirm('Exit active adaptive quiz session? Current progress will not be saved.')) {
                  abortQuiz();
                }
              }}
              className="text-slate-400 hover:text-rose-400 transition"
              title="Abort quiz"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Adaptive Parameters HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. Live Learner Ability */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium mb-1">Your Ability Rating</div>
            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
              <AbilityBadge score={currentRunningAbility} size="sm" />
            </div>
          </div>

          {/* 2. Question Difficulty */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium mb-1">Item Difficulty</div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${questionTierColor.badge}`}>
                {activeQuestion.difficulty} • {questionTier}
              </span>
            </div>
          </div>

          {/* 3. Expected Win Probability */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium mb-1">Win Expectancy</div>
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>{winProbability}%</span>
              <span className="text-[10px] text-slate-400 font-normal">(IRT)</span>
            </div>
          </div>

          {/* 4. Current Streak */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium mb-1">Adaptive Streak</div>
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              <Flame className={`w-4 h-4 ${consecutiveStreak > 1 ? 'animate-bounce fill-amber-400' : ''}`} />
              <span>{consecutiveStreak > 0 ? `+${consecutiveStreak} Correct` : consecutiveStreak < 0 ? `${consecutiveStreak}` : '0'}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar across quiz */}
        <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${((activeQuestionIndex + 1) / quizTargetLength) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div
        id="active-question-card"
        className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6"
      >
        {/* Question Text */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-500/20 px-2 py-0.5 rounded">
              {activeQuestion.topicName}
            </span>
            {activeQuestion.isAiGenerated && (
              <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> AI Calibrated
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed font-sans">
            {activeQuestion.text}
          </h2>

          {activeQuestion.codeSnippet && (
            <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
              {activeQuestion.codeSnippet}
            </pre>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {activeQuestion.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.id === activeQuestion.correctOptionId;

            let optionStyle =
              'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700 cursor-pointer';

            if (isEvaluatingAnswer) {
              if (isCorrect) {
                optionStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-100 ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                optionStyle = 'bg-rose-950/60 border-rose-500 text-rose-100 ring-1 ring-rose-500';
              } else {
                optionStyle = 'bg-slate-950/40 border-slate-850 opacity-40 text-slate-500 cursor-not-allowed';
              }
            }

            return (
              <button
                key={option.id}
                id={`option-btn-${option.id}`}
                onClick={() => handleSelectOption(option.id)}
                disabled={isEvaluatingAnswer}
                className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between gap-4 group text-sm ${optionStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase transition ${
                      isEvaluatingAnswer && isCorrect
                        ? 'bg-emerald-500 text-slate-950'
                        : isEvaluatingAnswer && isSelected && !isCorrect
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {option.id}
                  </span>
                  <span className="font-medium text-slate-100">{option.text}</span>
                </div>

                {isEvaluatingAnswer && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isEvaluatingAnswer && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Socratic Hint & AI Tutor Assist */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div>
            {!isEvaluatingAnswer && activeQuestion.hint && (
              <div>
                {!showHint ? (
                  <button
                    id="show-hint-btn"
                    onClick={() => setShowHint(true)}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Need a Hint?
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2 max-w-lg">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{activeQuestion.hint}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            id="open-ai-socratic-tutor-btn"
            onClick={() => setAiModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask Gemini Tutor</span>
          </button>
        </div>
      </div>

      {/* Immediate Evaluation Feedback Card */}
      {isEvaluatingAnswer && lastAnswerResult && (
        <div
          id="quiz-feedback-card"
          className={`p-6 rounded-2xl border shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            lastAnswerResult.isCorrect
              ? 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500/40'
              : 'bg-gradient-to-r from-rose-950/70 to-slate-900 border-rose-500/40'
          }`}
        >
          {/* Header & Delta Result */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  lastAnswerResult.isCorrect
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {lastAnswerResult.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {lastAnswerResult.isCorrect ? 'Correct!' : 'Incorrect'}
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      lastAnswerResult.delta >= 0
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/30 text-rose-300'
                    }`}
                  >
                    Ability Delta: {lastAnswerResult.delta >= 0 ? `+${lastAnswerResult.delta}` : lastAnswerResult.delta}
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  New Ability Score: <strong className="text-white">{lastAnswerResult.abilityAfter}</strong> ({getDifficultyTier(lastAnswerResult.abilityAfter)})
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400 sm:text-right font-mono">
              Speed: {(lastAnswerResult.timeSpentMs / 1000).toFixed(1)}s
            </div>
          </div>

          {/* Explanation */}
          <div className="text-sm text-slate-200 space-y-1 leading-relaxed">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Conceptual Explanation
            </div>
            <p>{activeQuestion.explanation}</p>
          </div>

          {/* Next CTA Button */}
          <div className="flex justify-end pt-2">
            <button
              id="next-question-btn"
              onClick={proceedToNextQuestion}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition flex items-center gap-2"
            >
              <span>
                {activeQuestionIndex + 1 >= quizTargetLength
                  ? 'Complete & View Diagnostic Report'
                  : 'Next Adaptive Question'}
              </span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-[10px] opacity-70 bg-indigo-700 px-1.5 py-0.5 rounded font-mono">
                [↵ Enter]
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Socratic AI Tutor Modal */}
      <AiExplainModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        question={activeQuestion}
        selectedOptionId={selectedOptionId || undefined}
      />
    </div>
  );
};
