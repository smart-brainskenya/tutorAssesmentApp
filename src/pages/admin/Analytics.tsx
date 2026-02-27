import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { CompactMetricCard } from '../../components/admin/CompactMetricCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { calculateScoreTrend, calculateActiveTutorsTrend } from '../../utils/analytics-helpers';
import {
  Users, TrendingUp, AlertTriangle, Award,
  FileDown, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LeaderboardItem {
  id: string;
  full_name: string;
  email: string;
  testsTaken: number;
  avgPercentage: number | null;
  omi: number | null;
}

interface RawAttempt {
  user_id: string;
  categories: { name: string } | null;
  score: number;
  percentage: number;
  completed_at: string;
}

interface RiskTutor {
  id: string;
  full_name: string;
  avgPercentage: number;
}

interface InactiveTutor {
  id: string;
  full_name: string;
}

interface AdminStats {
  metrics: {
    totalTutors: number;
    activeTutorsCount: number;
    avgGlobalScore: number;
    avgGlobalOMI: number;
    mostPassed: string;
    mostFailed: string;
    atRiskCount: number;
  };
  leaderboard: LeaderboardItem[];
  rawAttempts: RawAttempt[];
  risk: {
    below60: RiskTutor[];
    inactive: InactiveTutor[];
  };
}

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  percentageChange?: number;
}

