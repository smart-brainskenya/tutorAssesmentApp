import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { 
  User, CheckCircle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ReviewModal from '../../components/admin/ReviewModal';

export default function ReviewQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await api.getReviewQueue();
      setQueue(data);
    } catch (err) {
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const openReview = async (attemptId: string) => {
    try {
      const data = await api.getAttemptForReview(attemptId);
      setSelectedAttempt(data);
    } catch (err) {
      toast.error('Failed to load attempt details');
    }
  };

  const handleReviewSubmit = async (reviews: { submission_id: string, score: number, feedback: string }[]) => {
    if (!selectedAttempt) return;
    
    const toastId = toast.loading('Finalizing review...');

    try {
      await api.submitReview(selectedAttempt.attempt.id, reviews);
      
      toast.success('Review finalized and tutor graded!', { id: toastId });
      setSelectedAttempt(null);
      fetchQueue();
    } catch (err) {
      toast.error('Failed to submit review', { id: toastId });
      throw err;
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manual Review Queue</h1>
        <p className="text-slate-500 mt-1">FIFO: Oldest submissions appear first.</p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-green-50 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Queue Clear!</h2>
          <p className="text-slate-500">All Section B submissions have been reviewed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Tutor</th>
                <th className="px-6 py-4">Assessment</th>
                <th className="px-6 py-4">Pending Qs</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((item) => (
                <tr key={item.attempt_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {format(new Date(item.submitted_at), 'MMM dd, HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="font-semibold text-slate-900">{item.tutor_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.category_name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
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

      {selectedAttempt && (
        <ReviewModal
          attempt={selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
