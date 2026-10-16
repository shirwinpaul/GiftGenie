"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Accessible modal built on the native <dialog> element
 * (focus trapping, Escape to close and backdrop are handled by the browser).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (e.target === ref.current) onClose();
      }}
      className={`card m-auto w-[calc(100%-1.5rem)] ${wide ? "max-w-2xl" : "max-w-lg"} p-0 text-slate-800 backdrop:bg-royal-950/60 backdrop:backdrop-blur-sm dark:text-slate-100`}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-xl font-semibold text-royal-800 dark:text-royal-100">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="btn-ghost -mr-2 -mt-1 px-3" aria-label="Close">
              ✕
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
