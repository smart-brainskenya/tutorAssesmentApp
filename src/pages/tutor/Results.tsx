import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/AuthContext';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Target, Zap, AlertTriangle, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

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
    const highestScore = Math.max(...attempts.map(a => a.percentage));

    // Category breakdown
    const catStats: Record<string, { total: number, count: number }> = {};
    attempts.forEach(a => {
      const catName = a.categories?.name || 'Unknown';
      if (!catStats[catName]) catStats[catName] = { total: 0, count: 0 };
      catStats[catName].total += a.percentage;
      catStats[catName].count += 1;
    });

    const chartData = Object.entries(catStats).map(([name, data]) => ({
      name,
      percentage: Math.round(data.total / data.count)
    }));

    const sortedCats = [...chartData].sort((a, b) => b.percentage - a.percentage);
    const strongest = sortedCats[0];
    const weakest = sortedCats[sortedCats.length - 1];

    return {
      totalTests,
      avgScore: Math.round(avgScore),
      highestScore: Math.round(highestScore),
      strongest,
      weakest,
      chartData
    };
  }, [attempts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
        <Target className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">No Results Yet</h2>
        <p className="text-slate-500 mb-8">Take your first assessment to see your performance analytics.</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Assessments</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900">Performance Analytics</h1>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-blue-50 text-blue-600 w-fit rounded-lg mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Tests</p>
          <p className="text-3xl font-black text-slate-900">{stats.totalTests}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-primary-50 text-primary-600 w-fit rounded-lg mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg. Score</p>
          <p className="text-3xl font-black text-slate-900">{stats.avgScore}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-amber-50 text-amber-600 w-fit rounded-lg mb-4">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Highest</p>
          <p className="text-3xl font-black text-slate-900">{stats.highestScore}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-green-50 text-green-600 w-fit rounded-lg mb-4">
            <Zap className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Strongest</p>
          <p className="text-lg font-black text-slate-900 truncate">{stats.strongest.name}</p>
          <p className="text-xs font-bold text-green-600">{stats.strongest.percentage}% avg</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-red-50 text-red-600 w-fit rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Focus Area</p>
          <p className="text-lg font-black text-slate-900 truncate">{stats.weakest.name}</p>
          <p className="text-xs font-bold text-red-600">{stats.weakest.percentage}% avg</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-8">Performance by Category</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={40}>
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#0ea5e9' : entry.percentage >= 60 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-900">Recent Attempts</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">{attempt.categories?.name}</h3>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    attempt.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {Math.round(attempt.percentage)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>{attempt.score} correct answers</span>
                  <span>{new Date(attempt.completed_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
             <p className="text-xs text-slate-500 font-medium italic">Target benchmark for SBK Elite: 90%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
