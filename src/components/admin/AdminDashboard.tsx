import React, { useState } from 'react';
import {
  Shield,
  Sliders,
  Cpu,
  Database,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import {
  calculateWinProbability,
  calculateAbilityDelta,
  getDifficultyTier,
  getTierColor,
} from '../../engine/adaptiveEngine';

export const AdminDashboard: React.FC = () => {
  const { questions, profiles, subjects, resetAllData } = useQuiz();

  // Psychometric Simulator Sandbox state
  const [simLearnerScore, setSimLearnerScore] = useState<number>(600);
  const [simQuestionDiff, setSimQuestionDiff] = useState<number>(650);
  const [simKFactor, setSimKFactor] = useState<number>(36);
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(12);

  // Distribution of question bank
  const distribution = {
    Novice: questions.filter((q) => q.difficulty < 300).length,
    Intermediate: questions.filter((q) => q.difficulty >= 300 && q.difficulty < 550).length,
    Proficient: questions.filter((q) => q.difficulty >= 550 && q.difficulty < 750).length,
    Advanced: questions.filter((q) => q.difficulty >= 750 && q.difficulty < 900).length,
    Master: questions.filter((q) => q.difficulty >= 900).length,
  };

  const simWinProb = calculateWinProbability(simLearnerScore, simQuestionDiff);

  const correctRes = calculateAbilityDelta({
    currentAbility: simLearnerScore,
    questionDifficulty: simQuestionDiff,
    isCorrect: true,
    timeSpentMs: simTimeSeconds * 1000,
    consecutiveStreak: 2,
    totalAttempts: 3,
  });
  const correctDelta = correctRes.delta;

  const incorrectRes = calculateAbilityDelta({
    currentAbility: simLearnerScore,
    questionDifficulty: simQuestionDiff,
    isCorrect: false,
    timeSpentMs: simTimeSeconds * 1000,
    consecutiveStreak: -1,
    totalAttempts: 3,
  });
  const incorrectDelta = incorrectRes.delta;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              System Administration
            </span>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
              Psychometrics & Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Shield className="w-8 h-8 text-indigo-400" />
            <span>IRT Engine & Calibration Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect Item Response Theory logistic parameters, test calibration curves, and audit item bank psychometric health.
          </p>
        </div>

        <button
          id="admin-reset-all-data-btn"
          onClick={() => {
            if (confirm('Reset entire system database to initial psychometric state?')) {
              resetAllData();
            }
          }}
          className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All App State</span>
        </button>
      </div>

      {/* 4 Health Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 font-medium">IRT Model Specification</div>
          <div className="text-lg font-bold text-white mt-1">2PL Logistic Elo</div>
          <div className="text-[10px] text-indigo-400 mt-0.5">Scale: 0–1000 θ</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 font-medium">Bank Balance Health</div>
          <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Balanced Spectrum
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{questions.length} Active Items</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 font-medium">Calibration Rate</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">6–8 Items</div>
          <div className="text-[10px] text-slate-400 mt-0.5">±25 Point Margin</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 font-medium">AI Backend Bridge</div>
          <div className="text-lg font-bold text-purple-400 mt-1 flex items-center gap-1">
            <Cpu className="w-4 h-4" /> Gemini 2.5 Flash
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Server-Side Proxy</div>
        </div>
      </div>

      {/* Item Bank Difficulty Distribution Histogram */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Item Bank Difficulty Tier Histogram
            </h3>
            <p className="text-xs text-slate-400">
              Distribution of questions across the difficulty spectrum
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{questions.length} Total Items</span>
        </div>

        <div className="grid grid-cols-5 gap-3 pt-4">
          {Object.entries(distribution).map(([tierName, count]) => {
            const tierColors = getTierColor(tierName as any);
            const heightPct = Math.max(10, Math.min(100, (count / Math.max(1, questions.length)) * 250));
            return (
              <div key={tierName} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <div className="text-[11px] font-bold text-slate-300">{tierName}</div>
                <div className="h-24 bg-slate-900 rounded-xl flex items-end justify-center p-1">
                  <div
                    className={`w-full rounded-lg ${tierColors.progress} transition-all duration-500`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <div className="text-xs font-mono font-bold text-white">{count} items</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive IRT Formula Sandbox */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Interactive Psychometric IRT Sandbox
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simulate how the adaptive algorithm evaluates ability deltas ($\Delta\theta$) based on learner ability, item difficulty, and response latency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sliders */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>Learner Ability Score ($\theta$):</span>
                <span className="text-indigo-400 font-mono font-bold">{simLearnerScore}</span>
              </div>
              <input
                type="range"
                min={100}
                max={950}
                step={10}
                value={simLearnerScore}
                onChange={(e) => setSimLearnerScore(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>Question Item Difficulty ($b$):</span>
                <span className="text-cyan-400 font-mono font-bold">{simQuestionDiff}</span>
              </div>
              <input
                type="range"
                min={100}
                max={950}
                step={10}
                value={simQuestionDiff}
                onChange={(e) => setSimQuestionDiff(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>Base K-Factor (Convergence Speed):</span>
                <span className="text-purple-400 font-mono font-bold">{simKFactor}</span>
              </div>
              <input
                type="range"
                min={16}
                max={64}
                step={2}
                value={simKFactor}
                onChange={(e) => setSimKFactor(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>Response Time:</span>
                <span className="text-amber-400 font-mono font-bold">{simTimeSeconds}s</span>
              </div>
              <input
                type="range"
                min={2}
                max={45}
                value={simTimeSeconds}
                onChange={(e) => setSimTimeSeconds(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Live Outcome Calculations */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 text-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mathematical Model Output
            </div>

            {/* Expected Probability */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Calculated Win Expectancy P(Correct):</div>
              <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
                {(simWinProb * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Formula: 1 / (1 + 10^((b - θ)/400))
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* If Correct */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-emerald-400 font-bold">If Answer is Correct:</div>
                <div className="text-xl font-bold text-emerald-300 mt-1">
                  +{correctDelta} Score
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  New $\theta$: {simLearnerScore + correctDelta}
                </div>
              </div>

              {/* If Incorrect */}
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
                <div className="text-rose-400 font-bold">If Answer is Incorrect:</div>
                <div className="text-xl font-bold text-rose-300 mt-1">
                  {incorrectDelta} Score
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  New $\theta$: {simLearnerScore + incorrectDelta}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
