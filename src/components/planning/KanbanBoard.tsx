"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { CardDetail } from "./CardDetail";
import { ViewModeSwitcher, type ViewMode } from "./ViewModeSwitcher";
import { PlanningFilters } from "./PlanningFilters";

export interface PlanningItem {
  id: string;
  title: string;
  description: string | null;
  dept: string;
  owner: string;
  month: string;
  phase: string;
  status: "not_started" | "in_progress" | "blocked" | "done";
  position: number;
  issueUrl: string | null;
  blockedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const COLUMN_DEFS: Record<ViewMode, { values: string[]; labels: Record<string, string>; field: keyof PlanningItem; colors?: Record<string, string> }> = {
  month: {
    values: ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"],
    labels: {
      "2026-03": "Mar", "2026-04": "Apr", "2026-05": "May", "2026-06": "Jun",
      "2026-07": "Jul", "2026-08": "Aug", "2026-09": "Sep", "2026-10": "Oct",
      "2026-11": "Nov", "2026-12": "Dec",
    },
    field: "month",
  },
  status: {
    values: ["not_started", "in_progress", "blocked", "done"],
    labels: { not_started: "Not Started", in_progress: "In Progress", blocked: "Blocked", done: "Done" },
    field: "status",
    colors: { not_started: "#64748b", in_progress: "#60a5fa", blocked: "#f87171", done: "#34d399" },
  },
  dept: {
    values: ["ENG", "LEG", "PRD", "OPS", "GRO", "FIN", "CXS", "B2B"],
    labels: { ENG: "Engineering", LEG: "Legal", PRD: "Product", OPS: "Operations", GRO: "Growth", FIN: "Finance", CXS: "Customer Success", B2B: "Enterprise" },
    field: "dept",
    colors: { ENG: "#60a5fa", LEG: "#fbbf24", PRD: "#f472b6", OPS: "#94a3b8", GRO: "#34d399", FIN: "#a78bfa", CXS: "#818cf8", B2B: "#f87171" },
  },
  phase: {
    values: ["Beta", "Gamma", "Delta", "Omega"],
    labels: { Beta: "Beta (Apr 30)", Gamma: "Gamma (Jun 30)", Delta: "Delta (Sep 30)", Omega: "Omega (Dec 31)" },
    field: "phase",
    colors: { Beta: "#60a5fa", Gamma: "#34d399", Delta: "#fbbf24", Omega: "#f87171" },
  },
};

export function KanbanBoard() {
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [filterDept, setFilterDept] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterPhase, setFilterPhase] = useState("");
  const [selectedItem, setSelectedItem] = useState<PlanningItem | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch items
  useEffect(() => {
    fetch("/api/planning")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Apply filters
  const filteredItems = useMemo(() => {
    let result = items;
    if (filterDept) result = result.filter((i) => i.dept === filterDept);
    if (filterOwner) result = result.filter((i) => i.owner === filterOwner);
    if (filterPhase) result = result.filter((i) => i.phase === filterPhase);
    return result;
  }, [items, filterDept, filterOwner, filterPhase]);

  // Group items by current view mode columns
  const columnDef = COLUMN_DEFS[viewMode];
  const columns = useMemo(() => {
    const grouped: Record<string, PlanningItem[]> = {};
    for (const val of columnDef.values) {
      grouped[val] = [];
    }
    for (const item of filteredItems) {
      const key = item[columnDef.field] as string;
      if (grouped[key]) {
        grouped[key].push(item);
      }
    }
    // Sort each column by position
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [filteredItems, columnDef]);

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeItemData = items.find((i) => i.id === active.id);
    if (!activeItemData) return;

    // Determine which column was dropped into
    let targetColumn: string | null = null;

    // Check if dropped over a column directly
    if (columnDef.values.includes(over.id as string)) {
      targetColumn = over.id as string;
    } else {
      // Dropped over another card — find that card's column
      const overItem = items.find((i) => i.id === over.id);
      if (overItem) {
        targetColumn = overItem[columnDef.field] as string;
      }
    }

    if (!targetColumn) return;

    const currentColumn = activeItemData[columnDef.field] as string;
    const columnChanged = currentColumn !== targetColumn;

    // Update local state optimistically
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === active.id && columnChanged) {
          return { ...item, [columnDef.field]: targetColumn } as PlanningItem;
        }
        return item;
      });
      return updated;
    });

    // Persist to API
    if (columnChanged) {
      const fieldMap: Record<string, string> = {
        month: "month",
        status: "status",
        dept: "dept",
        phase: "phase",
      };
      const apiField = fieldMap[columnDef.field as string];

      await fetch(`/api/planning/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [apiField]: targetColumn }),
      });
    }
  }

  const handleCardUpdate = useCallback(async (id: string, updates: Partial<PlanningItem>) => {
    const resp = await fetch(`/api/planning/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (resp.ok) {
      const updated = await resp.json();
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
      setSelectedItem(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="planning-board flex items-center justify-center h-[60vh]">
        <div className="text-[var(--color-text-muted)] text-sm">Loading planning board...</div>
      </div>
    );
  }

  return (
    <div className="planning-board">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Planning Board</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {filteredItems.length} items across {columnDef.values.length} columns
          </p>
        </div>
        <ViewModeSwitcher active={viewMode} onChange={setViewMode} />
      </div>

      <div className="mb-4">
        <PlanningFilters
          dept={filterDept}
          owner={filterOwner}
          phase={filterPhase}
          onDeptChange={setFilterDept}
          onOwnerChange={setFilterOwner}
          onPhaseChange={setFilterPhase}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns-container">
          {columnDef.values.map((val) => (
            <KanbanColumn
              key={val}
              id={val}
              title={columnDef.labels[val] || val}
              items={columns[val] || []}
              onCardClick={setSelectedItem}
              color={columnDef.colors?.[val]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="kanban-card kanban-card-dragging">
              <p className="text-xs text-[var(--color-text)] line-clamp-2">{activeItem.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedItem && (
        <CardDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleCardUpdate}
        />
      )}
    </div>
  );
}
