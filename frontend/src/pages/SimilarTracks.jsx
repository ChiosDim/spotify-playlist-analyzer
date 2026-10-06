import { useState } from "react";
import { useSimilarTracks } from "../hooks/useSimilarTracks";
import FileUpload from "../components/FileUpload";
import SimilarTrackCard from "../components/SimilarTrackCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function SimilarTracks() {
  const mutation = useSimilarTracks();
  const [minScore, setMinScore] = useState(0.5);

  const handleUpload = (file) => mutation.mutate({ file, minScore, perTrack: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Similar Tracks</h1>
        <p className="text-base-content/60">
          Discover which tracks in this playlist sound most alike, based on their audio features.
        </p>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <label className="form-control">
            <span className="label-text mb-2">
              Minimum similarity score: <strong>{minScore.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="range range-primary range-sm"
            />
          </label>
        </div>
      </div>

      <FileUpload
        onUpload={handleUpload}
        disabled={mutation.isPending}
        buttonLabel="Find Similar Tracks"
      />

      {mutation.isPending && <LoadingSpinner label="Comparing tracks…" />}
      {mutation.error && <ErrorAlert error={mutation.error} />}

      {mutation.data && (
        <div className="space-y-4">
          <p className="text-sm text-base-content/60">
            {mutation.data.similarTrackCount} similar track pairs found in{" "}
            {mutation.data.trackCount} tracks
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mutation.data.similarTracks.map((pair, i) => (
              <SimilarTrackCard key={i} pair={pair} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
