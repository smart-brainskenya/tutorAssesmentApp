import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { BookOpen, Award, ChevronRight, Clock, HelpCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { SectionHeader } from '../../components/common/SectionHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Category } from '../../types';
import toast from 'react-hot-toast';

type DashboardCategory = Category & {
  section_count: number;
  question_count: number;
  section_a_count: number;
  section_b_count: number;
  estimated_time: number;
};

interface Attempt {
  id: string;
  category_id: string;
  completed_at: string;
  status: 'graded' | 'submitted' | 'in_progress';
  percentage: number;
  score: number;
  categories?: { name: string };
}

interface LocationState {
  initialView?: 'home' | 'tests' | 'results';
}

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<'home' | 'tests' | 'results'>(
    (location.state as LocationState)?.initialView || 'home'
  );
  const [categories, setCategories] = useState<DashboardCategory[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, myAttempts] = await Promise.all([
          api.getPublishedCategories(),
          api.getTutorAttempts(profile!.id, 'all')
        ]);
        setCategories(cats as DashboardCategory[]);
        setAttempts(myAttempts as Attempt[]);
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
        className="group bg-white p-8 rounded-lg border border-slate-200 shadow-sm hover:border-sbk-primary hover:shadow-md transition-all duration-200 cursor-pointer text-center"
      >
        <div className="inline-flex p-4 bg-sbk-primary/10 text-sbk-primary rounded-lg mb-6 group-hover:scale-110 transition-transform">
          <BookOpen className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Take Tests</h2>
        <p className="text-sm text-slate-600">Access published assessments and test your knowledge.</p>
      </div>

      <div
        onClick={() => setView('results')}
        className="group bg-white p-8 rounded-lg border border-slate-200 shadow-sm hover:border-sbk-primary hover:shadow-md transition-all duration-200 cursor-pointer text-center"
      >
        <div className="inline-flex p-4 bg-amber-100 text-amber-600 rounded-lg mb-6 group-hover:scale-110 transition-transform">
          <Award className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">My Results</h2>
        <p className="text-sm text-slate-600">Review your past performance and rankings.</p>
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
          const status = lastAttempt?.status || 'not_started';

          let statusBadge;
          let buttonText = 'Start Test';
          let buttonDisabled = false;
          let buttonVariant: 'primary' | 'outline' = 'primary';

          switch (status) {
            case 'graded':
              statusBadge = <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-green-100 text-green-700">Completed</span>;
              buttonText = 'Retake Test';
              buttonVariant = 'outline';
              break;
            case 'submitted':
              statusBadge = <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-amber-100 text-amber-700">Awaiting Review</span>;
              buttonText = 'Pending Review';
              buttonDisabled = true;
              buttonVariant = 'outline';
              break;
            case 'in_progress':
               statusBadge = <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-blue-100 text-blue-700">In Progress</span>;
               buttonText = 'Continue Test';
               break;
            default:
               statusBadge = <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-600">Not Started</span>;
          }

          return (
            <div key={cat.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col h-full hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                {statusBadge}
                {status === 'graded' && lastAttempt && (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                    {Math.round(lastAttempt.percentage)}%
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{cat.name}</h3>
              <p className="text-sm text-slate-600 mb-6 flex-grow">{cat.description}</p>

              <div className="space-y-3 mb-6 border-t border-slate-100 pt-4">
                 <div className="flex items-center text-xs text-slate-500">
                    <HelpCircle className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span>{cat.question_count} Questions ({cat.section_a_count} A / {cat.section_b_count} B)</span>
                 </div>
                 <div className="flex items-center text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <span>~{cat.estimated_time} Minutes</span>
                 </div>
              </div>

              <Button
                className="w-full"
                onClick={() => handleStartTest(cat.id)}
                variant={buttonVariant}
                disabled={buttonDisabled}
              >
                {buttonText}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderResults = () => {
    const gradedAttempts = attempts.filter(a => a.status === 'graded');

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setView('home')}>
            <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Back
          </Button>
          <h2 className="text-lg font-semibold text-slate-900">Performance History</h2>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {gradedAttempts.length === 0 ? (
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
                {gradedAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{attempt.categories?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(attempt.completed_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-slate-700">{attempt.score} pts</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-sbk-primary">{Math.round(attempt.percentage)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <SectionHeader
        title="Dashboard"
        subtitle="Manage your assessments and track your growth"
      />

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-primary"></div>
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
