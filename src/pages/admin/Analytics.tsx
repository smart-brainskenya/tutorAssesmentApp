import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { Button } from '../../components/common/Button';
import {
  Users, TrendingUp, AlertTriangle, Award,
  FileDown, Search, CheckCircle, XCircle, Zap
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

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminStats();
      setData(res);
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
      const rows = data.rawAttempts.map((a: any) => [
        `"${a.user_id}"`, // Using ID as placeholder for name if not joined
        `"${a.user_id}"`,
        `"${a.categories?.name || 'Unknown'}"`,
        a.score,
        `${a.percentage}%`,
        `"${new Date(a.completed_at).toLocaleDateString()}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map((e: any) => e.join(','))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `sbk_tutor_results_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Export failed', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const filteredLeaderboard: LeaderboardItem[] = data?.leaderboard?.filter((t: any) => 
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sbk-blue"></div>
      <p className="text-slate-500 font-medium">Aggregating global metrics...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Intelligence</h1>
            <p className="text-sm text-slate-500 mt-1">Global performance metrics and risk detection.</p>
          </div>
          <Button onClick={exportCSV} variant="outline" className="gap-2" isLoading={exporting}>
            <FileDown className="w-4 h-4" /> Export All Results (CSV)
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-10">
          <MetricCard label="Total Tutors" value={data.metrics.totalTutors} icon={<Users className="w-5 h-5 text-slate-400" />} subtext={`${data.metrics.activeTutorsCount} Active`} />
          <MetricCard label="Global Avg" value={`${data.metrics.avgGlobalScore}%`} icon={<TrendingUp className="w-5 h-5 text-slate-400" />} />
          <OMICard label="Operational Maturity Index" value={data.metrics.avgGlobalOMI} />
          <CategoryCard label="Top Category" value={data.metrics.mostPassed} color="green" />
          <CategoryCard label="Low Category" value={data.metrics.mostFailed} color="red" />
          <AtRiskCard label="At Risk" value={data.metrics.atRiskCount} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-3">
                  <Award className="w-5 h-5 text-slate-400 opacity-60" />
                  Tutor Leaderboard
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tutors..." 
                  className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sbk-blue w-64 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredLeaderboard.map((t, idx) => {
                  const rank = idx + 1;
                  const omi = t.omi ?? null;
                  const omiColor = omi !== null ? (omi >= 75 ? 'bg-sbk-blue' : omi >= 60 ? 'bg-sbk-teal' : 'bg-sbk-orange') : 'bg-slate-200';
                  return (
                    <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${rank === 1 ? 'bg-sbk-blue/10 text-sbk-blue' : 'bg-slate-100 text-slate-700'}`}>{rank}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{t.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{t.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-slate-500">Tests</p>
                          <p className="font-medium text-slate-800">{t.testsTaken}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-slate-500">Avg</p>
                          {t.avgPercentage !== null ? (
                            <p className="font-semibold text-slate-900">{Math.round(t.avgPercentage)}%</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No Tests</p>
                          )}
                        </div>

                        <div className="w-48">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-semibold ${omi !== null ? (omi >= 60 ? 'text-slate-900' : 'text-red-600') : 'text-slate-400'}`}>{omi !== null ? `${Math.round(omi)}%` : 'N/A'}</p>
                            <p className="text-xs text-slate-400">OMI</p>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden transition-all">
                            <div className={`${omiColor} h-full rounded-full transition-all`} style={{ width: `${omi !== null ? Math.min(100, Math.max(0, omi)) : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Risk & Inactive */}
          <div className="space-y-6">
            {/* Priority Risk */}
            <div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-slate-400 opacity-60" />
                  Priority Risk
                </h2>
                <p className="text-sm text-slate-500 mt-1">Below 60% performance</p>
              </div>
              <div className="bg-slate-50 rounded-xl overflow-hidden p-4">
                {data.risk.below60.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-500">✓ No tutors at risk</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.risk.below60.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 truncate">{t.full_name}</p>
                          <p className="text-sm text-red-600 font-semibold mt-0.5">{Math.round(t.avgPercentage)}%</p>
                        </div>
                        <div>
                          <Button size="sm" variant="outline">Review</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Inactive Section */}
            <div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400 opacity-60" />
                  Inactive Tutors
                </h2>
                <p className="text-sm text-slate-500 mt-1">No tests taken</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-h-64 overflow-y-auto mt-2">
                {data.risk.inactive.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-slate-500">✓ All tutors active</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.risk.inactive.map((t: any) => (
                      <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t.full_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">No tests taken</p>
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

function MetricCard({ label, value, icon, subtext }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 mt-2">{value}</p>
          {subtext && <p className="text-sm text-slate-500 mt-2">{subtext}</p>}
        </div>
        {icon && (
          <div className="ml-4 mt-1 opacity-40">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function OMICard({ label, value }: any) {
  const percent = typeof value === 'number' ? Math.round(value) : 0;
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-3xl font-semibold text-slate-900 mt-2">{percent}%</p>
      <div className="mt-3">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="bg-sbk-blue h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
      </div>
      <p className="text-sm text-slate-500 mt-3">Operational Maturity Index</p>
    </div>
  );
}

function CategoryCard({ label, value, color }: any) {
  const dot = color === 'green' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`inline-block w-2 h-2 rounded-full ${dot} mt-1`}></span>
        <p className="text-sm text-slate-700 line-clamp-2">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-slate-900 mt-3 truncate">{value}</p>
    </div>
  );
}

function AtRiskCard({ label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-700">{label}</p>
      </div>
      <p className={`text-3xl font-semibold mt-3 ${value > 0 ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-2">{value > 0 ? 'Tutors below 60%' : 'No tutors flagged'}</p>
    </div>
  );
}
