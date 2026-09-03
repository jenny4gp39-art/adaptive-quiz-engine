import React, { useState } from 'react';
import {
  BrainCircuit,
  Flame,
  User,
  GraduationCap,
  Sparkles,
  ChevronDown,
  RotateCcw,
  BarChart2,
  BookOpen,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { AbilityBadge } from './common/AbilityBadge';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentProfile,
    profiles,
    switchProfile,
    resetAllData,
    isGeneratingBank,
    regenerateQuestionBank,
  } = useQuiz();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveView('subjects')}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-indigo-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5 font-sans">
                Adaptive Quiz Engine
                <span className="text-[10px] font-medium tracking-normal px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  IRT 2PL
                </span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                A quiz that learns how you learn
              </p>
            </div>
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              id="nav-subjects-btn"
              onClick={() => setActiveView('subjects')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeView === 'subjects' || activeView === 'active_quiz' || activeView === 'quiz_results'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Subjects & Quiz</span>
            </button>

            <button
              id="nav-learner-dashboard-btn"
              onClick={() => setActiveView('learner_dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeView === 'learner_dashboard'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Learner Progress</span>
            </button>

            <button
              id="nav-teacher-dashboard-btn"
              onClick={() => setActiveView('teacher_dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeView === 'teacher_dashboard'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Teacher Hub</span>
            </button>

            <button
              id="nav-admin-dashboard-btn"
              onClick={() => setActiveView('admin_dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeView === 'admin_dashboard'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </nav>
        </div>

        {/* Right side Profile & Stats */}
        <div className="flex items-center gap-3">
          {/* Quick Fresh Question Bank Trigger */}
          <button
            id="nav-quick-regenerate-bank-btn"
            title="Generate a fresh, brand-new question bank for this session"
            disabled={isGeneratingBank}
            onClick={() => regenerateQuestionBank({ includeAi: true })}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition border ${
              isGeneratingBank
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border-emerald-500/30'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBank ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
            <span>{isGeneratingBank ? 'Generating...' : 'New Set'}</span>
          </button>

          {/* Active Learner Ability Pill */}
          {currentProfile.role === 'student' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Ability:</span>
              <AbilityBadge score={currentProfile.currentAbilityScore} size="sm" />
              <div className="w-px h-4 bg-slate-800 mx-1" />
              <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{currentProfile.streakDays}d</span>
              </div>
            </div>
          )}

          {/* Profile Switcher Menu */}
          <div className="relative">
            <button
              id="profile-switcher-dropdown-btn"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-sm font-medium text-slate-200 transition"
            >
              <span className="text-base">{currentProfile.avatar}</span>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold leading-tight">{currentProfile.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{currentProfile.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {profileDropdownOpen && (
              <div
                id="profile-dropdown-menu"
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Active Persona
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Experience adaptive quizzes as students or educators
                  </div>
                </div>

                <div className="space-y-1">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      id={`switch-to-profile-${p.id}`}
                      onClick={() => {
                        switchProfile(p.id);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition ${
                        p.id === currentProfile.id
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.avatar}</span>
                        <div>
                          <div className="text-xs font-medium text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.role === 'student' ? `${p.gradeLevel || 'Student'} • Ability ${p.currentAbilityScore}` : 'Educator & Item Creator'}
                          </div>
                        </div>
                      </div>
                      {p.id === currentProfile.id && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800">
                  <button
                    id="reset-demo-data-btn"
                    onClick={() => {
                      if (confirm('Reset all demo profiles, test sessions, and questions back to defaults?')) {
                        resetAllData();
                        setProfileDropdownOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Calibration Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
