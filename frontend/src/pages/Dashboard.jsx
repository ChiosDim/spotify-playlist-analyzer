import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSpotifyPlaylists } from "../hooks/useSpotifyPlaylists";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useSpotifyPlaylists(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        {user?.profileImage && (
          <img src={user.profileImage} alt="" className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-3xl font-bold">Hi, {user?.displayName || "there"} 👋</h1>
          <p className="text-base-content/60">
            {user?.product === "premium" ? "Spotify Premium" : "Spotify Free"}
            {user?.country && ` · ${user.country}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/analyze" className="card bg-base-100 hover:bg-base-200 shadow-sm transition-colors">
          <div className="card-body">
            <h3 className="card-title text-base">Analyze</h3>
            <p className="text-xs text-base-content/60">Upload a CSV or pick a Spotify playlist</p>
          </div>
        </Link>
        <Link to="/duplicates" className="card bg-base-100 hover:bg-base-200 shadow-sm transition-colors">
          <div className="card-body">
            <h3 className="card-title text-base">Find Duplicates</h3>
            <p className="text-xs text-base-content/60">Clean up your library</p>
          </div>
        </Link>
        <Link to="/compare" className="card bg-base-100 hover:bg-base-200 shadow-sm transition-colors">
          <div className="card-body">
            <h3 className="card-title text-base">Compare</h3>
            <p className="text-xs text-base-content/60">Common and unique tracks</p>
          </div>
        </Link>
        <Link to="/recommend" className="card bg-base-100 hover:bg-base-200 shadow-sm transition-colors">
          <div className="card-body">
            <h3 className="card-title text-base">Recommendations</h3>
            <p className="text-xs text-base-content/60">Discover similar tracks</p>
          </div>
        </Link>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-3">Your playlists</h2>
        {isLoading && <LoadingSpinner />}
        {error && <ErrorAlert error={error} />}
        {data?.playlists && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.playlists.map((p) => (
              <Link
                key={p.id}
                to={`/analyze?playlist=${p.id}`}
                className="card bg-base-100 hover:bg-base-200 shadow-sm transition-colors"
              >
                <div className="card-body p-3">
                  {p.image && (
                    <img src={p.image} alt="" className="w-full aspect-square object-cover rounded-md mb-2" />
                  )}
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-base-content/60">{p.trackCount} tracks</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}