export default function Analytics() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [trends, setTrends] = useState<{ score: TrendData | null; active: TrendData | null }>({ score: null, active: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminStats();
      setData(res as AdminStats);

      if (res.rawAttempts) {
        // Since api.ts filters by status='graded', we can use rawAttempts directly
        // However, calculateScoreTrend expects { completed_at: string, percentage: number }
        // which RawAttempt satisfies.
        const gradedAttempts = res.rawAttempts;

        const scoreTrend = calculateScoreTrend(gradedAttempts, 30);
        const activeTrend = calculateActiveTutorsTrend(gradedAttempts, 30);

        setTrends({
          score: scoreTrend,
          active: activeTrend
        });
      }
    } catch (err) {
      toast.error('Failed to load administrative analytics');
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data?.rawAttempts || data.rawAttempts.length === 0) {
      toast.error('No data available to export');
      return;
    }

    setExporting(true);
    const toastId = toast.loading('Generating CSV report...');
    
    try {
      const headers = ['Tutor', 'Email', 'Category', 'Score', 'Percentage', 'Date'];
      const rows = data.rawAttempts.map((a) => [
        `"${a.user_id}"`, // Using ID as placeholder for name if not joined
        `"${a.user_id}"`,
        `"${a.categories?.name || 'Unknown'}"`,
        a.score,
        `${a.percentage}%`,
        `"${new Date(a.completed_at).toLocaleDateString()}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map((e) => e.join(','))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `sbk_tutor_results_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report downloaded!', { id: toastId });
    } catch {
      toast.error('Export failed', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const filteredLeaderboard: LeaderboardItem[] = data?.leaderboard?.filter((t) =>
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-blue"></div>
      <p className="text-sbk-slate-500 font-medium">Aggregating global metrics...</p>
    </div>
  );

  if (!data) return (
    <div className="flex justify-center py-20">
      <p className="text-slate-500">Failed to load analytics data.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-sbk-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SectionHeader
          title="Admin Intelligence"
          subtitle="Global performance metrics and risk detection"
          action={
            <Button onClick={exportCSV} variant="outline" className="gap-2" isLoading={exporting}>
              <FileDown className="w-4 h-4" /> Export All Results (CSV)
            </Button>
          }
        />

        {/* Cleaner Metric Hierarchy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CompactMetricCard
            label="Total Tutors"
            value={data.metrics.totalTutors}
            icon={<Users className="w-4 h-4" />}
          />
          <CompactMetricCard
            label="Active Tutors"
            value={data.metrics.activeTutorsCount}
            trend={trends.active ? {
              value: trends.active.value,
              label: 'vs last 30d',
              direction: trends.active.direction
            } : undefined}
            icon={<Users className="w-4 h-4" />}
          />
          <CompactMetricCard
            label="Global Avg"
            value={`${data.metrics.avgGlobalScore}%`}
            trend={trends.score ? {
              value: `${trends.score.value}%`,
              label: 'vs last 30d',
              direction: trends.score.direction
            } : undefined}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <CompactMetricCard
            label="Avg OMI"
            value={`${Math.round(data.metrics.avgGlobalOMI)}%`}
            icon={<Award className="w-4 h-4" />}
          />
          <div className="bg-white border border-sbk-slate-200 shadow-sm p-6 rounded-lg">
            <p className="text-xs uppercase tracking-wide text-sbk-slate-500 font-medium">Top Category</p>
            <p className="text-3xl font-bold text-sbk-slate-900 mt-2">{data.metrics.mostPassed}</p>
            <p className="text-sm text-sbk-green-600 mt-2">✓ Most passed</p>
          </div>
          <div className="bg-white border border-sbk-slate-200 shadow-sm p-6 rounded-lg">
            <p className="text-xs uppercase tracking-wide text-sbk-slate-500 font-medium">Low Category</p>
            <p className="text-3xl font-bold text-sbk-slate-900 mt-2">{data.metrics.mostFailed}</p>
            <p className="text-sm text-sbk-red-600 mt-2">✗ Most failed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-sbk-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-sbk-slate-400" />
                  Tutor Leaderboard
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sbk-slate-400" />
                <input
                  type="text"
                  placeholder="Search tutors..."
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border border-sbk-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sbk-primary w-full md:w-64 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-sbk-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-sbk-slate-100">
                {filteredLeaderboard.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-sbk-slate-500">No tutors found</p>
                  </div>
                ) : (
                  filteredLeaderboard.map((t, idx) => {
                    const rank = idx + 1;
                    const omi = t.omi ?? null;
                    const omiColor = omi !== null ? (omi >= 75 ? 'bg-sbk-primary' : omi >= 60 ? 'bg-sbk-depth' : 'bg-sbk-warning') : 'bg-sbk-slate-200';
                    return (
                      <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-sbk-slate-50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm flex-shrink-0 ${rank === 1 ? 'bg-sbk-primary/10 text-sbk-primary' : 'bg-sbk-slate-100 text-sbk-slate-700'}`}>{rank}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-sbk-slate-900 truncate">{t.full_name}</p>
                            <p className="text-xs text-sbk-slate-500 truncate">{t.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-sbk-slate-500 uppercase font-medium">Tests</p>
                            <p className="font-semibold text-sbk-slate-900 mt-1">{t.testsTaken}</p>
                          </div>

                          <div className="text-center">
                            <p className="text-xs text-sbk-slate-500 uppercase font-medium">Avg</p>
                            {t.avgPercentage !== null ? (
                              <p className="font-semibold text-sbk-slate-900 mt-1">{Math.round(t.avgPercentage)}%</p>
                            ) : (
                              <p className="text-xs text-sbk-slate-400 italic mt-1">No Tests</p>
                            )}
                          </div>

                          <div className="w-48">
                            <div className="flex items-center justify-between mb-2">
                              <p className={`text-sm font-semibold ${omi !== null ? (omi >= 60 ? 'text-sbk-slate-900' : 'text-sbk-red-600') : 'text-sbk-slate-400'}`}>{omi !== null ? `${Math.round(omi)}%` : 'N/A'}</p>
                              <p className="text-xs text-sbk-slate-400 uppercase font-medium">OMI</p>
                            </div>
                            <div className="h-2 bg-sbk-slate-100 rounded-full overflow-hidden transition-all">
                              <div className={`${omiColor} h-full rounded-full transition-all`} style={{ width: `${omi !== null ? Math.min(100, Math.max(0, omi)) : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Risk & Inactive */}
          <div className="space-y-6">
            {/* Priority Risk */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-sbk-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-sbk-slate-400" />
                  Priority Risk
                </h2>
                <p className="text-sm text-sbk-slate-500 mt-1">Below 60% performance</p>
              </div>
              <div className="bg-sbk-slate-50 rounded-lg overflow-hidden p-4 border border-sbk-slate-200">
                {data.risk.below60.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-sbk-slate-500">✓ No tutors at risk</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data?.risk.below60.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-3 bg-white rounded-lg shadow-sm">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-sbk-slate-900 truncate">{t.full_name}</p>
                          <p className="text-sm text-sbk-red-600 font-medium mt-0.5">{Math.round(t.avgPercentage)}%</p>
                        </div>
                        <Button size="sm" variant="outline">Review</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inactive Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-sbk-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sbk-slate-400" />
                  Inactive Tutors
                </h2>
                <p className="text-sm text-sbk-slate-500 mt-1">No tests taken</p>
              </div>
              <div className="bg-white rounded-lg border border-sbk-slate-200 shadow-sm overflow-hidden max-h-64 overflow-y-auto">
                {data.risk.inactive.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-sbk-slate-500">✓ All tutors active</p>
                  </div>
                ) : (
                  <div className="divide-y divide-sbk-slate-100">
                    {data.risk.inactive.map((t: any) => (
                      <div key={t.id} className="p-4 flex justify-between items-center hover:bg-sbk-slate-50 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-sbk-slate-900">{t.full_name}</p>
                          <p className="text-xs text-sbk-slate-400 mt-0.5">No tests taken</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-xs">Ping</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
