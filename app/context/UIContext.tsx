/**
 * UIContext — global sheet-open state.
 *
 * Any bottom sheet that opens calls setSheetOpen(true).
 * FloatingNavBar reads sheetOpen and fades to invisible.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UIContextValue {
  sheetOpen:    boolean;
  setSheetOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextValue>({
  sheetOpen:    false,
  setSheetOpen: () => {},
});

export function UIProvider({ children }: { children: ReactNode }) {
  const [sheetOpen, setSheetOpenRaw] = useState(false);

  const setSheetOpen = useCallback((open: boolean) => {
    setSheetOpenRaw(open);
  }, []);

  return (
    <UIContext.Provider value={{ sheetOpen, setSheetOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
