import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState
} from "react";

export interface MobileLessonOutlineItem {
  id: string;
  label: string;
}

interface MobileLessonOutlineProps {
  items: readonly MobileLessonOutlineItem[];
  requirements: {
    knowledgeChecksPassed: boolean;
    practiceCompleted: boolean;
    appliedEvidenceSatisfied: boolean;
  };
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function MobileLessonOutline({
  items,
  requirements
}: MobileLessonOutlineProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const priorOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    const firstControl = panel?.querySelector<HTMLElement>(focusableSelector);
    firstControl?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const controls = [...panel.querySelectorAll<HTMLElement>(focusableSelector)]
        .filter((control) => !control.hasAttribute("disabled"));
      if (controls.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = priorOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [close, open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="btn secondary academy-lesson-mobile-outline-trigger"
        type="button"
        aria-expanded={open}
        aria-controls={`${headingId}-drawer`}
        onClick={() => setOpen(true)}
      >
        Open lesson outline and completion gates
      </button>
      {open && (
        <div
          className="academy-lesson-drawer-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            id={`${headingId}-drawer`}
            className="academy-lesson-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            tabIndex={-1}
          >
            <header>
              <div>
                <p className="eyebrow">Lesson navigation</p>
                <h2 id={headingId}>Outline and completion gates</h2>
              </div>
              <button className="btn secondary" type="button" onClick={close}>
                Close outline
              </button>
            </header>
            <nav aria-label="Mobile lesson outline">
              <ol>
                {items.map((item, index) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} onClick={close}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="academy-lesson-outline__gates">
              <strong>Completion gates</strong>
              <span>
                {requirements.knowledgeChecksPassed ? "Complete" : "Open"}: knowledge checks
              </span>
              <span>
                {requirements.practiceCompleted ? "Complete" : "Open"}: lesson practice
              </span>
              <span>
                {requirements.appliedEvidenceSatisfied ? "Complete" : "Open"}: applied evidence
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
