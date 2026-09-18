import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

function clearSessionStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('user_id');
        if (token && role) {
            setUser({ token, role, userId });
        }
        setLoading(false);
    }, []);

    const login = (token, role, userId) => {
        clearSessionStorage();
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        if (userId) {
            localStorage.setItem('user_id', String(userId));
        }
        setUser({ token, role, userId: userId || null });
    };

    const logout = () => {
        clearSessionStorage();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
