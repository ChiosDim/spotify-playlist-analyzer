import { useRef, useState } from "react";
import { useLibrarySimilar } from "../hooks/useLibrarySimilar";
import PlaylistPicker from "../components/PlaylistPicker";
import LibraryMatchCard from "../components/LibraryMatchCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function LibrarySimilar() {
  const mutation = useLibrarySimilar();
  const [selected, setSelected] = useState(null);
  const [limit, setLimit] = useState(30);

  const outputRef = useRef(null);

  const scrollToOutput = () => {
    requestAnimationFrame(() => {
      const el = outputRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  };

  const handlePick = (playlist) => {
    mutation.reset();
    setSelected(playlist);
    mutation.mutate({ playlistId: playlist.id, minScore: 0, perSource: 3, limit });
    scrollToOutput();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">From My Library</h1>
        <p className="text-base-content/60">
          Find tracks in your other playlists that sound similar to the one you pick. Nothing from
          outside your own collection — just your music, rediscovered.
        </p>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <label className="form-control">
            <span className="label-text mb-2">
              Number of results: <strong>{limit}</strong>
            </span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="range range-primary range-sm"
            />
          </label>
        </div>
      </div>

      <PlaylistPicker onSelect={handlePick} disabled={mutation.isPending} />

      <div ref={outputRef}>
        {mutation.isPending && (
          <div className="space-y-3">
            <LoadingSpinner
              label={
                selected
                  ? `Searching your library for tracks like "${selected.name}"…`
                  : "Searching your library…"
              }
            />
            <p className="text-xs text-center text-base-content/50">
              The first search can take up to 60 seconds while we build and enrich your library.
              Later searches will be instant.
            </p>
            <p className="text-xs text-center text-base-content/40">
              Tip: keep this tab open. Don&#39;t refresh or navigate away.
            </p>
          </div>
        )}

        {mutation.error && <ErrorAlert error={mutation.error} />}

        {mutation.data && (
          <div className="space-y-4">
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Matches found</div>
                <div className="stat-value text-primary">{mutation.data.matchCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Library tracks</div>
                <div className="stat-value">{mutation.data.libraryTrackCount}</div>
                <div className="stat-desc">
                  from {mutation.data.libraryPlaylistCount} playlists
                  {mutation.data.librarySkippedCount > 0 &&
                    ` · ${mutation.data.librarySkippedCount} skipped`}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Cache</div>
                <div className="stat-value text-sm">
                  {mutation.data.libraryCached ? "Hit" : "Fresh"}
                </div>
                <div className="stat-desc">
                  {mutation.data.libraryCached ? "instant" : "next time will be faster"}
                </div>
              </div>
            </div>

            {mutation.data.matches.length === 0 ? (
              <div className="alert alert-info">
                <span>No matches found at this similarity level. Try lowering the threshold.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mutation.data.matches.map((m, i) => (
                  <LibraryMatchCard key={i} match={m} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
