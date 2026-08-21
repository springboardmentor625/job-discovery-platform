import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Navbar from './Navbar';

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
