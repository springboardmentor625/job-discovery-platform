import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCandidate } from '../services/authApi';
const initialForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
};
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
      setError('Please fill in all required account information.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await registerCandidate(form);
      navigate('/login', {
        state: {
          successMessage: 'Registration successful. Sign in with your email and password to continue.',
        },
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="page-shell">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>SwipeX</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '1.1rem' }}>Create candidate account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form register-form">
          <div className="field-group">
            <label htmlFor="full_name">Full name<span style={{ color: 'red' }}> *</span></label>
            <input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="field-group">
            <label htmlFor="email">Email<span style={{ color: 'red' }}> *</span></label>
            <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="field-group">
            <label htmlFor="phone">Phone<span style={{ color: 'red' }}> *</span></label>
            <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} pattern="^\+?[0-9\s\-]{7,15}$" title="Please enter a valid phone number (7-15 digits, optional +)" required />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password<span style={{ color: 'red' }}> *</span></label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
              />
              <button type="button" className="toggle-btn" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {passwordFocused && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ color: form.password.length >= 12 ? 'green' : 'red' }}>
                  {form.password.length >= 12 ? '✓' : '✗'} At least 12 characters
                </div>
                <div style={{ color: /[A-Z]/.test(form.password) ? 'green' : 'red' }}>
                  {/[A-Z]/.test(form.password) ? '✓' : '✗'} At least one uppercase letter (A-Z)
                </div>
                <div style={{ color: /[a-z]/.test(form.password) ? 'green' : 'red' }}>
                  {/[a-z]/.test(form.password) ? '✓' : '✗'} At least one lowercase letter (a-z)
                </div>
                <div style={{ color: /[0-9]/.test(form.password) ? 'green' : 'red' }}>
                  {/[0-9]/.test(form.password) ? '✓' : '✗'} At least one digit (0-9)
                </div>
                <div style={{ color: /[!@#$%^&*]/.test(form.password) ? 'green' : 'red' }}>
                  {/[!@#$%^&*]/.test(form.password) ? '✓' : '✗'} At least one special character (!@#$%^&*)
                </div>
              </div>
            )}
          </div>
          <div className="field-group">
            <label htmlFor="confirm_password">Confirm password<span style={{ color: 'red' }}> *</span></label>
            <input
              id="confirm_password"
              type={showPassword ? 'text' : 'password'}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
          </div>
          {error ? <p className="error-message">{error}</p> : null}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="account-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}