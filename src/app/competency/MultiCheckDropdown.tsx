import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export type MultiCheckItem = {
  id: string;
  label: string;
  /** Secondary line under the label. */
  description?: string;
  /** Small grey tag under the label, e.g. "Also in: Communication". */
  note?: string;
};

/**
 * Shared multi-select with checkboxes, used wherever several items are picked
 * (skills on Create Competency, competencies in Role Mapping) so both look and work the same.
 */
export function MultiCheckDropdown({
  items,
  selectedIds,
  onToggle,
  placeholder,
  noun,
  nounPlural = noun + "s",
  ariaLabel,
  showChips = true,
}: {
  items: MultiCheckItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  placeholder: string;
  /** Singular noun for the summary, e.g. "skill" → "2 skills selected". */
  noun: string;
  nounPlural?: string;
  ariaLabel: string;
  showChips?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const term = search.trim().toLowerCase();
  const filtered = items.filter((i) => !term || i.label.toLowerCase().includes(term));
  const summary =
    selectedIds.length === 0
      ? placeholder
      : selectedIds.length === 1
        ? items.find((i) => i.id === selectedIds[0])?.label ?? `1 ${noun} selected`
        : `${selectedIds.length} ${nounPlural} selected`;

  return (
    <div className="cm-mcd" ref={rootRef}>
      <button
        type="button"
        className={"cm-mcd-trigger" + (open ? " open" : "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selectedIds.length ? "" : "cm-mcd-placeholder"}>{summary}</span>
        <ChevronDown size={16} className={"cm-mcd-caret" + (open ? " open" : "")} />
      </button>

      {open && (
        <div className="cm-mcd-panel">
          <div className="cm-mcd-search">
            <Search size={14} />
            <input
              ref={searchRef}
              type="text"
              placeholder={`Search ${nounPlural}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="cm-mcd-options" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 ? (
              <div className="cm-mcd-empty">No {nounPlural} match your search.</div>
            ) : (
              filtered.map((i) => {
                const checked = selectedIds.includes(i.id);
                return (
                  <label key={i.id} className={"cm-mcd-option" + (checked ? " checked" : "")} role="option" aria-selected={checked}>
                    <input type="checkbox" checked={checked} onChange={() => onToggle(i.id)} />
                    <span>
                      <strong>{i.label}</strong>
                      {i.description && <small>{i.description}</small>}
                      {i.note && <em className="cm-also-in">{i.note}</em>}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <div className="cm-mcd-footer">
            <span>{selectedIds.length} selected</span>
            <button type="button" className="cm-button primary" onClick={() => { setOpen(false); setSearch(""); }}>
              Done
            </button>
          </div>
        </div>
      )}

      {showChips && selectedIds.length > 0 && (
        <div className="cm-mcd-chips">
          {selectedIds.map((id) => {
            const item = items.find((i) => i.id === id);
            return item ? (
              <span key={id} className="cm-mcd-chip">
                {item.label}
                <button type="button" aria-label={`Remove ${item.label}`} onClick={() => onToggle(id)}>
                  <X size={12} />
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
