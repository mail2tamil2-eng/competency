import { ChevronRight } from "lucide-react";

/** The one expand/collapse arrow used across the app: points right when closed, down when open. */
export function DisclosureIcon({ open }: { open: boolean }) {
  return <ChevronRight size={18} aria-hidden="true" className={"cm-disclosure" + (open ? " open" : "")} />;
}
