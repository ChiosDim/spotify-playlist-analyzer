export default function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="text-sm text-base-content/60">{label}</p>
    </div>
  );
}
