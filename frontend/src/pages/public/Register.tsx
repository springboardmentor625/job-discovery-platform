import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api/auth.api';

/** Safely decode JWT payload */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'JobSeeker' | 'Recruiter'>('JobSeeker');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // If already logged in redirect immediately
  if (!authLoading && user) {
    return <Navigate to={user.role === 'Recruiter' ? '/recruiter/dashboard' : '/dashboard'} replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register
      await authApi.register({ first_name: firstName, last_name: lastName, email, password, role });

      // 2. Auto-login
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      const tokenResponse = await authApi.login(formData);
      const accessToken = tokenResponse.access_token;

      localStorage.setItem('token', accessToken);
      const userData = await authApi.getCurrentUser();
      const payload = decodeJwtPayload(accessToken);
      const resolvedRole = (payload?.role ?? userData.role) as 'JobSeeker' | 'Recruiter' | 'Admin';

      login(accessToken, { ...userData, role: resolvedRole });

      if (resolvedRole === 'Recruiter') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      localStorage.removeItem('token');
      setError(err.response?.data?.detail || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'block w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">SwipeX</h1>
        <h2 className="mt-2 text-center text-xl font-semibold text-slate-700">Create an account</h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors">
            Sign in instead
          </Link>
        </p>
      </div>

      {/* Card */}
      <div className="mt-8 mx-auto w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-8 py-10">

          {/* Role Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 gap-1">
            {(['JobSeeker', 'Recruiter'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
                  ${role === r
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {r === 'JobSeeker' ? '🎯 Job Seeker' : '🏢 Recruiter'}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleRegister} noValidate>
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                <input id="firstName" type="text" autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="John" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                <input id="lastName" type="text" autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Doe" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="regEmail" className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
              <input id="regEmail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="regPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="regPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass + ' pr-11'}
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass + ' pr-11'}
                  placeholder="Repeat your password"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all duration-150"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Creating account…</span></>
                ) : (
                  <span>Create account</span>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 pt-1">
              By signing up you agree to our <span className="text-slate-600 font-medium">Terms of Service</span>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
