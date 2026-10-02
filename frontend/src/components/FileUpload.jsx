import { useRef, useState } from "react";

export default function FileUpload({
  onUpload,
  accept = ".csv",
  multiple = false,
  maxFiles = 5,
  buttonLabel = "Upload & Analyze",
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setDragging] = useState(false);

  const addFiles = (incoming) => {
    const next = multiple ? [...files, ...incoming].slice(0, maxFiles) : incoming.slice(0, 1);
    setFiles(next);
  };

  const handleInput = (e) => addFiles(Array.from(e.target.files || []));
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  };
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) return;
    onUpload(multiple ? files : files[0]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center w-full min-h-[14rem] border-2 border-dashed rounded-box cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-base-300 bg-base-100 hover:bg-base-200"
        }`}
      >
        <svg
          className="w-10 h-10 mb-3 text-base-content/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16a4 4 0 01-4-4 4 4 0 014-4h10a4 4 0 01-4 4 4 4 0 01-4 4zm0 0h10m-4-4v10m0 0H7"
          />
        </svg>
        <p className="mb-1 text-sm text-base-content/70">
          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-base-content/50">
          CSV file{multiple ? `s (up to ${maxFiles})` : ""} from Exportify
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleInput}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between bg-base-200 rounded-box px-4 py-2"
            >
              <span className="text-sm truncate">{f.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/50">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="btn btn-ghost btn-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={disabled} className="btn btn-primary w-full">
            {buttonLabel}
          </button>
        </div>
      )}
    </form>
  );
}
