import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ShieldCheck, BarChart2 } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Email domain validation
    if (!email.toLowerCase().endsWith('@smartbrainskenya.com')) {
      setError('Only @smartbrainskenya.com email addresses are allowed.');
      setLoading(false);
      return;
    }

    // Access Passcode validation
    const requiredPasscode = import.meta.env.VITE_SBK_ACCESS_CODE;
    if (passcode !== requiredPasscode) {
      setError('Invalid Access Passcode. Contact IT for the code.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'tutor', // Default role
          },
        },
      });

      if (signUpError) throw signUpError;
      
      if (data.user) {
        alert('Registration request successful! Please sign in.');
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
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
          SBK Tutor Registration
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Create your internal account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
          <form className="space-y-5" onSubmit={handleRegister}>
            <Input
              label="Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />

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
              placeholder="Minimum 6 characters"
              minLength={6}
            />

            <div className="relative">
               <Input
                label="Access Passcode"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter secret passcode"
              />
              <ShieldCheck className="absolute right-3 top-[34px] w-5 h-5 text-slate-300" />
            </div>

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
              Request Access
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Already registered? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
