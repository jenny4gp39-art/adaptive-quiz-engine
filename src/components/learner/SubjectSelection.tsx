import React, { useState } from 'react';
import {
  Calculator,
  Code,
  Atom,
  Check,
  Zap,
  Flame,
  AlertTriangle,
  Play,
  Settings2,
  TrendingUp,
  Sparkles,
  ClipboardList,
  Target,
  RefreshCw,
  X,
} from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { Subject } from '../../types';
import { AbilityBadge } from '../common/AbilityBadge';
import { getTierColor, getDifficultyTier } from '../../engine/adaptiveEngine';

export const SubjectSelection: React.FC = () => {
  const {
    subjects,
    questions,
    currentProfile,
    startQuiz,
    assignments,
    setActiveView,
    isGeneratingBank,
    bankGeneratedAt,
    bankNotification,
    clearBankNotification,
    regenerateQuestionBank,
  } = useQuiz();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('math');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([
    'math_fractions',
    'math_algebra',
    'math_geometry',
    'math_statistics',
  ]);
  const [quizMode, setQuizMode] = useState<'standard_adaptive' | 'diagnostic' | 'weak_topics_drill' | 'speed_challenge'>('standard_adaptive');
  const [questionCount, setQuestionCount] = useState<number>(6);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Icons map
  const renderIcon = (name: string) => {
    switch (name) {
      case 'Calculator':
        return <Calculator className="w-5 h-5" />;
      case 'Code':
        return <Code className="w-5 h-5" />;
      case 'Atom':
        return <Atom className="w-5 h-5" />;
      default:
        return <Calculator className="w-5 h-5" />;
    }
  };

  const handleSubjectChange = (subject: Subject) => {
    setSelectedSubjectId(subject.id);
    setSelectedTopicIds(subject.topics.map((t) => t.id));
  };

  const toggleTopic = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      if (selectedTopicIds.length > 1) {
        setSelectedTopicIds(selectedTopicIds.filter((id) => id !== topicId));
      }
    } else {
      setSelectedTopicIds([...selectedTopicIds, topicId]);
    }
  };

  const selectAllTopics = () => {
    setSelectedTopicIds(activeSubject.topics.map((t) => t.id));
  };

  const selectWeakTopicsOnly = () => {
    const weak = activeSubject.topics
      .filter((t) => {
        const mastery = currentProfile.topicMasteries[t.id]?.masteryPercentage ?? 50;
        return mastery < 60;
      })
      .map((t) => t.id);

    if (weak.length > 0) {
      setSelectedTopicIds(weak);
      setQuizMode('weak_topics_drill');
    }
  };

  const currentSubjectAbility = currentProfile.subjectAbilities[activeSubject.id] || currentProfile.currentAbilityScore;

  // Check for assigned homework from teachers
  const studentAssignments = assignments.filter(
    (a) => a.assignedStudentIds.includes(currentProfile.id) && a.status === 'active'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Personalized Psychometric Engine
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Dynamic Item Calibration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Configure Adaptive Session
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Choose a subject and topics. The engine calibrates question difficulty after every single response, measuring your true ability score (0–1000).
          </p>
        </div>

        {/* Learner Current Standing */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">{currentProfile.name}'s Overall Rating</div>
            <div className="text-sm font-bold text-white">
              <AbilityBadge score={currentProfile.currentAbilityScore} size="md" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
            {currentProfile.avatar}
          </div>
        </div>
      </div>

      {/* Teacher Assigned Tests Banner (if any) */}
      {studentAssignments.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Teacher Assigned Benchmark: {studentAssignments[0].title}
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded">
                    Due {studentAssignments[0].dueDate}
                  </span>
                </h4>
                <p className="text-xs text-slate-300">
                  Target: {studentAssignments[0].targetQuestionCount} adaptive questions starting at baseline {studentAssignments[0].startingDifficulty}.
                </p>
              </div>
            </div>
            <button
              id="start-assigned-test-btn"
              onClick={() => {
                const targetSubject = subjects.find((s) => s.id === studentAssignments[0].subjectId) || subjects[0];
                startQuiz({
                  subject: targetSubject,
                  topicIds: studentAssignments[0].topicIds,
                  mode: 'standard_adaptive',
                  targetLength: studentAssignments[0].targetQuestionCount,
                  initialStartingAbility: studentAssignments[0].startingDifficulty,
                });
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Assigned Test
            </button>
          </div>
        </div>
      )}

      {/* Fresh Question Bank Active Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/20 shadow-lg shadow-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Fresh Question Bank Active
              </span>
              <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60">
                Generated at {bankGeneratedAt}
              </span>
              <span className="text-[11px] bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700/40">
                {questions.length} Items Total
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              A novel set of psychometrically calibrated questions is generated every time you open the app.
              {isGeneratingBank && (
                <span className="text-indigo-400 ml-1.5 animate-pulse font-medium">
                  Enriching with Gemini AI questions in background...
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="regenerate-question-bank-btn"
            disabled={isGeneratingBank}
            onClick={() => regenerateQuestionBank({ includeAi: true })}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
              isGeneratingBank
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border-indigo-500/30 hover:border-indigo-500/50 shadow-sm'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBank ? 'animate-spin' : ''}`} />
            <span>{isGeneratingBank ? 'Generating Set...' : 'Generate New Set'}</span>
          </button>
        </div>
      </div>

      {/* Dismissible Bank Notification */}
      {bankNotification && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bankNotification}</span>
          </div>
          <button
            id="dismiss-bank-notification-btn"
            onClick={clearBankNotification}
            className="text-emerald-400 hover:text-emerald-300 p-1 rounded transition"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Subject Selection Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center">1</span>
            Select Subject
          </label>
          <span className="text-xs text-slate-400">
            Current {activeSubject.name} Ability:{' '}
            <span className="text-indigo-300 font-semibold">{currentSubjectAbility}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subjects.map((subj) => {
            const isSelected = subj.id === selectedSubjectId;
            const ability = currentProfile.subjectAbilities[subj.id] || currentProfile.currentAbilityScore;
            return (
              <button
                key={subj.id}
                id={`subject-card-${subj.id}`}
                onClick={() => handleSubjectChange(subj)}
                className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500 shadow-xl shadow-indigo-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl border bg-gradient-to-br ${subj.color}`}
                    >
                      {renderIcon(subj.iconName)}
                    </div>
                    <AbilityBadge score={ability} size="sm" />
                  </div>
                  <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition">
                    {subj.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {subj.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{subj.topics.length} Sub-topics</span>
                  {isSelected && (
                    <span className="text-indigo-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Topic Selection with Mastery breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center">2</span>
            Configure Sub-Topics & Target Mastery
          </label>
          <div className="flex items-center gap-2">
            <button
              id="select-all-topics-btn"
              onClick={selectAllTopics}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60 transition"
            >
              Select All
            </button>
            <button
              id="select-weak-topics-btn"
              onClick={selectWeakTopicsOnly}
              className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30 transition flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              Focus on Weak Topics
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeSubject.topics.map((topic) => {
            const isChecked = selectedTopicIds.includes(topic.id);
            const mastery = currentProfile.topicMasteries[topic.id]?.masteryPercentage ?? 50;
            const isWeak = mastery < 55;
            const isStrong = mastery >= 80;

            return (
              <div
                key={topic.id}
                id={`topic-toggle-${topic.id}`}
                onClick={() => toggleTopic(topic.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                  isChecked
                    ? 'bg-slate-800/80 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-60 hover:opacity-100 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {topic.name}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {topic.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mastery Bar */}
                <div className="mt-3 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Mastery:</span>
                    <span
                      className={`font-semibold ${
                        isWeak
                          ? 'text-rose-400 flex items-center gap-1'
                          : isStrong
                          ? 'text-emerald-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {isWeak && <AlertTriangle className="w-3 h-3" />}
                      {mastery}% {isWeak ? '(Gap)' : isStrong ? '(Mastered)' : ''}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isWeak
                          ? 'bg-rose-500'
                          : isStrong
                          ? 'bg-emerald-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quiz Mode & Length Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        {/* Mode Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            Adaptive Algorithm Mode
          </label>

          <div className="space-y-2">
            {[
              {
                id: 'standard_adaptive' as const,
                title: 'Standard Adaptive Loop',
                desc: 'Progression: Medium → Medium+ → Hard on correct, adjusts downward on error.',
                icon: TrendingUp,
              },
              {
                id: 'weak_topics_drill' as const,
                title: 'Weak-Topic Remediation',
                desc: 'Targeted drill focusing exclusively on topics with mastery < 60%.',
                icon: AlertTriangle,
              },
              {
                id: 'diagnostic' as const,
                title: 'Diagnostic Baseline Benchmark',
                desc: 'Wider difficulty jumps to rapidly estimate your true cognitive ceiling.',
                icon: Target,
              },
              {
                id: 'speed_challenge' as const,
                title: 'Speed & Mastery Sprint',
                desc: 'Rewards fast accurate mental calculation with higher ability multiplier.',
                icon: Zap,
              },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = quizMode === m.id;
              return (
                <div
                  key={m.id}
                  id={`mode-option-${m.id}`}
                  onClick={() => setQuizMode(m.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg mt-0.5 ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{m.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiz Target Length & Summary */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              Question Count Target
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 8, 10, 15].map((count) => (
                <button
                  key={count}
                  id={`length-btn-${count}`}
                  onClick={() => setQuestionCount(count)}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                    questionCount === count
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              The engine continually refines accuracy with each question. 6–8 questions provide high confidence calibration.
            </p>
          </div>

          {/* Start CTA Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              id="start-adaptive-quiz-btn"
              onClick={() => {
                startQuiz({
                  subject: activeSubject,
                  topicIds: selectedTopicIds,
                  mode: quizMode,
                  targetLength: questionCount,
                });
              }}
              disabled={selectedTopicIds.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Adaptive Quiz Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
