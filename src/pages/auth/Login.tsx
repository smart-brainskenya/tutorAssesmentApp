import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function Login() {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
        <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
          <Lightbulb className="w-10 h-10 text-sbk-accent" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          Tutor Intelligence
        </h2>
        <p className="text-slate-500 font-medium">
          Secure Assessment Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-xl shadow-slate-200/50 border border-slate-100 sm:rounded-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Input
                label="Work Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@smartbrainskenya.com"
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl font-bold border border-red-100 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base shadow-lg shadow-sbk-primary/20 hover:shadow-sbk-primary/30 transition-all duration-300"
              isLoading={loading}
            >
              Sign In <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-3">New to the platform?</p>
              <Link
                to="/register"
                className="inline-flex items-center text-sm font-bold text-sbk-primary hover:text-sbk-depth transition-colors"
              >
                Create your account
              </Link>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Smart Brains Kenya. All rights reserved.
        </p>
      </div>
    </div>
  );
}
