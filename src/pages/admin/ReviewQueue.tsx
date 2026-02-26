import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { 
  ClipboardCheck, User, BookOpen, 
  CheckCircle, AlertCircle, ChevronRight, X,
  Filter, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { filterQueue, getUniqueValues, SortOrder } from '../../utils/reviewQueueHelpers';

export default function ReviewQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);

  // Filter & Sort State
  const [filterAssessment, setFilterAssessment] = useState<string>('');
  const [filterTutor, setFilterTutor] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('oldest');

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
      
      toast.success('Review finalized and graded!', { id: toastId });
      setSelectedAttempt(null);
      fetchQueue();
    } catch (err) {
      toast.error('Failed to submit review', { id: toastId });
      throw err;
    }
  };

  // Computed Values
  const { assessments, tutors } = getUniqueValues(queue);
  const filteredQueue = filterQueue(queue, {
    assessment: filterAssessment,
    tutor: filterTutor,
    sortBy: sortOrder
  });

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Manual Review Queue
            {queue.length > 0 && (
              <span className="bg-sbk-blue text-white text-sm font-bold px-3 py-1 rounded-full">
                {queue.length} Pending
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-1">FIFO: Oldest submissions appear first.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Assessment Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterAssessment}
              onChange={(e) => setFilterAssessment(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:border-sbk-blue focus:ring-1 focus:ring-sbk-blue outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">All Assessments</option>
              {assessments.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Tutor Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterTutor}
              onChange={(e) => setFilterTutor(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:border-sbk-blue focus:ring-1 focus:ring-sbk-blue outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="">All Tutors</option>
              {tutors.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'oldest' ? 'newest' : 'oldest')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
          >
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            {sortOrder === 'oldest' ? 'Oldest First' : 'Newest First'}
          </button>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-green-50 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Queue Clear!</h2>
          <p className="text-slate-500">All Section B submissions have been reviewed.</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full mb-4">
            <Filter className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">No matches found</h2>
            <p className="text-slate-500">Try adjusting your filters.</p>
            <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                    setFilterAssessment('');
                    setFilterTutor('');
                }}
            >
                Clear Filters
            </Button>
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
              {filteredQueue.map((item) => (
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
