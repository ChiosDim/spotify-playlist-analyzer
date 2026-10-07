import { useRef, useState } from "react";
import { useDiscoverCSV, useDiscoverSpotify } from "../hooks/useDiscover";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "../components/FileUpload";
import PlaylistPicker from "../components/PlaylistPicker";
import DiscoveryCard from "../components/DiscoveryCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function Discover() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState(isAuthenticated ? "spotify" : "csv");
  const [seedCount, setSeedCount] = useState(10);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const csvMutation = useDiscoverCSV();
  const spotifyMutation = useDiscoverSpotify();

  const activeMutation = tab === "spotify" ? spotifyMutation : csvMutation;
  const result = activeMutation.data;
  const error = activeMutation.error;
  const isPending = activeMutation.isPending;

  const outputRef = useRef(null);
  const scrollToOutput = () => {
    requestAnimationFrame(() => {
      const el = outputRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  };

  const handleCSV = (file) => {
    csvMutation.reset();
    setSelectedPlaylist(null);
    csvMutation.mutate({ file, seedCount, perSeed: 10, limit: 40 });
    scrollToOutput();
  };

  const handleSpotify = (playlist) => {
    spotifyMutation.reset();
    setSelectedPlaylist(playlist);
    spotifyMutation.mutate({
      playlistId: playlist.id,
      seedCount,
      perSeed: 10,
      limit: 40,
    });
    scrollToOutput();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-base-content/60">
          Find new music you don&#39;t own yet, based on the tracks already in your playlist.
          Powered by Last.fm&#39;s collaborative filtering.
        </p>
      </div>

      <div role="tablist" className="tabs tabs-boxed w-fit">
        {isAuthenticated && (
          <button
            role="tab"
            type="button"
            className={`tab ${tab === "spotify" ? "tab-active" : ""}`}
            onClick={() => setTab("spotify")}
          >
            Spotify Playlist
          </button>
        )}
        <button
          role="tab"
          type="button"
          className={`tab ${tab === "csv" ? "tab-active" : ""}`}
          onClick={() => setTab("csv")}
        >
          Upload CSV
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <label className="form-control">
            <span className="label-text mb-2">
              Seed tracks to sample: <strong>{seedCount}</strong>
            </span>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={seedCount}
              onChange={(e) => setSeedCount(Number(e.target.value))}
              className="range range-primary range-sm"
            />
            <span className="text-xs text-base-content/50 mt-1">
              Higher values search more broadly but take longer.
            </span>
          </label>
        </div>
      </div>

      {tab === "csv" && (
        <FileUpload onUpload={handleCSV} disabled={isPending} buttonLabel="Discover New Tracks" />
      )}

      {tab === "spotify" && isAuthenticated && (
        <>
          {!result && !isPending && (
            <p className="text-sm text-base-content/60">
              Select a playlist below to find new music based on it.
            </p>
          )}
          <PlaylistPicker onSelect={handleSpotify} disabled={isPending} />
        </>
      )}

      <div ref={outputRef}>
        {isPending && (
          <div className="space-y-3">
            <LoadingSpinner
              label={
                selectedPlaylist
                  ? `Asking Last.fm for tracks like "${selectedPlaylist.name}"…`
                  : "Asking Last.fm for similar tracks…"
              }
            />
            <p className="text-xs text-center text-base-content/50">
              Searching Last.fm&#39;s database and filtering against your library.
            </p>
          </div>
        )}

        {error && <ErrorAlert error={error} />}

        {result && (
          <div className="space-y-4">
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Discoveries</div>
                <div className="stat-value text-primary">{result.recommendationCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Source tracks</div>
                <div className="stat-value">{result.sourceTrackCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Excluded</div>
                <div className="stat-value text-sm">{result.excludedTrackCount}</div>
                <div className="stat-desc">already in your library</div>
              </div>
            </div>

            {result.recommendations.length === 0 ? (
              <div className="alert alert-info">
                <span>
                  No new discoveries found. Try a different playlist or larger seed count.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.recommendations.map((rec, i) => (
                  <DiscoveryCard key={i} rec={rec} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
