import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, BarChart2, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LayoutProps {
  children: ReactNode;
  userRole?: 'admin' | 'tutor';
  userName?: string;
}

export function Layout({ children, userRole, userName }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3 group">
                <img 
                  src="/assets/logo.png" 
                  alt="Smart Brains Kenya Logo" 
                  className="h-8 w-auto sm:h-10 transition-transform group-hover:scale-105"
                />
                <span className="hidden xs:inline font-bold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-sbk-blue transition-colors">
                  SBK Tutor
                </span>
              </Link>

              <nav className="hidden md:flex space-x-4">
                {userRole === 'tutor' && (
                  <>
                    <Link to="/dashboard" className="text-slate-600 hover:text-sbk-blue px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/assessments" className="text-slate-600 hover:text-sbk-blue px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                      <FileText className="w-4 h-4" /> Assessments
                    </Link>
                  </>
                )}
                {userRole === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="text-slate-600 hover:text-sbk-blue px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                      <BarChart2 className="w-4 h-4" /> Analytics
                    </Link>
                    <Link to="/admin/manage" className="text-slate-600 hover:text-sbk-blue px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                      <Settings className="w-4 h-4" /> Management
                    </Link>
                    <Link to="/admin/tutors" className="text-slate-600 hover:text-sbk-blue px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Staff
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-slate-900">{userName || 'User'}</span>
                <span className="text-xs text-slate-500 capitalize">{userRole || 'Role'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-sbk-slate-50 border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-3">
            <img 
              src="/assets/logo.png" 
              alt="Smart Brains Kenya" 
              className="h-6 w-auto opacity-60"
            />
          </div>
          <p className="text-slate-600 text-sm">
            &copy; {new Date().getFullYear()} Smart Brains Kenya. Internal Use Only.
          </p>
        </div>
      </footer>
    </div>
  );
}
