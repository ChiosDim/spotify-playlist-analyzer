import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAnalyze } from "../hooks/useAnalyze";
import { useSpotifyAnalyze } from "../hooks/useSpotifyAnalyze";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "../components/FileUpload";
import PlaylistPicker from "../components/PlaylistPicker";
import GenreChart from "../components/GenreChart";
import AudioFeatureChart from "../components/AudioFeatureChart";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import { formatNumber } from "../utils/formatters";

export default function Analyze() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(isAuthenticated ? "spotify" : "csv");

  const csvMutation = useAnalyze();
  const spotifyMutation = useSpotifyAnalyze();
  const autoRanFor = useRef(null);

  const playlistFromUrl = params.get("playlist");

  // Auto-analyze when landing with ?playlist=<id> (e.g. from the Dashboard)
  useEffect(() => {
    if (!playlistFromUrl || !isAuthenticated) return;
    if (autoRanFor.current === playlistFromUrl) return; // guard against StrictMode double-fire
    autoRanFor.current = playlistFromUrl;

    setTab("spotify");
    spotifyMutation.mutate({ playlistId: playlistFromUrl, include: "all" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistFromUrl, isAuthenticated]);

  const result = tab === "csv" ? csvMutation.data : spotifyMutation.data;
  const error = tab === "csv" ? csvMutation.error : spotifyMutation.error;
  const isPending = tab === "csv" ? csvMutation.isPending : spotifyMutation.isPending;

  const handleCSV = (file) => csvMutation.mutate(file);
  const handleSpotify = (playlist) => {
    spotifyMutation.mutate({ playlistId: playlist.id, include: "all" });
    setParams({ playlist: playlist.id });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analyze a playlist</h1>

      <div role="tablist" className="tabs tabs-boxed w-fit">
        <button
          role="tab"
          className={`tab ${tab === "csv" ? "tab-active" : ""}`}
          onClick={() => setTab("csv")}
        >
          Upload CSV
        </button>
        <button
          role="tab"
          className={`tab ${tab === "spotify" ? "tab-active" : ""}`}
          onClick={() => setTab("spotify")}
          disabled={!isAuthenticated}
        >
          Spotify Playlist
        </button>
      </div>

      {tab === "csv" && <FileUpload onUpload={handleCSV} disabled={isPending} />}

      {tab === "spotify" && isAuthenticated && (
        <PlaylistPicker onSelect={handleSpotify} disabled={isPending} />
      )}

      {isPending && <LoadingSpinner label="Analyzing…" />}
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

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Full statistics</h2>
              <div className="overflow-x-auto">
                <table className="table table-sm table-zebra">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Mean</th>
                      <th>Median</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Std Dev</th>
                      <th>Valid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.audioFeatures).map(([key, s]) => (
                      <tr key={key}>
                        <td className="font-medium">{key}</td>
                        <td>{formatNumber(s.mean)}</td>
                        <td>{formatNumber(s.median)}</td>
                        <td>{formatNumber(s.min)}</td>
                        <td>{formatNumber(s.max)}</td>
                        <td>{formatNumber(s.stdDev)}</td>
                        <td>
                          {s.valid}/{s.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
