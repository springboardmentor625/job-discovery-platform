import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Lock, User, Briefcase, ArrowRight, Loader2 } from 'lucide-react';

export default function Register() {
    const [fullName, setFullName] = useState(''); // <-- NEW STATE
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('candidate'); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // THE FIX: We now send full_name to satisfy the Pydantic schema!
            await api.post('/auth/register', {
                email: email,
                username: email, 
                password: password,
                full_name: fullName, // <-- ADDED TO PAYLOAD
                role: role 
            });

            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const loginRes = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(loginRes.data.access_token, loginRes.data.role || role, loginRes.data.user_id);
            navigate(role === 'recruiter' ? '/recruiter' : '/profile');

        } catch (err) {
            setError(
                err.response?.data?.detail || 
                'Failed to create account. Please check your details.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-8 border border-gray-100 dark:border-gray-700">
                
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Join Swipe<span className="text-indigo-600 dark:text-indigo-400">X</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Create an account to start your AI-powered journey.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-800 text-center break-words">
                        {typeof error === 'string' ? error : JSON.stringify(error)}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    
                    <div className="flex p-1 space-x-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setRole('candidate')}
                            className={`flex-1 flex justify-center items-center py-2.5 text-sm font-semibold rounded-lg transition-all ${
                                role === 'candidate' 
                                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <User className="w-4 h-4 mr-2" /> Candidate
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('recruiter')}
                            className={`flex-1 flex justify-center items-center py-2.5 text-sm font-semibold rounded-lg transition-all ${
                                role === 'recruiter' 
                                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            <Briefcase className="w-4 h-4 mr-2" /> Recruiter
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Full Name Input (NEW) */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="fullName"
                                type="text"
                                required
                                className="pl-10 block w-full outline-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        {/* Email Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                required
                                className="pl-10 block w-full outline-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                className="pl-10 block w-full outline-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
}