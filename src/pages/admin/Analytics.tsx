import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { 
  Users, TrendingUp, AlertTriangle, Award, 
  FileDown, Search, CheckCircle, XCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LeaderboardItem {
  id: string;
  full_name: string;
  email: string;
  testsTaken: number;
  avgPercentage: number;
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-slate-500 font-medium">Aggregating global metrics...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Admin Intelligence</h1>
          <p className="text-slate-500">Global performance metrics and risk detection.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2" isLoading={exporting}>
          <FileDown className="w-4 h-4" /> Export All Results (CSV)
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Tutors" value={data.metrics.totalTutors} icon={<Users />} color="blue" />
        <MetricCard label="Global Avg" value={`${data.metrics.avgGlobalScore}%`} icon={<TrendingUp />} color="primary" />
        <MetricCard label="Top Category" value={data.metrics.mostPassed} icon={<CheckCircle />} color="green" />
        <MetricCard label="Low Category" value={data.metrics.mostFailed} icon={<XCircle />} color="red" />
        <MetricCard label="At Risk" value={data.metrics.atRiskCount} icon={<AlertTriangle />} color="amber" subtext="Below 60%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Tutor Leaderboard
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tutors..." 
                className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table<LeaderboardItem> 
            data={filteredLeaderboard}
            keyExtractor={(t) => t.id}
            columns={[
              { header: 'Rank', render: (_, i) => <span className="font-bold text-slate-400">#{i + 1}</span>, className: 'w-16' },
              { header: 'Tutor', render: (t) => (
                <div>
                  <p className="font-bold text-slate-900">{t.full_name}</p>
                  <p className="text-xs text-slate-500">{t.email}</p>
                </div>
              )},
              { header: 'Tests', render: (t) => <span className="font-medium">{t.testsTaken}</span> },
              { header: 'Avg Score', render: (t) => (
                <span className={`font-black ${t.avgPercentage >= 75 ? 'text-green-600' : t.avgPercentage >= 60 ? 'text-blue-600' : 'text-red-600'}`}>
                  {Math.round(t.avgPercentage)}%
                </span>
              )}
            ]}
          />
        </div>

        {/* Risk & Inactive */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Priority Risk (Below 60%)
            </h2>
            <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden shadow-sm">
               {data.risk.below60.length === 0 ? (
                 <p className="p-4 text-sm text-red-600 italic">No tutors currently at risk.</p>
               ) : (
                 <div className="divide-y divide-red-100">
                   {data.risk.below60.map((t: any) => (
                     <div key={t.id} className="p-4 flex justify-between items-center bg-white/50 hover:bg-white transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t.full_name}</p>
                          <p className="text-[10px] text-red-600 font-bold uppercase">{Math.round(t.avgPercentage)}% Average</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] border-red-200 hover:bg-red-100">Review</Button>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" /> Inactive Tutors
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto shadow-sm">
               {data.risk.inactive.length === 0 ? (
                 <p className="p-4 text-sm text-slate-500 italic">No inactive tutors found.</p>
               ) : (
                 <div className="divide-y divide-slate-100">
                   {data.risk.inactive.map((t: any) => (
                     <div key={t.id} className="p-4 flex justify-between items-center bg-white/50 hover:bg-white transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">No Tests Taken</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-[10px]">Ping</Button>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, subtext }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`p-2 w-fit rounded-lg mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      {subtext && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{subtext}</p>}
      <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-125 transition-transform duration-500">
        {icon && <div className="w-20 h-20">{icon}</div>}
      </div>
    </div>
  );
}
