import { useEffect, useRef, type ReactNode } from "react";

interface FocusDialogProps {
  backdropClassName: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  describedBy?: string;
  dialogClassName: string;
  label?: string;
  labelledBy?: string;
  onClose: () => void;
}

const focusableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const dialogStack: symbol[] = [];
let bodyScrollLockCount = 0;
let bodyOverflowBeforeLock = "";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
    if (element.closest("[hidden], [inert], [aria-hidden='true']")) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

function lockBodyScroll(): void {
  if (bodyScrollLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyScrollLockCount += 1;
}

function unlockBodyScroll(): void {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = bodyOverflowBeforeLock;
  }
}

export function FocusDialog({
  backdropClassName,
  children,
  closeOnBackdrop = false,
  describedBy,
  dialogClassName,
  label,
  labelledBy,
  onClose
}: FocusDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const dialogId = Symbol("focus-dialog");
    const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogStack.push(dialogId);
    lockBodyScroll();

    const focusFirstElement = () => {
      const initialFocus = dialog.querySelector<HTMLElement>("[data-dialog-initial-focus]");
      const target = initialFocus ?? getFocusableElements(dialog)[0] ?? dialog;
      target.focus({ preventScroll: true });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack.at(-1) !== dialogId) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      const activeIndex = activeElement instanceof HTMLElement ? focusable.indexOf(activeElement) : -1;
      if (event.shiftKey && activeIndex <= 0) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (activeIndex === -1 || activeElement === last)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (dialogStack.at(-1) !== dialogId || dialog.contains(event.target as Node)) return;
      focusFirstElement();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn, true);
    focusFirstElement();

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      const stackIndex = dialogStack.lastIndexOf(dialogId);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      unlockBodyScroll();
      if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div
      className={backdropClassName}
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onCloseRef.current();
      }}
    >
      <section
        ref={dialogRef}
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}
