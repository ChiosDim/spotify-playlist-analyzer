import { formatNumber } from "../utils/formatters";

export default function SimilarTrackCard({ pair }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-base-content/50 mb-1">Source track</p>
            <h3 className="font-semibold truncate">{pair.source.name}</h3>
            <p className="text-sm text-base-content/60 truncate">{pair.source.artists}</p>
          </div>
          <div className="badge badge-primary badge-lg shrink-0">
            {formatNumber(pair.similarityScore, 2)}
          </div>
        </div>

        <div className="flex items-center gap-2 text-base-content/40 text-sm">
          <span className="flex-1 border-t border-dashed border-base-300" />
          <span>similar to</span>
          <span className="flex-1 border-t border-dashed border-base-300" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-base-content/50 mb-1">Match</p>
          <h3 className="font-semibold truncate">{pair.match.name}</h3>
          <p className="text-sm text-base-content/60 truncate">{pair.match.artists}</p>
        </div>

        <p className="text-xs text-base-content/50 pt-2 border-t border-base-300">{pair.reason}</p>
      </div>
    </div>
  );
}
