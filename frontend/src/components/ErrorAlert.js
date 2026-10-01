export default function ErrorAlert({ error, onDismiss }) {
  if (!error) return null;
  const message = typeof error === "string" ? error : error.message || "Something went wrong";
  return (
    <div role="alert" className="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="btn btn-ghost btn-sm">
          Dismiss
        </button>
      )}
    </div>
  );
}
