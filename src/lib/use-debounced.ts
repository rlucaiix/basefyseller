import { useEffect, useRef } from "react";

/** Debounce edits, but persist the final pending value before leaving the page. */
export function useDebounced(fn: () => void, deps: unknown[], delay = 700) {
  const first = useRef(true);
  const fnRef = useRef(fn);
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  fnRef.current = fn;
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    pending.current = true;
    timer.current = setTimeout(() => {
      pending.current = false;
      fnRef.current();
    }, delay);
    return () => clearTimeout(timer.current);
    // Dependencies describe the edited fields, not the callback's identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => () => {
    clearTimeout(timer.current);
    if (pending.current) {
      pending.current = false;
      fnRef.current();
    }
  }, []);
}