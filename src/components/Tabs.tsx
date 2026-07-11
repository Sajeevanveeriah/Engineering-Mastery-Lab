import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from "react";

interface TabsProps {
  tabs: { id: string; label: string; content: ReactNode }[];
  initial?: string;
  ariaLabel?: string;
}

const TabPanelActivity = createContext(true);

/** True when this component is inside the currently visible panel of every parent tab set. */
export function useTabPanelActive(): boolean {
  return useContext(TabPanelActivity);
}

export function Tabs({ tabs, initial, ariaLabel = "Sections" }: TabsProps) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  const parentActive = useTabPanelActive();
  const groupId = useId().replace(/:/g, "");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (!current) return null;

  const activateAt = (index: number) => {
    const next = tabs[index];
    if (!next) return;
    setActive(next.id);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
    } else {
      return;
    }

    if (event.key === "Home") return activateAt(0);
    if (event.key === "End") return activateAt(tabs.length - 1);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    activateAt((index + direction + tabs.length) % tabs.length);
  };

  return (
    <div className="tab-group">
      <div className="tabs" role="tablist" aria-label={ariaLabel}>
        {tabs.map((t, index) => {
          const selected = t.id === current.id;
          const tabId = `${groupId}-tab-${t.id}`;
          const panelId = `${groupId}-panel-${t.id}`;
          return (
          <button
            key={t.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={tabId}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {t.label}
          </button>
          );
        })}
      </div>
      {tabs.map((tab) => {
        const selected = tab.id === current.id;
        return (
          <div
            key={tab.id}
            id={`${groupId}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${groupId}-tab-${tab.id}`}
            tabIndex={0}
            hidden={!selected}
            className="tab-panel"
          >
            <TabPanelActivity.Provider value={parentActive && selected}>
              {tab.content}
            </TabPanelActivity.Provider>
          </div>
        );
      })}
    </div>
  );
}
