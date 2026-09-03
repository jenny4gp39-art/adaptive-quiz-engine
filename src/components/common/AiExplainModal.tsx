import React, { useState, useEffect } from 'react';
import { Sparkles, X, Lightbulb, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { Question } from '../../types';
import { AiExplanationResult, getAiExplanation } from '../../services/aiService';

interface AiExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  selectedOptionId?: string;
}

export const AiExplainModal: React.FC<AiExplainModalProps> = ({
  isOpen,
  onClose,
  question,
  selectedOptionId,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AiExplanationResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAiExplanation({
        questionText: question.text,
        options: question.options,
        correctOptionId: question.correctOptionId,
        selectedOptionId,
        topicName: question.topicName,
      })
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, question, selectedOptionId]);

  if (!isOpen) return null;

  const correctOption = question.options.find((o) => o.id === question.correctOptionId);
  const selectedOption = question.options.find((o) => o.id === selectedOptionId);

  return (
    <div
      id="ai-explain-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="ai-explain-modal-content"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl p-6 text-slate-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Gemini Socratic Tutor
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-normal">
                  {question.topicName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cognitive breakdown & conceptual mental model
              </p>
            </div>
          </div>
          <button
            id="close-ai-explain-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Review Brief */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-5">
          <p className="text-sm text-slate-300 font-medium">{question.text}</p>
          <div className="mt-2 text-xs flex flex-wrap gap-2">
            <span className="text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Correct: ({question.correctOptionId.toUpperCase()}) {correctOption?.text}
            </span>
            {selectedOption && selectedOption.id !== question.correctOptionId && (
              <span className="text-rose-400 flex items-center gap-1 bg-rose-950/40 px-2 py-1 rounded border border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                Your choice: ({selectedOption.id.toUpperCase()}) {selectedOption.text}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Generating step-by-step Socratic breakdown...</p>
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm">
            {/* Step by step */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h4 className="font-semibold text-indigo-300 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-indigo-400" />
                Step-by-Step Derivation
              </h4>
              <ol className="space-y-2 text-slate-300 pl-4 list-decimal">
                {data.stepByStep.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Key Takeaway */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-200">
              <span className="font-semibold text-emerald-400 block text-xs uppercase tracking-wider mb-1">
                Core Mental Model
              </span>
              <p className="text-sm">{data.keyTakeaway}</p>
            </div>

            {/* Misconception Analysis */}
            {data.misconceptionAnalysis && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-200">
                <span className="font-semibold text-amber-400 block text-xs uppercase tracking-wider mb-1">
                  Common Trap / Misconception
                </span>
                <p className="text-sm">{data.misconceptionAnalysis}</p>
              </div>
            )}

            {/* Socratic Follow-up */}
            {data.socraticFollowUp && (
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-200">
                <span className="font-semibold text-indigo-400 block text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Socratic Check
                </span>
                <p className="text-sm italic">"{data.socraticFollowUp}"</p>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            id="dismiss-ai-tutor-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            Understood, back to session
          </button>
        </div>
      </div>
    </div>
  );
};
