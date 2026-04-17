"use client";

import { useState } from "react";
import type { PreviewFile } from "@/lib/api";

export function PreviewPanel({
  files,
  loading,
  error,
}: {
  files: PreviewFile[];
  loading?: boolean;
  error?: string | null;
}) {
  const [active, setActive] = useState(0);

  if (error) {
    return (
      <div className="p-4 bg-[var(--surface)] border border-red-900 rounded text-sm text-red-300 font-mono whitespace-pre-wrap">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--text-dim)]">
        Rendering…
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded text-sm text-[var(--text-dim)]">
        Fill in the form and click <strong>Preview</strong> to see the generated files.
      </div>
    );
  }

  const current = files[Math.min(active, files.length - 1)];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
      <div className="flex overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-2)]">
        {files.map((f, i) => (
          <button
            key={f.path}
            onClick={() => setActive(i)}
            className={`px-3 py-2 text-xs font-mono whitespace-nowrap border-r border-[var(--border)] ${
              i === active
                ? "bg-[var(--surface)] text-[var(--text)]"
                : "text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            {f.path}
          </button>
        ))}
      </div>
      <pre className="p-4 text-xs font-mono overflow-auto max-h-[70vh] whitespace-pre-wrap">
        {current.content}
      </pre>
    </div>
  );
}
