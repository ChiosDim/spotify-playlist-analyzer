import { formatNumber } from "../utils/formatters";

export default function DiscoveryCard({ rec }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{rec.name}</h3>
            <p className="text-sm text-base-content/60 truncate">{rec.artist}</p>
          </div>
          <div className="badge badge-primary badge-lg shrink-0">{formatNumber(rec.match, 2)}</div>
        </div>

        <p className="text-xs text-base-content/50">
          because you have <strong>{rec.seedName}</strong> by {rec.seedArtist}
        </p>

        {rec.url && (
          <a href={rec.url} target="_blank" rel="noreferrer" className="link link-primary text-xs">
            Open on Last.fm ↗
          </a>
        )}
      </div>
    </div>
  );
}
