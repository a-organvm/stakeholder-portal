"use client";

import { useState } from "react";
import type { PlanningItem } from "./KanbanBoard";

const DEPT_COLORS: Record<string, string> = {
  ENG: "#60a5fa",
  LEG: "#fbbf24",
  PRD: "#f472b6",
  OPS: "#94a3b8",
  GRO: "#34d399",
  FIN: "#a78bfa",
  CXS: "#818cf8",
  B2B: "#f87171",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export function CardDetail({
  item,
  onClose,
  onUpdate,
}: {
  item: PlanningItem;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PlanningItem>) => void;
}) {
  const [notes, setNotes] = useState(item.notes || "");
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);

  const deptColor = DEPT_COLORS[item.dept] || "#94a3b8";

  async function handleSave() {
    setSaving(true);
    await onUpdate(item.id, { notes, status });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-lg mx-4 p-6 rounded-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: deptColor + "22", color: deptColor }}
            >
              {item.dept}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{item.id}</span>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white text-lg leading-none">
            &times;
          </button>
        </div>

        <h2 className="text-sm font-semibold text-white leading-snug">{item.title}</h2>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[var(--color-text-muted)] block mb-0.5">Owner</span>
            <span className="font-mono text-[var(--color-text)]">{item.owner}</span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block mb-0.5">Month</span>
            <span className="text-[var(--color-text)]">{item.month}</span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block mb-0.5">Phase</span>
            <span className="text-[var(--color-text)]">{item.phase}</span>
          </div>
          {item.blockedBy && (
            <div>
              <span className="text-[var(--color-text-muted)] block mb-0.5">Blocked By</span>
              <span className="text-[var(--color-error)] text-[11px]">{item.blockedBy}</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-[var(--color-text-muted)] text-xs block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PlanningItem["status"])}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)]"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[var(--color-text-muted)] text-xs block mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)] resize-none focus:border-[var(--color-border-focus)] focus:outline-none"
          />
        </div>

        {item.issueUrl && (
          <a
            href={item.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-accent-bright)] hover:underline"
          >
            View Issue &rarr;
          </a>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[var(--color-accent)] hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
