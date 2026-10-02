export default function DuplicateGroupCard({ group, index }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-base">Group #{index + 1}</h3>
          <span className="badge badge-warning badge-sm">{group.reason}</span>
        </div>
        <ul className="divide-y divide-base-300">
          {group.tracks.map((t, i) => (
            <li key={i} className="py-2 flex flex-col">
              <span className="font-medium text-sm">{t.name}</span>
              <span className="text-xs text-base-content/60">{t.artists}</span>
              {t.uri && <span className="text-[11px] text-base-content/40 font-mono">{t.uri}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
