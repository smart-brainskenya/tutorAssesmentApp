import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { BookOpen, Award, ChevronRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Category } from '../../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'home' | 'tests' | 'results'>('home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, myAttempts] = await Promise.all([
          api.getCategories(),
          api.getTutorAttempts(profile!.id)
        ]);
        setCategories(cats.filter(c => c.published));
        setAttempts(myAttempts);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    if (profile) fetchData();
  }, [profile]);

  const getLastAttempt = (categoryId: string) => {
    return attempts
      .filter(a => a.category_id === categoryId)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
  };

  const handleStartTest = (categoryId: string) => {
    const lastAttempt = getLastAttempt(categoryId);
    
    if (lastAttempt) {
      const now = new Date().getTime();
      const completedAt = new Date(lastAttempt.completed_at).getTime();
      const minutesSinceLast = (now - completedAt) / (1000 * 60);
      
      if (minutesSinceLast < 15) {
        const remaining = Math.ceil(15 - minutesSinceLast);
        toast.error(`Retake locked. Please wait ${remaining} minutes.`);
        return;
      }
    }
    
    navigate(`/assessments/${categoryId}`);
  };

  const renderHome = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12">
      <div 
        onClick={() => setView('tests')}
        className="group bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-primary-500 hover:shadow-xl transition-all cursor-pointer text-center"
      >
        <div className="inline-flex p-4 bg-primary-100 text-primary-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
          <BookOpen className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Take Tests</h2>
        <p className="text-slate-500">Access published assessments and test your knowledge.</p>
      </div>

      <div 
        onClick={() => setView('results')}
        className="group bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-primary-500 hover:shadow-xl transition-all cursor-pointer text-center"
      >
        <div className="inline-flex p-4 bg-amber-100 text-amber-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
          <Award className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">My Results</h2>
        <p className="text-slate-500">Review your past performance and rankings.</p>
      </div>
    </div>
  );

  const renderTests = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => setView('home')}>
          <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">Available Assessments</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const lastAttempt = getLastAttempt(cat.id);
          const isCompleted = !!lastAttempt;
          
          return (
            <div key={cat.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                  isCompleted ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {isCompleted ? 'Completed' : 'Not Started'}
                </span>
                {isCompleted && (
                  <span className="text-[10px] font-bold text-slate-400">
                    Best: {Math.round(lastAttempt.percentage)}%
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{cat.name}</h3>
              <p className="text-sm text-slate-500 mb-6 flex-grow">{cat.description}</p>
              <Button 
                className="w-full"
                onClick={() => handleStartTest(cat.id)}
                variant={isCompleted ? 'outline' : 'primary'}
              >
                {isCompleted ? 'Retake Test' : 'Start Test'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => setView('home')}>
          <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold text-slate-900">Performance History</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">Assessment</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No attempts found yet.</td>
              </tr>
            ) : (
              attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{attempt.categories?.name}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(attempt.completed_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-mono">{attempt.score} pts</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-primary-600">{Math.round(attempt.percentage)}%</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Manage your assessments and track your growth.</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {view === 'home' && renderHome()}
          {view === 'tests' && renderTests()}
          {view === 'results' && renderResults()}
        </>
      )}
    </div>
  );
}
