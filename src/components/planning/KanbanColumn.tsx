import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import type { PlanningItem } from "./KanbanBoard";

export function KanbanColumn({
  id,
  title,
  items,
  onCardClick,
  color,
}: {
  id: string;
  title: string;
  items: PlanningItem[];
  onCardClick: (item: PlanningItem) => void;
  color?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`kanban-column ${isOver ? "kanban-column-over" : ""}`}
    >
      <div className="flex items-center justify-between px-1 mb-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {color && (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface-3)] px-2 py-0.5 rounded-full font-mono">
          {items.length}
        </span>
      </div>

      <div ref={setNodeRef} className="space-y-2 min-h-[60px]">
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} onClick={() => onCardClick(item)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
