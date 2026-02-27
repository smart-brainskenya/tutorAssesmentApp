import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { BookOpen, Award, ChevronRight, TrendingUp, TrendingDown, Minus, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { SectionHeader } from '../../components/common/SectionHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Category } from '../../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<'home' | 'tests' | 'results'>(
    (location.state as any)?.initialView || 'home'
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, myAttempts] = await Promise.all([
          api.getPublishedCategories(),
          api.getTutorAttempts(profile!.id, 'all')
        ]);
        setCategories(cats);
        setAttempts(myAttempts);
      } catch (error) {
        toast.error('Dashboard is taking a nap. 😴 Failed to load.');
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    if (profile) fetchData();
  }, [profile]);

  // Derived Stats
  const gradedAttempts = attempts.filter(a => a.status === 'graded');
  const pendingCount = attempts.filter(a => a.status === 'submitted').length;
  const completedCount = gradedAttempts.length;

  const averageScore = completedCount > 0
    ? gradedAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / completedCount
    : 0;

  const lastResult = gradedAttempts[0]; // Assumes sorted by completed_at desc from API

  const trend = (() => {
    if (gradedAttempts.length < 2) return null;
    const latest = gradedAttempts[0].percentage;
    const previous = gradedAttempts[1].percentage;
    if (latest > previous) return 'up';
    if (latest < previous) return 'down';
    return 'same';
  })();

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
        toast.error(`Hold your horses! 🐎 Retake locked for ${remaining} minutes.`);
        return;
      }
    }
    
    navigate(`/assessments/${categoryId}`);
  };

  const renderHome = () => (
    <div className="space-y-8 py-8">
      {/* Performance Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Average Score */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Score</span>
            <div className={`p-1.5 rounded-full ${
              trend === 'up' ? 'bg-green-100 text-green-600' :
              trend === 'down' ? 'bg-red-100 text-red-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
               trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{Math.round(averageScore)}%</span>
            <p className="text-xs text-slate-500 mt-1">Based on {completedCount} graded tests</p>
          </div>
        </div>

        {/* Total Assessments */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{completedCount}</span>
            <p className="text-xs text-slate-500 mt-1">Total assessments finished</p>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="p-1.5 rounded-full bg-amber-100 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{pendingCount}</span>
            <p className="text-xs text-slate-500 mt-1">Awaiting admin review</p>
          </div>
        </div>

        {/* Last Result */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest</span>
            <div className="p-1.5 rounded-full bg-purple-100 text-purple-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            {lastResult ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black ${
                    lastResult.percentage >= 80 ? 'text-green-600' :
                    lastResult.percentage >= 60 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {Math.round(lastResult.percentage)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate max-w-[150px]" title={lastResult.categories?.name}>
                  {lastResult.categories?.name}
                </p>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-slate-300">--</span>
                <p className="text-xs text-slate-500 mt-1">No graded results yet</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => setView('tests')}
          className="group bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:border-sbk-primary hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-6"
        >
          <div className="p-4 bg-sbk-primary/10 text-sbk-primary rounded-lg group-hover:scale-110 transition-transform">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Take Tests</h2>
            <p className="text-sm text-slate-600">Access published assessments and test your knowledge.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => setView('results')}
          className="group bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:border-sbk-primary hover:shadow-md transition-all duration-200 cursor-pointer flex items-center gap-6"
        >
          <div className="p-4 bg-amber-100 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
            <Award className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">My Results</h2>
            <p className="text-sm text-slate-600">Review your past performance and rankings.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );

  const renderTests = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setView('home')}>
          <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back
        </Button>
        <h2 className="text-lg font-semibold text-slate-900">Available Assessments</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const lastAttempt = getLastAttempt(cat.id);
          const isCompleted = !!lastAttempt;

          return (
            <div key={cat.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col h-full hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded ${
                  isCompleted
                    ? lastAttempt.status === 'graded'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isCompleted
                    ? lastAttempt.status === 'graded' ? 'Completed' : 'Pending Review'
                    : 'Not Started'}
                </span>
                {isCompleted && lastAttempt.status === 'graded' && (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                    {Math.round(lastAttempt.percentage)}%
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{cat.name}</h3>
              <p className="text-sm text-slate-600 mb-6 flex-grow">{cat.description}</p>
              <Button
                className="w-full"
                onClick={() => handleStartTest(cat.id)}
                variant={isCompleted ? 'outline' : 'primary'}
                disabled={isCompleted && lastAttempt.status !== 'graded'}
              >
                {isCompleted
                  ? lastAttempt.status === 'graded' ? 'Retake Test' : 'In Review'
                  : 'Start Test'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setView('home')}>
          <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back
        </Button>
        <h2 className="text-lg font-semibold text-slate-900">Performance History</h2>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {attempts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">No assessment attempts yet. Start taking tests to see your performance history.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wide">Assessment</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wide">Date</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wide">Score</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wide">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{attempt.categories?.name}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(attempt.completed_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-mono text-slate-700">
                    {attempt.status === 'graded' ? `${attempt.score} pts` : '--'}
                  </td>
                  <td className="px-6 py-4">
                    {attempt.status === 'graded' ? (
                      <span className="font-bold text-sbk-primary">{Math.round(attempt.percentage)}%</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <SectionHeader
        title="Dashboard"
        subtitle="Manage your assessments and track your growth"
      />

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-primary"></div>
          <p className="text-slate-500 font-medium mt-4">One Momment✍️</p>
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
