import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCompare } from "../hooks/useCompare";
import FileUpload from "../components/FileUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

const schema = z.object({}).optional();

export default function Compare() {
  const mutation = useCompare();
  // Form intentionally minimal — we just use RHF to demonstrate the pattern
  useForm({ resolver: zodResolver(schema) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compare playlists</h1>
        <p className="text-base-content/60">
          Upload 2 to 5 CSVs. We&#39;ll show you which tracks are shared and which are unique to each
          playlist.
        </p>
      </div>

      <FileUpload
        onUpload={mutation.mutate}
        multiple
        maxFiles={5}
        buttonLabel="Compare playlists"
        disabled={mutation.isPending}
      />

      {mutation.isPending && <LoadingSpinner label="Comparing playlists…" />}
      {mutation.error && <ErrorAlert error={mutation.error} />}

      {mutation.data && (
        <div className="space-y-6">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Playlists</div>
              <div className="stat-value">{mutation.data.playlists.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Common tracks</div>
              <div className="stat-value text-primary">{mutation.data.commonTracks.length}</div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Common tracks ({mutation.data.commonTracks.length})</h2>
              <ul className="divide-y divide-base-300">
                {mutation.data.commonTracks.map((t, i) => (
                  <li key={i} className="py-2">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-base-content/60">{t.artists}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mutation.data.uniqueTracksPerPlaylist.map((tracks, i) => (
              <div key={i} className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h2 className="card-title text-base">
                    Unique to {mutation.data.playlistNames[i]} ({tracks.length})
                  </h2>
                  <ul className="divide-y divide-base-300 max-h-72 overflow-y-auto">
                    {tracks.slice(0, 50).map((t, j) => (
                      <li key={j} className="py-1">
                        <p className="text-sm truncate">{t.name}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
