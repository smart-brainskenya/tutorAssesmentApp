import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BarChart2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function Login() {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setLoading(false);
        setError(loginError.message);
        return;
      }

      if (!data.user) {
        setLoading(false);
        setError('Login failed. No user data returned.');
        return;
      }

      // Fetch profile to determine role-based redirect
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Even if profile fetch fails, we can try to fallback to dashboard
        // or show a specific error
        setError('Session started but could not retrieve your role. Please refresh.');
        setLoading(false);
        return;
      }

      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError(err.message || 'An unexpected error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary-600 rounded-xl mb-4">
          <BarChart2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          SBK Intelligence
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to your internal portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              label="Work Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@smartbrainskenya.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md font-medium border border-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  First time here?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Register with company email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
