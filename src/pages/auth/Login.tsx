import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function Login() {
  useAuth(); // Component participates in AuthContext
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
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError((err as Error).message || 'An unexpected error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Display */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center lg:px-12 bg-sbk-blue-dark relative overflow-hidden">
        {/* Subtle geometric pattern using CSS gradients */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]" />
        
        <div className="z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center p-5 bg-white/10 rounded-2xl backdrop-blur-sm mb-8 border border-white/20 shadow-xl">
            <Lightbulb className="w-12 h-12 text-sbk-accent-yellow" />
          </div>
          <h2 className="text-4xl font-display font-bold tracking-tight mb-4 text-white">
            Tutor Intelligence
          </h2>
          <p className="text-sbk-blue-light text-lg font-medium">
            The secure assessment portal for Smart Brains Kenya. Elevate your teaching standards.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-[500px] lg:px-12 bg-sbk-bg-main">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-sbk-blue-dark/5 rounded-xl mb-4">
              <Lightbulb className="w-8 h-8 text-sbk-blue-dark" />
            </div>
            <h2 className="text-3xl font-display font-bold text-sbk-blue-dark mb-2">Tutor Intelligence</h2>
            <p className="text-sbk-slate-500 font-medium">Secure Assessment Portal</p>
          </div>

          <div className="bg-white py-10 px-8 shadow-2xl shadow-sbk-slate-200/50 border border-sbk-slate-100 sm:rounded-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sbk-blue-dark to-sbk-blue-light rounded-t-2xl" />
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <Input
                  label="Work Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@smartbrainskenya.com"
                  className="bg-sbk-bg-alt border-transparent focus:bg-white focus:border-sbk-blue-light transition-colors"
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
                  className="bg-sbk-bg-alt border-transparent focus:bg-white focus:border-sbk-blue-light transition-colors"
                />
              </div>

              {error && (
                <div className="p-4 bg-sbk-danger/10 text-sbk-danger text-sm rounded-xl font-bold border border-sbk-danger/20 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-sbk-danger mt-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base shadow-lg shadow-sbk-blue-dark/20 hover:shadow-sbk-blue-dark/40 transition-all duration-300"
                isLoading={loading}
              >
                Sign In <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-sbk-slate-100">
              <div className="text-center">
                <p className="text-sm text-sbk-slate-500 mb-3 font-medium">New to the platform?</p>
                <Link
                  to="/register"
                  className="inline-flex items-center text-sm font-bold text-sbk-blue-dark hover:text-sbk-blue-light transition-colors"
                >
                  Create your account
                </Link>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-xs text-sbk-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Smart Brains Kenya. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
