import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../api/auth';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seeker' });
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
      const { token, user } = await registerUser(form.name, form.email, form.password, form.role);
      setAuth(token, user);
      toast.success(`Account created! Welcome, ${user.name} 🎉`);
      navigate('/profile', { state: { firstVisit: true } });
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0]?.msg : err.response?.data?.error || 'Something went wrong. Please try again.';
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
        <h1 className="font-display text-2xl font-semibold mt-6 mb-1">Create your account</h1>
        <p className="text-textLo text-sm mb-6">Start your search in under a minute.</p>

        <form onSubmit={handleSubmit} className="bg-surface border border-white/10 rounded-xl p-6">
          <Input
            label="Full name"
            placeholder="Alex Morgan"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
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
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          <label className="block mb-4">
            <span className="block text-xs font-mono uppercase tracking-wide text-textLo mb-1.5">Account type</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full bg-surfaceHi border border-white/10 rounded-md px-3.5 py-2.5 text-textHi focus:border-gold outline-none"
            >
              <option value="seeker">Job seeker</option>
              <option value="recruiter">Recruiter</option>
              <option value="interviewer">Interviewer / HR panel</option>
              <option value="admin">Platform admin</option>
            </select>
          </label>

          {error && <p className="text-coral text-sm mb-3">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-sm text-textLo mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
