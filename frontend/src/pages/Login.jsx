import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // FastAPI strictly requires form data for OAuth2 logins, NOT JSON!
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = response.data.access_token;
            const role = response.data.role;
            if (!token || !role) {
                throw new Error('Login response missing token or role');
            }
            login(token, role, response.data.user_id);

            // Smart Routing based on who just logged in
            if (role === 'recruiter') {
                navigate('/recruiter');
            } else {
                navigate('/swipe');
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Failed to securely authenticate. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-8 border border-gray-100">

                {/* Header */}
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Swipe<span className="text-indigo-600">X</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Sign in to access your AI-powered career dashboard.
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                required
                                className="pl-10 block w-full outline-none border border-gray-300 rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                className="pl-10 block w-full outline-none border border-gray-300 rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <>
                                Sign In <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>
                {/* Switch to Register */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    Don't have an account yet?{' '}
                    <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                        Create one here
                    </Link>
                </div>
            </div>
        </div>
    );
}