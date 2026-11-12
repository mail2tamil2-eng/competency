import { useState, type DragEvent, type KeyboardEvent } from "react";
import { GripVertical } from "lucide-react";

/**
 * Shared drag-to-reorder for lists of cards (skills on Create Competency,
 * competencies in Role Mapping). Drag by the grip handle, or focus the handle
 * and use the Up/Down arrow keys.
 */
export function useDragReorder(ids: string[], onReorder: (next: string[]) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function move(id: string, to: number) {
    const from = ids.indexOf(id);
    if (from < 0 || to < 0 || to >= ids.length || from === to) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, id);
    onReorder(next);
  }

  /** Props for the card that can be dropped on. */
  const itemProps = (id: string) => ({
    onDragOver: (e: DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      if (overId !== id) setOverId(id);
    },
    onDrop: (e: DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      move(dragId, ids.indexOf(id));
      setDragId(null);
      setOverId(null);
    },
    "data-dragging": dragId === id ? "true" : undefined,
    "data-drop-target": dragId && overId === id && dragId !== id ? "true" : undefined,
  });

  /** Props for the grip handle inside the card. */
  const handleProps = (id: string, label: string) => ({
    draggable: true,
    "aria-label": `Reorder ${label}. Use the up and down arrow keys to move it.`,
    title: "Drag to change the order",
    onDragStart: (e: DragEvent<HTMLElement>) => {
      setDragId(id);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      // Show the whole card while dragging, not just the handle.
      const card = e.currentTarget.closest("[data-reorder-item]");
      if (card) e.dataTransfer.setDragImage(card, 24, 24);
    },
    onDragEnd: () => {
      setDragId(null);
      setOverId(null);
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      e.stopPropagation();
      move(id, ids.indexOf(id) + (e.key === "ArrowUp" ? -1 : 1));
    },
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  });

  return { itemProps, handleProps };
}

export function DragHandle(props: ReturnType<ReturnType<typeof useDragReorder>["handleProps"]>) {
  return (
    <button type="button" className="cm-drag-handle" {...props}>
      <GripVertical size={18} aria-hidden="true" />
    </button>
  );
}
