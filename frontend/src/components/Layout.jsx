import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function Layout() {
  return (
    <div className="flex min-h-screen bg-sx-bg">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
