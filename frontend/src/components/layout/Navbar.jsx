import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, History, User, Briefcase, Sun, Moon } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation(); // Gets the current URL path

    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper function to dynamically style the active tab
    const getNavStyle = (path) => {
        const isActive = location.pathname === path;
        return `font-semibold flex items-center text-sm px-3 py-2 rounded-xl transition-all duration-200 ${
            isActive 
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' // ACTIVE STATE
            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800/50' // INACTIVE STATE
        }`;
    };

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to={user ? (user.role === 'recruiter' ? '/recruiter' : '/swipe') : '/login'} className="flex items-center">
                            <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Swipe<span className="text-indigo-600 dark:text-indigo-400">X</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        
                        {user && user.role === 'candidate' && (
                            <>
                                <Link to="/swipe" className={getNavStyle('/swipe')}><LayoutDashboard className="w-4 h-4 mr-1.5"/> Feed</Link>
                                <Link to="/history" className={getNavStyle('/history')}><History className="w-4 h-4 mr-1.5"/> History</Link>
                                <Link to="/profile" className={getNavStyle('/profile')}><User className="w-4 h-4 mr-1.5"/> Profile</Link>
                            </>
                        )}

                        {user && user.role === 'recruiter' && (
                            <Link to="/recruiter" className={getNavStyle('/recruiter')}><Briefcase className="w-4 h-4 mr-1.5"/> Dashboard</Link>
                        )}

                        <div className="flex items-center pl-2 sm:pl-4 ml-2 border-l border-gray-200 dark:border-gray-700 space-x-2 sm:space-x-4">
                            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-gray-50 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-900/30 rounded-full transition-colors" aria-label="Toggle Dark Mode">
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {user && (
                                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-semibold flex items-center text-sm px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <LogOut className="w-4 h-4 mr-1.5"/> Sign Out
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}