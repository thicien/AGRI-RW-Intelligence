import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/** One navigation behavior for planner, district, data, and system workspaces. */
export function useWorkspaceNavigation(
  open: boolean,
  setOpen: (open: boolean) => void,
) {
  const { pathname } = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const [desktop, setDesktop] = useState(
    () => window.matchMedia("(min-width: 1280px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const update = () => {
      setDesktop(query.matches);
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [setOpen]);
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);
  useEffect(() => {
    if (!open || desktop) return;
    const previous = document.activeElement as HTMLElement | null;
    const sidebar = sidebarRef.current;
    const focusable = () =>
      Array.from(
        sidebar?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
        ) || [],
      ).filter((el) => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, desktop, setOpen]);
  return { sidebarRef, desktop };
}
