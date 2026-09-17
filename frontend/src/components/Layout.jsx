import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}