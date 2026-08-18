import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordCandidate } from '../services/authApi';
const initialForm = {
  email: '',
  password: '',
  confirm_password: '',
};
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.email || !form.password || !form.confirm_password) {
      setError('Please provide your email and a new password.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await forgotPasswordCandidate(form);
      setSuccess(response.message || 'Password updated successfully.');
      setTimeout(() => {
        navigate('/login', {
          state: {
            successMessage: 'Password updated successfully. Please sign in again.',
          },
        });
      }, 800);
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="page-shell">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>SwipeX</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '1.1rem' }}>Reset password</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="reset-email">Email</label>
            <input id="reset-email" type="email" name="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="field-group">
            <label htmlFor="reset-password">New password</label>
            <div className="password-wrap">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
              />
              <button type="button" className="toggle-btn" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="reset-confirm">Confirm password</label>
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
            />
          </div>
          {error ? <p className="error-message">{error}</p> : null}
          {success ? <p className="success-message">{success}</p> : null}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
        <p className="account-text">
          Back to <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}