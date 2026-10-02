import { useState } from "react";
import { useRecommendations } from "../hooks/useRecommendations";
import FileUpload from "../components/FileUpload";
import RecommendationCard from "../components/RecommendationCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function Recommendations() {
  const mutation = useRecommendations();
  const [minScore, setMinScore] = useState(0.5);

  const handleUpload = (file) => mutation.mutate({ file, minScore, perTrack: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="text-base-content/60">
          Find tracks in your playlist that sound similar to each other, based on audio features.
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
        buttonLabel="Get recommendations"
      />

      {mutation.isPending && <LoadingSpinner label="Generating recommendations…" />}
      {mutation.error && <ErrorAlert error={mutation.error} />}

      {mutation.data && (
        <div className="space-y-4">
          <p className="text-sm text-base-content/60">
            {mutation.data.recommendationCount} recommendations from {mutation.data.trackCount}{" "}
            tracks
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mutation.data.recommendations.map((r, i) => (
              <RecommendationCard key={i} rec={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
