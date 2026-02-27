import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Table } from '../../components/common/Table';
import { 
  User as UserIcon, Shield, ShieldOff, Key, 
  Unlock, Clock, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Tutor {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'tutor';
  is_active: boolean;
  total_attempts: number;
  average_score: number | null;
  last_login?: string;
}

export default function Tutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      const data = await api.getAllTutors();
      setTutors(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Where did everyone go? 🤷 Failed to load tutors.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: Tutor) => {
    try {
      const updated = await api.updateUserAccount(user.id, { is_active: !user.is_active });
      toast.success(`${updated.is_active ? 'User awakened! ☀️' : 'User put to sleep. 🌙'}`);
      fetchTutors();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Computer says no. 🤖 Operation failed.');
    }
  };

  const handleToggleRole = async (user: Tutor) => {
    const newRole = user.role === 'admin' ? 'tutor' : 'admin';
    if (!confirm(`Promote ${user.full_name} to ${newRole}?`)) return;
    
    try {
      await api.updateUserAccount(user.id, { role: newRole });
      toast.success(`Level up! 🍄 Role updated to ${newRole}`);
      fetchTutors();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Promotion denied. 🛑 Failed to update role.');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await api.triggerPasswordReset(email);
      toast.success('Carrier pigeon dispatched! 🐦 Password reset sent.');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Pigeon got lost. 🦅 Failed to send reset link.');
    }
  };

  const handleManualUnlock = async (userId: string) => {
    try {
      await api.unlockTutorRetake(userId);
      toast.success('Unshackled! ⛓️‍💥 Retake lock cleared.');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Keys missing! 🔑 Failed to unlock.');
    }
  };

  const filteredTutors = tutors.filter((t) =>
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="text-slate-500 font-medium mt-4">One Momment✍️</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sbk-slate-50 via-white to-sbk-slate-50/50 space-y-8 pb-16 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-sbk-slate-900">Tutor Management</h1>
            <p className="text-sm text-sbk-slate-500 mt-1">Control access, roles, and security for SBK staff.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sbk-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-sbk-slate-200 focus:outline-none focus:ring-2 focus:ring-sbk-blue w-80 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-sbk-slate-200 shadow-sm overflow-hidden">
          <Table 
            data={filteredTutors}
            keyExtractor={(t) => t.id}
            columns={[
              { 
                header: 'Staff Member', 
                render: (t) => (
                  <div className="flex items-center gap-3 py-2">
                    <div className={`p-2.5 rounded-lg ${t.is_active ? 'bg-sbk-blue/10 text-sbk-blue' : 'bg-sbk-slate-100 text-sbk-slate-400'}`}>
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${t.is_active ? 'text-sbk-slate-900' : 'text-sbk-slate-400 line-through'}`}>{t.full_name}</p>
                      <p className="text-xs text-sbk-slate-500">{t.email}</p>
                    </div>
                  </div>
                )
              },
              { 
                header: 'Role', 
                render: (t) => (
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    t.role === 'admin' ? 'bg-sbk-teal/20 text-sbk-teal' : 'bg-sbk-blue/20 text-sbk-depth'
                  }`}>
                    {t.role}
                  </span>
                )
              },
              { 
                header: 'Performance', 
                render: (t) => (
                  <div className="text-sm">
                    <p className="font-semibold text-sbk-slate-900">{t.total_attempts} Tests</p>
                    <p className="text-xs text-sbk-slate-500">{t.average_score !== null ? `${Math.round(t.average_score)}% Avg` : 'N/A'}</p>
                  </div>
                )
              },
              { 
                header: 'Last Login', 
                render: (t) => (
                  <div className="flex items-center gap-2 text-xs text-sbk-slate-600">
                    <Clock className="w-4 h-4 text-sbk-slate-400" />
                    <span>{t.last_login ? new Date(t.last_login).toLocaleDateString() : 'Never'}</span>
                  </div>
                )
              },
              { 
                header: 'Actions', 
                className: 'text-right',
                render: (t) => (
                  <div className="flex justify-end gap-1.5">
                    <button 
                      onClick={() => handleManualUnlock(t.id)}
                      className="p-2 text-sbk-slate-400 hover:text-sbk-green-600 hover:bg-sbk-green-50 rounded-lg transition-colors duration-200"
                      title="Unlock Retake"
                    >
                      <Unlock className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleResetPassword(t.email)}
                      className="p-2 text-sbk-slate-400 hover:text-sbk-amber-600 hover:bg-sbk-amber-50 rounded-lg transition-colors duration-200"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleRole(t)}
                      className="p-2 text-sbk-slate-400 hover:text-sbk-teal hover:bg-sbk-teal/10 rounded-lg transition-colors duration-200"
                      title="Change Role"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleActive(t)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${t.is_active ? 'text-sbk-slate-400 hover:text-sbk-red-600 hover:bg-sbk-red-50' : 'text-sbk-green-600 hover:bg-sbk-green-50'}`}
                      title={t.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {t.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
