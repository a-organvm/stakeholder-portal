import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

const STATUS_DOTS: Record<string, string> = {
  not_started: "#64748b",
  in_progress: "#60a5fa",
  blocked: "#f87171",
  done: "#34d399",
};

export function KanbanCard({
  item,
  onClick,
}: {
  item: PlanningItem;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const deptColor = DEPT_COLORS[item.dept] || "#94a3b8";
  const statusColor = STATUS_DOTS[item.status] || "#64748b";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="kanban-card"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: deptColor + "22", color: deptColor }}
        >
          {item.dept}
        </span>
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: statusColor }}
          title={item.status.replace("_", " ")}
        />
      </div>
      <p className="text-xs leading-snug text-[var(--color-text)] line-clamp-3 mb-1.5">
        {item.title}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
          {item.owner}
        </span>
        {item.blockedBy && (
          <span className="text-[10px] text-[var(--color-error)] truncate max-w-[100px]" title={item.blockedBy}>
            blocked
          </span>
        )}
      </div>
    </div>
  );
}
