
export default function LibraryMatchCard({ match }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{match.track.name}</h3>
            <p className="text-sm text-base-content/60 truncate">{match.track.artists}</p>
          </div>
          <div className="badge badge-primary badge-lg shrink-0">#{match.rank}</div>
        </div>

        <p className="text-xs text-base-content/50">
          similar to <strong>{match.seedName}</strong> by {match.seedArtists}
        </p>

        {match.inPlaylists?.length > 0 && (
          <p className="text-xs text-base-content/40 border-t border-base-300 pt-2">
            You have this in:{" "}
            <span className="text-base-content/60">
              {match.inPlaylists.slice(0, 3).join(", ")}
              {match.inPlaylists.length > 3 && ` +${match.inPlaylists.length - 3} more`}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
