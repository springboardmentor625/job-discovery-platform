import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await loginUser(form.email, form.password);
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/discover');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0]?.msg : err.response?.data?.error || 'Incorrect email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-display text-xl font-semibold text-gold">
          SwipeX
        </Link>
        <h1 className="font-display text-2xl font-semibold mt-6 mb-1">Welcome back</h1>
        <p className="text-textLo text-sm mb-6">Log in to keep discovering roles.</p>

        <form onSubmit={handleSubmit} className="bg-surface border border-white/10 rounded-xl p-6">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <p className="text-coral text-sm mb-3">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="text-sm text-textLo mt-4 text-center">
          New to SwipeX?{' '}
          <Link to="/register" className="text-gold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
