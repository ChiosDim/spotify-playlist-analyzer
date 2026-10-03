import { useRef, useState } from "react";
import { useAnalyze } from "../hooks/useAnalyze";
import { useSpotifyAnalyze } from "../hooks/useSpotifyAnalyze";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "../components/FileUpload";
import PlaylistPicker from "../components/PlaylistPicker";
import GenreChart from "../components/GenreChart";
import AudioFeatureChart from "../components/AudioFeatureChart";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function Analyze() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState(isAuthenticated ? "spotify" : "csv");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const csvMutation = useAnalyze();
  const spotifyMutation = useSpotifyAnalyze();

  const result = tab === "csv" ? csvMutation.data : spotifyMutation.data;
  const error = tab === "csv" ? csvMutation.error : spotifyMutation.error;
  const isPending = tab === "csv" ? csvMutation.isPending : spotifyMutation.isPending;

  // This ref points at the section containing the spinner + results
  const outputRef = useRef(null);

  const scrollToOutput = () => {
    // Wait one frame so the spinner is in the DOM before we measure
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
    csvMutation.mutate(file);
    scrollToOutput();
  };

  const handleSpotify = (playlist) => {
    spotifyMutation.reset();
    setSelectedPlaylist(playlist);
    spotifyMutation.mutate({ playlistId: playlist.id, include: "all" });
    scrollToOutput();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analyze a playlist</h1>

      <div role="tablist" className="tabs tabs-boxed w-fit">
        <button
          role="tab"
          type="button"
          className={`tab ${tab === "csv" ? "tab-active" : ""}`}
          onClick={() => setTab("csv")}
        >
          Upload CSV
        </button>
        <button
          role="tab"
          type="button"
          className={`tab ${tab === "spotify" ? "tab-active" : ""}`}
          onClick={() => setTab("spotify")}
          disabled={!isAuthenticated}
        >
          Spotify Playlist
        </button>
      </div>

      {tab === "csv" && <FileUpload onUpload={handleCSV} disabled={isPending} />}

      {tab === "spotify" && isAuthenticated && (
        <>
          {!result && !isPending && (
            <p className="text-sm text-base-content/60">
              Select a playlist below to start the analysis.
            </p>
          )}
          <PlaylistPicker onSelect={handleSpotify} disabled={isPending} />
        </>
      )}

      {/* Everything below is the "output" — spinner, errors, results */}
      <div ref={outputRef}>
        {isPending && (
          <LoadingSpinner
            label={selectedPlaylist ? `Analyzing "${selectedPlaylist.name}"…` : "Analyzing…"}
          />
        )}

        {error && <ErrorAlert error={error} />}

        {result && (
          <div className="space-y-6">
            <div className="stats shadow w-full">
              <div className="stat">
                <div className="stat-title">Tracks</div>
                <div className="stat-value text-primary">{result.trackCount}</div>
              </div>
              {result.featuresEnriched !== undefined && (
                <div className="stat">
                  <div className="stat-title">Features Enriched</div>
                  <div className="stat-value">{result.featuresEnriched}</div>
                  <div className="stat-desc">{result.featuresMissing} missing</div>
                </div>
              )}
            </div>

            {result.topGenres?.length > 0 && (
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title">Top genres</h2>
                  <GenreChart topGenres={result.topGenres} />
                </div>
              </div>
            )}

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Audio features (mean)</h2>
                <AudioFeatureChart audioFeatures={result.audioFeatures} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
