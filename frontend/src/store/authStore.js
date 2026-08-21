import { create } from 'zustand';

const storedUser = localStorage.getItem('swipex_user');

const useAuthStore = create((set) => ({
  token: localStorage.getItem('swipex_token') || null,
  user: storedUser ? JSON.parse(storedUser) : null,

  setAuth: (token, user) => {
    localStorage.setItem('swipex_token', token);
    localStorage.setItem('swipex_user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem('swipex_token');
    localStorage.removeItem('swipex_user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!localStorage.getItem('swipex_token'),
}));

export default useAuthStore;
