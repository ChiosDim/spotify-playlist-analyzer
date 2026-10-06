import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { isAuthenticated, loginWithSpotify } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4">
        <span className="text-primary">Analyze</span> your Spotify playlists
      </h1>
      <p className="text-lg text-base-content/70 mb-10 max-w-2xl mx-auto">
        Get deep insights into your music taste. Compare playlists, find duplicates, and spot the
        tracks that sound most alike — all based on audio features.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
        <button onClick={loginWithSpotify} className="btn btn-primary btn-lg">
          Log in with Spotify
        </button>
        <Link to="/login" className="btn btn-outline btn-lg">
          Or upload a CSV
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {[
          {
            title: "Deep Analysis",
            desc: "Genre distribution, audio feature statistics, and tempo insights from every track.",
          },
          {
            title: "Duplicate Finder",
            desc: "Clean up your library by finding duplicates — even when track names differ slightly.",
          },
          {
            title: "Similar Tracks",
            desc: "Discover which tracks in your playlist sound most alike, ranked by audio similarity.",
          },
        ].map((f) => (
          <div key={f.title} className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">{f.title}</h2>
              <p className="text-sm text-base-content/70">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
