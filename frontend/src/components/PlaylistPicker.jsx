import { useSpotifyPlaylists } from "../hooks/useSpotifyPlaylists";
import LoadingSpinner from "./LoadingSpinner";
import ErrorAlert from "./ErrorAlert";

export default function PlaylistPicker({ onSelect, disabled }) {
  const { data, isLoading, error } = useSpotifyPlaylists(true);

  if (isLoading) return <LoadingSpinner label="Loading your playlists…" />;
  if (error) return <ErrorAlert error={error} />;

  const playlists = data?.playlists ?? [];

  if (playlists.length === 0) {
    return (
      <p className="text-sm text-base-content/60 py-4">
        No playlists found on your Spotify account.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {playlists.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          disabled={disabled}
          className="card bg-base-100 hover:bg-base-200 border border-base-300 text-left transition-colors"
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              {p.image ? (
                <img src={p.image} alt="" className="w-12 h-12 rounded-md object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-base-300" />
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-base-content/60">{p.trackCount} tracks</p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
