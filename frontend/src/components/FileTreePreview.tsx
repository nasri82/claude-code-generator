"use client";

import { useMemo, useState } from "react";
import type { PreviewFile } from "@/lib/api";

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  file?: PreviewFile;
};

function buildTree(files: PreviewFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map() };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      if (!node.children.has(name)) {
        node.children.set(name, {
          name,
          path: parts.slice(0, i + 1).join("/"),
          children: new Map(),
        });
      }
      node = node.children.get(name)!;
      if (isLast) node.file = f;
    }
  }
  return root;
}

function sortedChildren(node: TreeNode): TreeNode[] {
  // Dirs first, then files, each alphabetical. Dotfolders first within dirs (Claude convention).
  const dirs: TreeNode[] = [];
  const files: TreeNode[] = [];
  for (const child of node.children.values()) {
    if (child.file) files.push(child);
    else dirs.push(child);
  }
  dirs.sort((a, b) => {
    const aDot = a.name.startsWith(".") ? 0 : 1;
    const bDot = b.name.startsWith(".") ? 0 : 1;
    if (aDot !== bDot) return aDot - bDot;
    return a.name.localeCompare(b.name);
  });
  files.sort((a, b) => a.name.localeCompare(b.name));
  return [...dirs, ...files];
}

function TreeItem({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activePath: string;
  onSelect: (file: PreviewFile) => void;
}) {
  const [open, setOpen] = useState(true);
  const isFile = !!node.file;
  const isActive = node.path === activePath;
  const children = sortedChildren(node);

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          if (isFile && node.file) onSelect(node.file);
          else setOpen((v) => !v);
        }}
        className="w-full text-left flex items-center gap-1.5 py-0.5 px-1.5 rounded-sm text-xs"
        style={{
          paddingLeft: `${depth * 12 + 6}px`,
          fontFamily: "var(--font-mono)",
          color: isActive ? "var(--prussian-bold)" : "var(--ink)",
          background: isActive ? "rgba(30,58,95,0.08)" : "transparent",
          fontWeight: isActive ? 500 : 400,
        }}
      >
        <span
          aria-hidden
          style={{
            color: "var(--ink-faint)",
            width: "0.75rem",
            display: "inline-block",
          }}
        >
          {isFile ? " " : open ? "▾" : "▸"}
        </span>
        <span style={{ color: isFile ? "inherit" : "var(--prussian-soft)" }}>
          {isFile ? "◻" : open ? "▼" : "▶"}
        </span>
        <span>{node.name}</span>
      </button>
      {!isFile && open && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function FileTreePreview({
  files,
  loading,
  error,
}: {
  files: PreviewFile[];
  loading?: boolean;
  error?: string | null;
}) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [active, setActive] = useState<PreviewFile | null>(files[0] ?? null);
  const [copied, setCopied] = useState(false);

  // Keep active selection valid when files change
  const effectiveActive =
    active && files.some((f) => f.path === active.path) ? active : files[0] ?? null;

  async function onCopy() {
    if (!effectiveActive) return;
    const ok = await copyToClipboard(effectiveActive.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  if (error) {
    return (
      <div
        className="plate plate-ticked p-4"
        style={{
          borderColor: "var(--err)",
          color: "var(--err)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="plate plate-ticked p-4"
        style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block w-1 h-3"
            style={{
              background: "var(--prussian)",
              animation: "blink 800ms steps(2) infinite",
            }}
          />
          Rendering scaffold…
        </span>
        <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div
        className="plate plate-ticked p-8 text-center"
        style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}
      >
        <div
          style={{ fontFamily: "var(--font-display)", fontSize: "1rem" }}
          className="mb-2"
        >
          Preview pending
        </div>
        Fill the form and press{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>Preview</span> to render the
        scaffold.
      </div>
    );
  }

  return (
    <div className="plate plate-ticked overflow-hidden flex flex-col" style={{ minHeight: "400px" }}>
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          background: "var(--paper-shadow)",
          borderColor: "var(--rule-hair)",
        }}
      >
        <span
          className="uppercase tracking-wider text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--ink-muted)" }}
        >
          {files.length} file{files.length === 1 ? "" : "s"} · preview
        </span>
        {effectiveActive && (
          <button
            type="button"
            onClick={onCopy}
            className="btn-ghost text-xs"
            style={{ padding: "0.25rem 0.625rem" }}
          >
            {copied ? "copied ✓" : "copy"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 flex-1 min-h-0">
        <aside
          className="col-span-2 border-r overflow-auto py-2"
          style={{
            borderColor: "var(--rule-hair)",
            background: "var(--paper)",
          }}
        >
          <ul>
            {sortedChildren(tree).map((node) => (
              <TreeItem
                key={node.path}
                node={node}
                depth={0}
                activePath={effectiveActive?.path ?? ""}
                onSelect={setActive}
              />
            ))}
          </ul>
        </aside>

        <div className="col-span-3 overflow-auto">
          {effectiveActive && (
            <>
              <div
                className="px-3 py-1.5 border-b text-xs"
                style={{
                  borderColor: "var(--rule-hair)",
                  color: "var(--ink-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {effectiveActive.path}
              </div>
              <pre
                className="p-3 text-xs whitespace-pre-wrap"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--ink)",
                  lineHeight: 1.5,
                  maxHeight: "65vh",
                }}
              >
                {effectiveActive.content}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
