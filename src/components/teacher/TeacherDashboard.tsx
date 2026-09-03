import React, { useState } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Eye,
  Trash2,
  BarChart3,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { AbilityBadge } from '../common/AbilityBadge';
import { Question, TeacherAssignment, TopicMastery } from '../../types';
import {
  classifyQuestionDifficulty,
  generateAiQuestions,
} from '../../services/aiService';
import { getDifficultyTier, getTierColor } from '../../engine/adaptiveEngine';

export const TeacherDashboard: React.FC = () => {
  const {
    profiles,
    subjects,
    questions,
    addCustomQuestion,
    addMultipleQuestions,
    assignments,
    createAssignment,
    switchProfile,
    isGeneratingBank,
    bankGeneratedAt,
    regenerateQuestionBank,
  } = useQuiz();

  const [activeTab, setActiveTab] = useState<'roster' | 'bank' | 'assignments'>('roster');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Question bank filters
  const [bankSubjectFilter, setBankSubjectFilter] = useState<string>('all');
  const [bankSearchTerm, setBankSearchTerm] = useState<string>('');

  // AI Generator Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSubjectId, setAiSubjectId] = useState<string>('math');
  const [aiTopicId, setAiTopicId] = useState<string>('math_fractions');
  const [aiDifficulty, setAiDifficulty] = useState<number>(650);
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiFocus, setAiFocus] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<Question[]>([]);

  // Manual Question Creator Form
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [manualSubjectId, setManualSubjectId] = useState<string>('math');
  const [manualTopicId, setManualTopicId] = useState<string>('math_algebra');
  const [manualText, setManualText] = useState<string>('');
  const [manualDifficulty, setManualDifficulty] = useState<number>(500);
  const [manualOptions, setManualOptions] = useState([
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' },
  ]);
  const [manualCorrectId, setManualCorrectId] = useState<string>('a');
  const [manualExplanation, setManualExplanation] = useState<string>('');
  const [manualHint, setManualHint] = useState<string>('');
  const [classifying, setClassifying] = useState(false);

  // Assignment Creator Form
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('math');
  const [assignTopicIds, setAssignTopicIds] = useState<string[]>(['math_fractions', 'math_algebra']);
  const [assignCount, setAssignCount] = useState(8);
  const [assignDifficulty, setAssignDifficulty] = useState(500);
  const [assignDueDate, setAssignDueDate] = useState('2026-09-15');
  const [assignStudents, setAssignStudents] = useState<string[]>(['student_alex', 'student_maya', 'student_liam']);

  const studentProfiles = profiles.filter((p) => p.role === 'student');

  // Class Stats
  const classAvgAbility = Math.round(
    studentProfiles.reduce((sum, p) => sum + p.currentAbilityScore, 0) /
      Math.max(1, studentProfiles.length)
  );

  const selectedStudent = studentProfiles.find((s) => s.id === selectedStudentId);

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    if (bankSubjectFilter !== 'all' && q.subjectId !== bankSubjectFilter) return false;
    if (bankSearchTerm) {
      const matchText = q.text.toLowerCase().includes(bankSearchTerm.toLowerCase());
      const matchTopic = q.topicName.toLowerCase().includes(bankSearchTerm.toLowerCase());
      if (!matchText && !matchTopic) return false;
    }
    return true;
  });

  // Handle AI Question Generation
  const handleGenerateAiQuestions = async () => {
    setAiLoading(true);
    const selectedSubj = subjects.find((s) => s.id === aiSubjectId) || subjects[0];
    const selectedTopic = selectedSubj.topics.find((t) => t.id === aiTopicId) || selectedSubj.topics[0];

    try {
      const generated = await generateAiQuestions({
        subjectId: aiSubjectId,
        subjectName: selectedSubj.name,
        topicId: aiTopicId,
        topicName: selectedTopic.name,
        targetDifficulty: aiDifficulty,
        count: aiCount,
        focusConcepts: aiFocus || undefined,
      });

      setAiGeneratedList(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiQuestions = () => {
    if (aiGeneratedList.length > 0) {
      addMultipleQuestions(aiGeneratedList);
      setAiGeneratedList([]);
      setAiModalOpen(false);
      setActiveTab('bank');
    }
  };

  // AI Auto-classify difficulty for manual question
  const handleAiClassifyDifficulty = async () => {
    if (!manualText.trim()) return;
    setClassifying(true);
    try {
      const subj = subjects.find((s) => s.id === manualSubjectId);
      const res = await classifyQuestionDifficulty(manualText, subj?.name);
      setManualDifficulty(res.estimatedDifficulty);
      if (res.reasoning && !manualExplanation) {
        setManualExplanation(`AI Psychometric Analysis: ${res.reasoning}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClassifying(false);
    }
  };

  const handleSaveManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    const subj = subjects.find((s) => s.id === manualSubjectId) || subjects[0];
    const topic = subj.topics.find((t) => t.id === manualTopicId) || subj.topics[0];
    const tier = getDifficultyTier(manualDifficulty);

    const newQ: Question = {
      id: `custom_${Date.now()}`,
      subjectId: manualSubjectId,
      topicId: manualTopicId,
      topicName: topic.name,
      difficulty: manualDifficulty,
      difficultyTier: tier,
      text: manualText,
      options: manualOptions,
      correctOptionId: manualCorrectId,
      explanation: manualExplanation || 'Step-by-step verified conceptual solution.',
      hint: manualHint || undefined,
      author: 'Educator Custom Item',
      tags: [topic.name, 'Teacher Custom'],
    };

    addCustomQuestion(newQ);
    setManualText('');
    setManualExplanation('');
    setManualHint('');
    setManualFormOpen(false);
    setActiveTab('bank');
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;

    const newAssign: TeacherAssignment = {
      id: `assign_${Date.now()}`,
      title: assignTitle,
      subjectId: assignSubjectId,
      topicIds: assignTopicIds,
      targetQuestionCount: assignCount,
      startingDifficulty: assignDifficulty,
      dueDate: assignDueDate,
      assignedStudentIds: assignStudents,
      status: 'active',
    };

    createAssignment(newAssign);
    setAssignmentModalOpen(false);
    setAssignTitle('');
    setActiveTab('assignments');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Teacher Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Educator Command Center
            </span>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
              Item Calibration & Cohort Diagnostics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
            <span>Teacher & Curriculum Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Monitor student ability ratings, manage calibrated psychometric items, and use Gemini AI to generate new curriculum question variations.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            id="open-ai-question-generator-btn"
            onClick={() => setAiModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>

          <button
            id="open-create-assignment-modal-btn"
            onClick={() => setAssignmentModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Enrolled Cohort</div>
          <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            {studentProfiles.length} Students
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Cohort Mean Ability</div>
          <div className="text-2xl font-bold text-white mt-1">
            <AbilityBadge score={classAvgAbility} size="md" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Calibrated Question Bank</div>
          <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            {questions.length} Items
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Active Assignments</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            {assignments.filter((a) => a.status === 'active').length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          id="tab-roster-btn"
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Learner Roster & Analytics</span>
        </button>

        <button
          id="tab-bank-btn"
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'bank'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Question Bank ({questions.length})</span>
        </button>

        <button
          id="tab-assignments-btn"
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Assignments & Benchmarks</span>
        </button>
      </div>

      {/* Tab 1: Learner Roster & Diagnostics */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Student Ability & Vulnerability Roster
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Grade Level</th>
                    <th className="p-3">Ability Rating</th>
                    <th className="p-3">Detected Gaps</th>
                    <th className="p-3">Quizzes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {studentProfiles.map((student) => {
                    const weakList = (Object.values(student.topicMasteries) as TopicMastery[]).filter(
                      (m) => m.masteryPercentage < 55
                    );

                    return (
                      <tr key={student.id} className="hover:bg-slate-850/60 transition">
                        <td className="p-3 font-semibold text-white flex items-center gap-2">
                          <span className="text-base">{student.avatar}</span>
                          <span>{student.name}</span>
                        </td>
                        <td className="p-3 text-slate-400">{student.gradeLevel || 'Standard'}</td>
                        <td className="p-3">
                          <AbilityBadge score={student.currentAbilityScore} size="sm" />
                        </td>
                        <td className="p-3">
                          {weakList.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {weakList.map((w) => (
                                <span
                                  key={w.topicId}
                                  className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/20 text-[10px]"
                                >
                                  {w.topicName} ({w.masteryPercentage}%)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> All Proficient
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 font-mono">
                          {student.totalQuizzesTaken} sessions
                        </td>
                        <td className="p-3 text-right">
                          <button
                            id={`inspect-student-btn-${student.id}`}
                            onClick={() => switchProfile(student.id)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition"
                          >
                            Inspect Learner View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Question Bank Manager */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="bank-search-input"
                    type="text"
                    value={bankSearchTerm}
                    onChange={(e) => setBankSearchTerm(e.target.value)}
                    placeholder="Search questions or topics..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
                  />
                </div>

                <select
                  id="bank-subject-filter-select"
                  value={bankSubjectFilter}
                  onChange={(e) => setBankSubjectFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="teacher-generate-fresh-bank-btn"
                  disabled={isGeneratingBank}
                  onClick={() => regenerateQuestionBank({ includeAi: true })}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBank ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                  <span>{isGeneratingBank ? 'Generating Bank...' : 'Generate Fresh Bank'}</span>
                </button>

                <button
                  id="create-manual-question-btn"
                  onClick={() => setManualFormOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Item</span>
                </button>

                <button
                  id="generate-ai-questions-btn-bank"
                  onClick={() => setAiModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Generator</span>
                </button>
              </div>
            </div>

            {/* Questions Table */}
            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const tier = getDifficultyTier(q.difficulty);
                const tierColor = getTierColor(tier);
                return (
                  <div
                    key={q.id}
                    id={`question-bank-item-${q.id}`}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                          {q.topicName}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${tierColor.badge}`}>
                          Diff: {q.difficulty} • {tier}
                        </span>
                        {q.isAiGenerated && (
                          <span className="text-[10px] text-purple-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Created
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{q.author || 'Calibrated Bank'}</span>
                    </div>

                    <p className="text-sm font-medium text-white leading-relaxed">{q.text}</p>

                    {/* Options list */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                            opt.id === q.correctOptionId
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                              : 'bg-slate-900 border-slate-800/60 text-slate-400'
                          }`}
                        >
                          <span className="font-bold uppercase">{opt.id}:</span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Adaptive Assignments & Benchmarks
                </h3>
                <p className="text-xs text-slate-400">
                  Targeted quizzes pushed directly to student dashboards
                </p>
              </div>

              <button
                id="create-new-assignment-btn"
                onClick={() => setAssignmentModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>New Adaptive Assignment</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assign) => (
                <div
                  key={assign.id}
                  className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                        {subjects.find((s) => s.id === assign.subjectId)?.name || 'Subject'}
                      </span>
                      <span className="text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-semibold">
                        {assign.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-base">{assign.title}</h4>

                    <div className="text-xs text-slate-300 space-y-1">
                      <div>Target: {assign.targetQuestionCount} adaptive questions</div>
                      <div>Baseline Starting Difficulty: {assign.startingDifficulty}</div>
                      <div>Due Date: {assign.dueDate}</div>
                      <div>
                        Assigned to: {assign.assignedStudentIds.length} students (Alex, Maya, Liam)
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Adaptive Loop Enabled</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      {aiModalOpen && (
        <div
          id="ai-question-generator-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Gemini AI Question Item Writer
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generate calibrated psychometric test items on demand
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Subject</label>
                <select
                  value={aiSubjectId}
                  onChange={(e) => {
                    setAiSubjectId(e.target.value);
                    const s = subjects.find((sub) => sub.id === e.target.value);
                    if (s) setAiTopicId(s.topics[0]?.id || '');
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Sub-Topic</label>
                <select
                  value={aiTopicId}
                  onChange={(e) => setAiTopicId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  {(subjects.find((s) => s.id === aiSubjectId) || subjects[0]).topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Target Difficulty Rating:</span>
                  <span className="text-indigo-400">{aiDifficulty} ({getDifficultyTier(aiDifficulty)})</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={950}
                  step={25}
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Question Count</label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 Question</option>
                  <option value={2}>2 Questions</option>
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold text-xs block mb-1">
                Specific Focus Concept or Misconception (Optional)
              </label>
              <input
                type="text"
                value={aiFocus}
                onChange={(e) => setAiFocus(e.target.value)}
                placeholder="e.g. Word problems involving reciprocal multiplication and time limits"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              id="generate-ai-submit-btn"
              onClick={handleGenerateAiQuestions}
              disabled={aiLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI is generating & calibrating items...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Calibrated Items</span>
                </>
              )}
            </button>

            {/* Generated Items Preview */}
            {aiGeneratedList.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Generated Preview ({aiGeneratedList.length} items)
                  </h4>
                  <button
                    id="save-ai-items-btn"
                    onClick={handleSaveAiQuestions}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                  >
                    Add All to Question Bank
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {aiGeneratedList.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Item #{idx + 1}</span>
                        <span className="text-indigo-400 font-mono">Diff: {q.difficulty}</span>
                      </div>
                      <p className="text-slate-300 font-medium">{q.text}</p>
                      <div className="text-[11px] text-emerald-400">
                        Correct: ({q.correctOptionId.toUpperCase()}){' '}
                        {q.options.find((o) => o.id === q.correctOptionId)?.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Question Creator Modal */}
      {manualFormOpen && (
        <div
          id="manual-question-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Custom Test Item</h3>
              <button
                onClick={() => setManualFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Subject</label>
                  <select
                    value={manualSubjectId}
                    onChange={(e) => {
                      setManualSubjectId(e.target.value);
                      const s = subjects.find((sub) => sub.id === e.target.value);
                      if (s) setManualTopicId(s.topics[0]?.id || '');
                    }}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Topic</label>
                  <select
                    value={manualTopicId}
                    onChange={(e) => setManualTopicId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    {(subjects.find((s) => s.id === manualSubjectId) || subjects[0]).topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">Question Prompt</label>
                  <button
                    type="button"
                    onClick={handleAiClassifyDifficulty}
                    disabled={classifying || !manualText.trim()}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    {classifying ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Auto-Estimate Difficulty with AI
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter the question statement..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Calibrated Difficulty (0–1000):</span>
                  <span className="text-indigo-400">{manualDifficulty} ({getDifficultyTier(manualDifficulty)})</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={950}
                  value={manualDifficulty}
                  onChange={(e) => setManualDifficulty(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">Multiple Choice Options</label>
                {manualOptions.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={manualCorrectId === opt.id}
                      onChange={() => setManualCorrectId(opt.id)}
                      className="accent-indigo-500"
                    />
                    <span className="font-bold text-slate-400 uppercase w-4">{opt.id}:</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...manualOptions];
                        updated[idx].text = e.target.value;
                        setManualOptions(updated);
                      }}
                      placeholder={`Option ${opt.id.toUpperCase()}`}
                      className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Step-by-Step Explanation
                </label>
                <textarea
                  rows={2}
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  placeholder="Explain why the correct answer is right and common mistakes..."
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Creator Modal */}
      {assignmentModalOpen && (
        <div
          id="create-assignment-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">New Adaptive Assignment</h3>
              <button
                onClick={() => setAssignmentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="e.g. Midterm Adaptive Fractions Benchmark"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Subject</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => {
                    setAssignSubjectId(e.target.value);
                    const s = subjects.find((sub) => sub.id === e.target.value);
                    if (s) setAssignTopicIds(s.topics.map((t) => t.id));
                  }}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Question Count</label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={assignCount}
                    onChange={(e) => setAssignCount(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Publish to Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
