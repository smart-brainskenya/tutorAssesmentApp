import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { api } from '../../services/api';
import { 
  Zap, 
  ArrowLeft, CheckCircle2,
  BarChart3, Award
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { calculateOMI } from '../../utils/omi';

export default function Results() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (profile) {
          const data = await api.getTutorAttempts(profile.id);
          setAttempts(data);
        }
      } catch (error) {
        console.error('Failed to load results:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const stats = useMemo(() => {
    if (attempts.length === 0) return null;

    const totalTests = attempts.length;
    const avgScore = attempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalTests;
    
    // Get latest score per category
    const latestByCategory: Record<string, any> = {};
    attempts.forEach(a => {
      const catId = a.category_id;
      if (!latestByCategory[catId] || new Date(a.completed_at) > new Date(latestByCategory[catId].completed_at)) {
        latestByCategory[catId] = a;
      }
    });

    const categorySummary = Object.values(latestByCategory).map(a => ({
      name: a.categories?.name || 'Unknown',
      percentage: Math.round(a.percentage),
      date: a.completed_at
    }));

    const omi = calculateOMI(Object.values(latestByCategory));

    return {
      totalTests,
      avgScore: Math.round(avgScore),
      omi,
      categorySummary: categorySummary.sort((a, b) => b.percentage - a.percentage)
    };
  }, [attempts]);

  const getRanking = (pct: number) => {
    if (pct >= 90) return { title: 'SBK Elite', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' };
    if (pct >= 75) return { title: 'Code Captain', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500' };
    if (pct >= 60) return { title: 'Smart Operator', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' };
    if (pct >= 40) return { title: 'Rising Brain', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' };
    return { title: 'Needs Debugging', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' };
  };

  const getMotivation = (pct: number) => {
    if (pct < 60) return "Focus on improving your weakest category.";
    if (pct < 80) return "You're progressing well.";
    return "Excellent work. Keep maintaining this standard.";
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-slate-500 font-medium mt-4">One Momment✍️</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm mt-12">
        <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-6">
          <BarChart3 className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">No Performance Data</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Complete your first assessment to unlock your professional performance dashboard.</p>
        <Button onClick={() => navigate('/dashboard')} className="px-8">View Available Tests</Button>
      </div>
    );
  }

  const rank = getRanking(stats.avgScore);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="group flex items-center text-sm font-bold text-slate-400 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Back to Dashboard
        </button>
      </div>

      {/* 1. Performance Overview Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
          <div className="text-center md:text-left space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Overall Performance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-slate-900 tracking-tight">{stats.avgScore}%</span>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full border ${rank.bg} ${rank.color} ${rank.border} text-xs font-black uppercase tracking-wider`}>
              <Award className="w-3.5 h-3.5 mr-1.5" />
              {rank.title}
            </div>
          </div>

          <div className="flex-1 w-full space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-600 tracking-tight">Average Proficiency</span>
                <span className="text-slate-900">{stats.avgScore}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${rank.bar}`}
                  style={{ width: `${stats.avgScore}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">OMI Index</p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xl font-black text-slate-900">{stats.omi || 0}%</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assessments</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-500" />
                  <span className="text-xl font-black text-slate-900">{stats.totalTests}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center md:text-left">
          <p className="text-sm font-bold text-slate-600 italic">
            &ldquo;{getMotivation(stats.avgScore)} Keep pushing toward SBK Elite status.&rdquo;
          </p>
        </div>
      </section>

      {/* 2. Category Performance Summary */}
      <section className="space-y-6">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Skill Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.categorySummary.map((cat, idx) => {
            const catRank = getRanking(cat.percentage);
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-200 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-900 leading-tight pr-4">{cat.name}</h3>
                  <span className={`text-sm font-black ${catRank.color}`}>{cat.percentage}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${catRank.bar}`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 tracking-wider">
                  Latest: {new Date(cat.date).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Performance History Table */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Full History</h2>
          <span className="text-xs font-bold text-slate-400">{attempts.length} Total Attempts</span>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Assessment Category</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Score</th>
                  <th className="px-8 py-5 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((attempt) => {
                  const attemptRank = getRanking(attempt.percentage);
                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                          {attempt.categories?.name}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-medium whitespace-nowrap">
                        {new Date(attempt.completed_at).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-slate-700 font-bold tabular-nums">
                          {attempt.score} Questions
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${attemptRank.bg} ${attemptRank.color} border border-transparent group-hover:${attemptRank.border} transition-all`}>
                          {Math.round(attempt.percentage)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
