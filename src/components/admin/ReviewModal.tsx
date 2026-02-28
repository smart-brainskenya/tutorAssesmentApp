import { useState, useEffect } from 'react';
import {
  X, ClipboardCheck, BookOpen, AlertCircle
} from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';
import {
  getPresetScore,
  calculateRunningTotal,
  calculateMaxTotal
} from '../../utils/grading';

// Define expected interface to remove "any" types
interface AttemptSubmission {
  id: string;
  answer_text: string;
  questions: {
    question_text: string;
    points: number;
  };
}

interface AttemptData {
  attempt: {
    tutor_name: string;
    categories: { name: string };
    section_a_scores?: Array<{ raw_score: number; max_score: number }>;
  };
  submissions: AttemptSubmission[];
}

interface ReviewModalProps {
  attempt: AttemptData | null;
  onClose: () => void;
  onSubmit: (reviews: { submission_id: string, score: number, feedback: string }[]) => Promise<void>;
}

const GRADING_PRESETS = [
  { label: 'Poor', percentage: 0.25, color: 'bg-sbk-danger-50 text-sbk-danger hover:bg-sbk-danger/20' },
  { label: 'Fair', percentage: 0.50, color: 'bg-sbk-warning-50 text-sbk-warning hover:bg-sbk-warning/20' },
  { label: 'Good', percentage: 0.75, color: 'bg-sbk-info-50 text-sbk-info hover:bg-sbk-info/20' },
  { label: 'Excellent', percentage: 1.0, color: 'bg-sbk-success-50 text-sbk-success hover:bg-sbk-success/20' }
];

export default function ReviewModal({ attempt, onClose, onSubmit }: ReviewModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (attempt && attempt.submissions) {
      const initialScores: Record<string, number> = {};
      const initialFeedback: Record<string, string> = {};

      attempt.submissions.forEach((s) => {
        initialScores[s.id] = 0;
        initialFeedback[s.id] = '';
      });
      setScores(initialScores);
      setFeedback(initialFeedback);
    }
  }, [attempt]);

  const handleScoreChange = (submissionId: string, score: number) => {
    setScores(prev => ({ ...prev, [submissionId]: score }));
  };

  const handlePresetClick = (submissionId: string, maxPoints: number, percentage: number) => {
    const score = getPresetScore(maxPoints, percentage);
    handleScoreChange(submissionId, score);
  };

  const handleFeedbackChange = (submissionId: string, text: string) => {
    setFeedback(prev => ({ ...prev, [submissionId]: text }));
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    setLoading(true);
    try {
      const payload = attempt.submissions.map((s) => ({
        submission_id: s.id,
        score: scores[s.id] || 0,
        feedback: feedback[s.id] || ''
      }));
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  if (!attempt) return null;

  const sectionAScore = attempt.attempt.section_a_scores?.[0]?.raw_score || 0;
  const sectionAMax = attempt.attempt.section_a_scores?.[0]?.max_score || 0;

  // Typecast or adapt for utils function if needed.
  // Assuming the utils expect Array<{id: string, questions: {points: number}}> which matches our interface.
  const currentTotal = calculateRunningTotal(sectionAScore, attempt.submissions , scores);
  const maxTotal = calculateMaxTotal(sectionAMax, attempt.submissions );

  return (
    <div className="fixed inset-0 bg-sbk-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-sbk-neutral-border flex items-center justify-between bg-sbk-neutral-light">
          <div>
            <h2 className="text-xl font-bold text-sbk-neutral-text">Grading: {attempt.attempt.tutor_name || 'Tutor Attempt'}</h2>
            <p className="text-sm text-sbk-slate-500">{attempt.attempt.categories.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sbk-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-sbk-slate-500" />
          </button>
        </div>

        {/* Sticky Score Summary */}
        <div className="bg-white px-8 py-4 border-b border-sbk-neutral-border shadow-sm flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-sbk-slate-500 uppercase">Running Total:</span>
                <span className="text-2xl font-black text-sbk-primary">{currentTotal}</span>
                <span className="text-sbk-slate-400 font-medium">/ {maxTotal}</span>
            </div>
             <div className="flex items-center gap-4 text-sm text-sbk-slate-600">
                <span>Section A: <strong>{sectionAScore}</strong></span>
                <span>Section B: <strong>{currentTotal - sectionAScore}</strong></span>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Section A Summary */}
          <section className="bg-sbk-info-50 border border-sbk-info/30 rounded-xl p-6">
            <h3 className="text-sm font-black text-sbk-info uppercase tracking-widest mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Section A Results (Auto-Graded)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-sbk-slate-500 font-bold uppercase">Points Earned</p>
                <p className="text-2xl font-bold text-sbk-neutral-text">{sectionAScore}</p>
              </div>
              <div>
                <p className="text-xs text-sbk-slate-500 font-bold uppercase">Max Possible</p>
                <p className="text-2xl font-bold text-sbk-neutral-text">{sectionAMax}</p>
              </div>
            </div>
          </section>

          {/* Section B Responses */}
          <section className="space-y-8">
            <h3 className="text-sm font-black text-sbk-neutral-text uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Section B: Manual Evaluation
            </h3>

            {attempt.submissions.map((sub, idx) => {
                const maxPoints = sub.questions.points || 10;
                return (
              <div key={sub.id} className="border border-sbk-neutral-border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-sbk-neutral-light px-6 py-4 border-b border-sbk-neutral-border flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-sbk-slate-700">Question {idx + 1}</p>
                        <p className="text-lg font-bold text-sbk-neutral-text mt-1">{sub.questions.question_text}</p>
                    </div>
                    <div className="text-xs font-bold bg-sbk-slate-200 text-sbk-slate-600 px-2 py-1 rounded">
                        Max: {maxPoints} pts
                    </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Tutor Response */}
                  <div className="bg-sbk-slate-50 rounded-lg p-5 border-l-4 border-sbk-primary">
                    <p className="text-xs font-bold text-sbk-slate-400 uppercase mb-2">Tutor Response</p>
                    <p className="text-sbk-slate-800 whitespace-pre-wrap leading-relaxed">{sub.answer_text}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Scoring Column */}
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-sbk-slate-700">
                        Assign Score
                      </label>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {GRADING_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handlePresetClick(sub.id, maxPoints, preset.percentage)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold transition-colors border border-transparent",
                                    preset.color
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                      </div>

                      <div className="relative">
                        <input
                            type="number"
                            max={maxPoints}
                            min={0}
                            value={scores[sub.id]}
                            onChange={(e) => handleScoreChange(sub.id, parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-sbk-neutral-border focus:border-sbk-primary outline-none transition-all font-bold text-lg"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sbk-slate-400 font-medium">
                            / {maxPoints}
                        </span>
                      </div>
                    </div>

                    {/* Feedback Column */}
                    <div>
                      <label className="block text-sm font-bold text-sbk-slate-700 mb-2">
                        Feedback (Optional)
                      </label>
                      <textarea
                        value={feedback[sub.id]}
                        onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                        placeholder="Constructive feedback for the tutor..."
                        className="w-full px-4 py-3 rounded-lg border-2 border-sbk-neutral-border focus:border-sbk-primary outline-none transition-all h-32 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </section>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-sbk-neutral-border bg-sbk-neutral-light flex items-center justify-between">
          <div className="flex items-center gap-2 text-sbk-warning">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-tight">Final check required before submission</span>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              isLoading={loading}
              className="px-10"
            >
              Approve Review & Grade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
