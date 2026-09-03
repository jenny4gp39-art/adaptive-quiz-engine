import React from 'react';
import { QuizProvider, useQuiz } from './context/QuizContext';
import { Navbar } from './components/Navbar';
import { SubjectSelection } from './components/learner/SubjectSelection';
import { ActiveQuiz } from './components/learner/ActiveQuiz';
import { QuizResults } from './components/learner/QuizResults';
import { LearnerDashboard } from './components/learner/LearnerDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

const MainView: React.FC = () => {
  const { activeView } = useQuiz();

  return (
    <main className="flex-1 pb-16">
      {activeView === 'subjects' && <SubjectSelection />}
      {activeView === 'active_quiz' && <ActiveQuiz />}
      {activeView === 'quiz_results' && <QuizResults />}
      {activeView === 'learner_dashboard' && <LearnerDashboard />}
      {activeView === 'teacher_dashboard' && <TeacherDashboard />}
      {activeView === 'admin_dashboard' && <AdminDashboard />}
    </main>
  );
};

export default function App() {
  return (
    <QuizProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <MainView />
      </div>
    </QuizProvider>
  );
}
