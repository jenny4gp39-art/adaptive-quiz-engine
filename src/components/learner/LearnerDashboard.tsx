import React from 'react';
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Award,
  Zap,
  ArrowRight,
  Clock,
  BookOpen,
  Play,
  BrainCircuit,
  Target,
} from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { AbilityBadge } from '../common/AbilityBadge';
import { getDifficultyTier, getTierColor } from '../../engine/adaptiveEngine';
import { TopicMastery } from '../../types';

export const LearnerDashboard: React.FC = () => {
  const {
    currentProfile,
    subjects,
    setActiveView,
    startQuiz,
    startTargetedRemediationDrill,
  } = useQuiz();

  const currentTier = getDifficultyTier(currentProfile.currentAbilityScore);
  const tierColor = getTierColor(currentTier);

  // Group masteries by subject
  const masteriesList = Object.values(currentProfile.topicMasteries) as TopicMastery[];
  const weakTopics = masteriesList.filter((m) => m.masteryPercentage < 55);
  const masteredTopics = masteriesList.filter((m) => m.masteryPercentage >= 80);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Longitudinal Learner Model
            </span>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
              {currentProfile.gradeLevel || 'Standard Student'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>{currentProfile.name}'s Cognitive Mastery</span>
            <span className="text-2xl">{currentProfile.avatar}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            A dynamic mathematical representation of your ability score and knowledge retention across all domain subjects.
          </p>
        </div>

        <button
          id="dashboard-start-quiz-btn"
          onClick={() => setActiveView('subjects')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>New Adaptive Quiz</span>
        </button>
      </div>

      {/* Hero Ability Card & 3 Key Telemetry Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/50 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Composite Ability Rating
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${tierColor.badge}`}>
                {currentTier}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white font-sans">
                {currentProfile.currentAbilityScore}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 1000 max</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your ability is mathematically estimated through Item Response Theory (IRT). You consistently answer questions up to difficulty ~{currentProfile.currentAbilityScore} with 65%+ probability.
            </p>
          </div>

          {/* Scale visual meter */}
          <div className="space-y-1.5 pt-4 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Novice (0)</span>
              <span>Proficient (550)</span>
              <span>Master (1000)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className={`h-full rounded-full ${tierColor.progress}`}
                style={{ width: `${(currentProfile.currentAbilityScore / 1000) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Stats & Streak */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-400" />
            Learning Engagement Stats
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Quizzes Taken</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {currentProfile.totalQuizzesTaken}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Questions Answered</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {currentProfile.totalQuestionsAnswered}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Active Streak</div>
              <div className="text-2xl font-extrabold text-amber-400 flex items-center gap-1 mt-1">
                <Flame className="w-5 h-5 fill-amber-400" />
                {currentProfile.streakDays} Days
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Mastered Topics</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                {masteredTopics.length}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Daily adaptive quizzes maintain calibrated precision and prevent knowledge decay.
          </div>
        </div>

        {/* 3. Weak Topics Remediation Hub */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Vulnerability Alert Center
              </h3>
              <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                {weakTopics.length} Identified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Topics where demonstrated mastery is below 55%. Targeted drills help recover baseline confidence.
            </p>

            <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
              {weakTopics.length > 0 ? (
                weakTopics.map((w) => (
                  <div
                    key={w.topicId}
                    className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-rose-200">{w.topicName}</div>
                      <div className="text-[10px] text-slate-400">Mastery: {w.masteryPercentage}%</div>
                    </div>
                    <button
                      id={`practice-weak-topic-${w.topicId}`}
                      onClick={() => startTargetedRemediationDrill(w.subjectId, [w.topicId])}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] transition"
                    >
                      Practice
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-center text-xs text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  No weak topic bottlenecks detected! You are on track across all domains.
                </div>
              )}
            </div>
          </div>

          {weakTopics.length > 0 && (
            <button
              id="remediate-all-weak-topics-btn"
              onClick={() => {
                const targetSubjectId = weakTopics[0]?.subjectId || 'math';
                const topicIds = weakTopics.map((w) => w.topicId);
                startTargetedRemediationDrill(targetSubjectId, topicIds);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Launch Multi-Topic Gap Drill</span>
            </button>
          )}
        </div>
      </div>

      {/* Subject Ability Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          Subject-Specific Ability Ratings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjects.map((subj) => {
            const ability = currentProfile.subjectAbilities[subj.id] || currentProfile.currentAbilityScore;
            const sTier = getDifficultyTier(ability);
            const sTierColor = getTierColor(sTier);

            // Sub-topics in this subject
            const subjMasteries = subj.topics.map((t) => ({
              ...t,
              mastery: currentProfile.topicMasteries[t.id]?.masteryPercentage ?? 50,
            }));

            return (
              <div
                key={subj.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base text-white">{subj.name}</h3>
                    <AbilityBadge score={ability} size="sm" />
                  </div>

                  <div className="space-y-2 mt-4">
                    {subjMasteries.map((m) => (
                      <div key={m.id} className="text-xs">
                        <div className="flex items-center justify-between text-slate-300 mb-1">
                          <span className="truncate pr-2">{m.name}</span>
                          <span className={`font-semibold ${m.mastery < 55 ? 'text-rose-400' : m.mastery >= 80 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {m.mastery}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.mastery < 55 ? 'bg-rose-500' : m.mastery >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${m.mastery}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Tier: {sTier}</span>
                  <button
                    id={`quiz-subject-from-dashboard-${subj.id}`}
                    onClick={() => {
                      startQuiz({
                        subject: subj,
                        topicIds: subj.topics.map((t) => t.id),
                        mode: 'standard_adaptive',
                        targetLength: 6,
                      });
                    }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>Quiz Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ability Progression History */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Longitudinal Calibration Trajectory
            </h3>
            <p className="text-xs text-slate-400">
              History of ability ratings after each evaluated quiz session
            </p>
          </div>
        </div>

        {/* Visual History Dots / Bar Timeline */}
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3 h-40 pt-6 px-2 overflow-x-auto border-b border-slate-800">
            {currentProfile.history.map((pt, idx) => {
              const heightPct = Math.max(15, Math.min(100, (pt.abilityScore / 1000) * 100));
              const isUp = pt.delta >= 0;
              return (
                <div key={idx} className="flex-1 min-w-[70px] flex flex-col items-center gap-1 group">
                  <span className="text-[11px] font-bold text-white opacity-90 group-hover:scale-110 transition font-mono">
                    {pt.abilityScore}
                  </span>
                  <div className="w-full bg-slate-800/80 rounded-t-lg relative flex items-end overflow-hidden h-28">
                    <div
                      className={`w-full transition-all rounded-t-lg ${
                        idx === currentProfile.history.length - 1
                          ? 'bg-gradient-to-t from-indigo-600 to-cyan-400'
                          : 'bg-indigo-600/60'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[65px]">
                    {pt.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
