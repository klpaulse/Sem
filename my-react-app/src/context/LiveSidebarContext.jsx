import { createContext, useContext, useState } from "react";

const LiveSidebarContext = createContext(null);

export function LiveSidebarProvider({ children }) {
  const [pinned, setPinned] = useState(null);

  function pin(match) {
    setPinned(match);
  }

  function unpin() {
    setPinned(null);
  }

  return (
    <LiveSidebarContext.Provider value={{ pinned, pin, unpin }}>
      {children}
    </LiveSidebarContext.Provider>
  );
}

export function useLiveSidebar() {
  return useContext(LiveSidebarContext);
}
