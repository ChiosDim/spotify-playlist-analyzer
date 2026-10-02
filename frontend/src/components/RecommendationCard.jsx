import { formatNumber } from "../utils/formatters";

export default function RecommendationCard({ rec }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{rec.track.name}</h3>
            <p className="text-sm text-base-content/60 truncate">{rec.track.artists}</p>
          </div>
          <div className="badge badge-primary badge-lg shrink-0">
            {formatNumber(rec.similarityScore, 2)}
          </div>
        </div>
        <p className="text-xs text-base-content/50 mt-2">{rec.reason}</p>
      </div>
    </div>
  );
}
