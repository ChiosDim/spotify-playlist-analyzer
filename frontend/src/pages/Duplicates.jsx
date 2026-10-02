import { useDuplicates } from "../hooks/useDuplicates";
import FileUpload from "../components/FileUpload";
import DuplicateGroupCard from "../components/DuplicateGroupCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";

export default function Duplicates() {
  const mutation = useDuplicates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find duplicates</h1>
        <p className="text-base-content/60">
          Upload a CSV and we&#39;ll group tracks that appear more than once.
        </p>
      </div>

      <FileUpload onUpload={mutation.mutate} disabled={mutation.isPending} />

      {mutation.isPending && <LoadingSpinner label="Scanning for duplicates…" />}
      {mutation.error && <ErrorAlert error={mutation.error} />}

      {mutation.data && (
        <div className="space-y-4">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Tracks</div>
              <div className="stat-value">{mutation.data.trackCount}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Duplicate groups</div>
              <div className="stat-value text-primary">{mutation.data.totalDuplicateGroups}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Duplicate tracks</div>
              <div className="stat-value">{mutation.data.totalDuplicateTracks}</div>
            </div>
          </div>

          {mutation.data.duplicateGroups.length === 0 ? (
            <div className="alert alert-success">
              <span>No duplicates found. Your playlist is clean!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mutation.data.duplicateGroups.map((g, i) => (
                <DuplicateGroupCard key={i} group={g} index={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
