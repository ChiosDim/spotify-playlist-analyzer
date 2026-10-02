import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { isAuthenticated, loginWithSpotify } = useAuth();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h1 className="card-title text-xl">Log in to continue</h1>
          <p className="text-sm text-base-content/70 mb-4">
            Connect your Spotify account to analyze your playlists, or upload a CSV export from
            Exportify to use the app without logging in.
          </p>
          <button onClick={loginWithSpotify} className="btn btn-primary">
            Continue with Spotify
          </button>
        </div>
      </div>
    </div>
  );
}
