import { Link } from "react-router-dom";

// Previously there was no catch-all route at all — visiting any
// unrecognized URL just rendered a blank page with no way back in.
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sx-bg px-6 text-center">
      <p className="text-4xl font-semibold text-sx-text">404</p>
      <p className="text-sm text-sx-text-muted">
        This page doesn't exist.
      </p>
      <Link
        to="/candidate"
        className="mt-2 rounded-lg bg-sx-primary px-4 py-2 text-sm font-medium text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default NotFound;
