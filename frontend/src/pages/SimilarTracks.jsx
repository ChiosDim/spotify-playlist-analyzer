import { useRef, useState } from "react";
import { useSimilarTracks } from "../hooks/useSimilarTracks";
import { useSpotifySimilarTracks } from "../hooks/useSpotifySimilarTracks";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "../components/FileUpload";
import PlaylistPicker from "../components/PlaylistPicker";
import SimilarTrackCard from "../components/SimilarTrackCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function SimilarTracks() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState(isAuthenticated ? "spotify" : "csv");
  const [minScore, setMinScore] = useState(0.55);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const csvMutation = useSimilarTracks();
  const spotifyMutation = useSpotifySimilarTracks();

  const activeMutation = tab === "spotify" ? spotifyMutation : csvMutation;
  const result = activeMutation.data;
  const error = activeMutation.error;
  const isPending = activeMutation.isPending;

  // Scroll helper — same pattern as Analyze
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
    csvMutation.mutate({ file, minScore, perTrack: 2 });
    scrollToOutput();
  };

  const handleSpotify = (playlist) => {
    spotifyMutation.reset();
    setSelectedPlaylist(playlist);
    spotifyMutation.mutate({ playlistId: playlist.id, minScore, perTrack: 2 });
    scrollToOutput();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Similar Tracks</h1>
        <p className="text-base-content/60">
          Find pairs of tracks within a playlist that sound most alike, based on audio features and
          genre tags.
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
              Minimum similarity: <strong>{minScore.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.01"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="range range-primary range-sm"
            />
            <span className="text-xs text-base-content/50 mt-1">
              Higher values find closer matches but fewer results.
            </span>
          </label>
        </div>
      </div>

      {tab === "csv" && (
        <FileUpload onUpload={handleCSV} disabled={isPending} buttonLabel="Find Similar Tracks" />
      )}

      {tab === "spotify" && isAuthenticated && (
        <>
          {!result && !isPending && (
            <p className="text-sm text-base-content/60">
              Select a playlist below to compare its tracks.
            </p>
          )}
          <PlaylistPicker onSelect={handleSpotify} disabled={isPending} />
        </>
      )}

      <div ref={outputRef}>
        {isPending && (
          <LoadingSpinner
            label={
              selectedPlaylist
                ? `Comparing tracks in "${selectedPlaylist.name}"…`
                : "Comparing tracks…"
            }
          />
        )}

        {error && <ErrorAlert error={error} />}

        {result && (
          <div className="space-y-4">
            <p className="text-sm text-base-content/60">
              {result.pairCount ?? result.similarTrackCount} similar pairs found in{" "}
              {result.trackCount} tracks
            </p>

            {(() => {
              const pairs = result.pairs ?? result.similarTracks ?? [];
              if (pairs.length === 0) {
                return (
                  <div className="alert alert-info">
                    <span>No similar pairs at this threshold. Try lowering the minimum score.</span>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pairs.map((pair, i) => (
                    <SimilarTrackCard key={i} pair={pair} />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
