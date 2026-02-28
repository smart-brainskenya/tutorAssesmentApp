import { LoadingSpinner } from "../../components/common/LoadingSpinner";

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { 
  ClipboardCheck, User, BookOpen, 
  CheckCircle, AlertCircle, ChevronRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface QueueItem {
  attempt_id: string;
  submitted_at: string;
  tutor_name: string;
  category_name: string;
  pending_questions: number;
}

interface AttemptDetails {
  attempt: {
    id: string;
    tutor_name: string;
    categories: { name: string };
    section_a_scores: { raw_score: number; max_score: number }[];
  };
  submissions: {
    id: string;
    answer_text: string;
    questions: {
      question_text: string;
      points: number;
    };
  }[];
}

export default function ReviewQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptDetails | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewQueue();
      setQueue(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error('The queue is shy today. 🙈 Failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const openReview = async (attemptId: string) => {
    try {
      const data = await api.getAttemptForReview(attemptId);
      setSelectedAttempt(data as AttemptDetails);
      // Initialize scores
      const initialScores: Record<string, number> = {};
      (data as AttemptDetails).submissions.forEach((s) => {
        initialScores[s.id] = 0;
      });
      setScores(initialScores);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Attempt details went missing! 🕵️‍♂️');
    }
  };

  const handleScoreChange = (submissionId: string, score: number) => {
    setScores({ ...scores, [submissionId]: score });
  };

  const handleFeedbackChange = (submissionId: string, text: string) => {
    setFeedback({ ...feedback, [submissionId]: text });
  };

  const handleSubmitReview = async () => {
    if (!selectedAttempt) return;
    
    setReviewLoading(true);
    const toastId = toast.loading('One Momment✍️');

    try {
      const reviewPayload = selectedAttempt.submissions.map((s) => ({
        submission_id: s.id,
        score: scores[s.id] || 0,
        feedback: feedback[s.id] || ''
      }));

      await api.submitReview(selectedAttempt.attempt.id, reviewPayload);
      
      toast.success('Review done! Justice served. 👩‍⚖️', { id: toastId });
      setSelectedAttempt(null);
      fetchQueue();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Gavel broken! 🔨 Failed to submit review.', { id: toastId });
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sbk-slate-900">Manual Review Queue</h1>
        <p className="text-sbk-slate-500 mt-1">FIFO: Oldest submissions appear first.</p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sbk-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-sbk-green-50 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-sbk-green-500" />
          </div>
          <h2 className="text-xl font-bold text-sbk-slate-900">Queue Clear!</h2>
          <p className="text-sbk-slate-500">All Section B submissions have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-sbk-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-sbk-slate-50 text-sbk-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Tutor</th>
                <th className="px-6 py-4">Assessment</th>
                <th className="px-6 py-4">Pending Qs</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sbk-slate-100">
              {queue.map((item) => (
                <tr key={item.attempt_id} className="hover:bg-sbk-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-sbk-slate-600 font-medium">
                    {format(new Date(item.submitted_at), 'MMM dd, HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sbk-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-sbk-slate-400" />
                      </div>
                      <span className="font-semibold text-sbk-slate-900">{item.tutor_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-sbk-slate-600">{item.category_name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sbk-amber-100 text-sbk-amber-800">
                      {item.pending_questions} items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      onClick={() => openReview(item.attempt_id)}
                      className="gap-2"
                    >
                      Review <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-sbk-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-6 border-b border-sbk-slate-100 flex items-center justify-between bg-sbk-slate-50">
              <div>
                <h2 className="text-xl font-bold text-sbk-slate-900">Grading: {selectedAttempt.attempt.tutor_name || 'Tutor Attempt'}</h2>
                <p className="text-sm text-sbk-slate-500">{selectedAttempt.attempt.categories.name}</p>
              </div>
              <button onClick={() => setSelectedAttempt(null)} className="p-2 hover:bg-sbk-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-sbk-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Section A Summary */}
              <section className="bg-sbk-blue/10 border border-sbk-blue/20 rounded-xl p-6">
                <h3 className="text-sm font-black text-sbk-blue uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> Section A Results (Auto-Graded)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-sbk-slate-500 font-bold uppercase">Points Earned</p>
                    <p className="text-2xl font-bold text-sbk-slate-900">{selectedAttempt.attempt.section_a_scores[0]?.raw_score}</p>
                  </div>
                  <div>
                    <p className="text-xs text-sbk-slate-500 font-bold uppercase">Max Possible</p>
                    <p className="text-2xl font-bold text-sbk-slate-900">{selectedAttempt.attempt.section_a_scores[0]?.max_score}</p>
                  </div>
                </div>
              </section>

              {/* Section B Responses */}
              <section className="space-y-8">
                <h3 className="text-sm font-black text-sbk-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Section B: Manual Evaluation
                </h3>

                {selectedAttempt.submissions.map((sub: { id: string; questions: { question_text: string; points: number }; answer_text: string }, idx: number) => (
                  <div key={sub.id} className="border border-sbk-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-sbk-slate-50 px-6 py-4 border-b border-sbk-slate-200">
                      <p className="text-sm font-bold text-sbk-slate-700">Question {idx + 1}</p>
                      <p className="text-lg font-bold text-sbk-slate-900 mt-1">{sub.questions.question_text}</p>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="bg-sbk-slate-50 rounded-lg p-5 border-l-4 border-sbk-blue">
                        <p className="text-xs font-bold text-sbk-slate-400 uppercase mb-2">Tutor Response</p>
                        <p className="text-sbk-slate-800 whitespace-pre-wrap leading-relaxed">{sub.answer_text}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-sbk-slate-700 mb-2">
                            Assign Score (Max {sub.questions.points || 10})
                          </label>
                          <input
                            type="number"
                            max={sub.questions.points || 10}
                            min={0}
                            value={scores[sub.id]}
                            onChange={(e) => handleScoreChange(sub.id, parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 rounded-lg border-2 border-sbk-slate-200 focus:border-sbk-blue outline-none transition-all font-bold text-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-sbk-slate-700 mb-2">
                            Feedback (Optional)
                          </label>
                          <textarea
                            value={feedback[sub.id]}
                            onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                            placeholder="Constructive feedback for the tutor..."
                            className="w-full px-4 py-3 rounded-lg border-2 border-sbk-slate-200 focus:border-sbk-blue outline-none transition-all h-24 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <div className="px-8 py-6 border-t border-sbk-slate-100 bg-sbk-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sbk-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-tight">Final check required before submission</span>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setSelectedAttempt(null)}>Cancel</Button>
                <Button
                  onClick={handleSubmitReview}
                  isLoading={reviewLoading}
                  className="px-10"
                >
                  Approve Review & Grade
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
