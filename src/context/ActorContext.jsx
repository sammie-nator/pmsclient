import { createContext, useContext, useEffect, useState } from "react";

const ActorContext = createContext(null);
const STORAGE_KEY = "pms_actor";

export function ActorProvider({ children }) {
  const [actor, setActorState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (actor) localStorage.setItem(STORAGE_KEY, JSON.stringify(actor));
    else localStorage.removeItem(STORAGE_KEY);
  }, [actor]);

  function setActor(next) {
    setActorState(next);
  }

  function signOut() {
    setActorState(null);
  }

  return <ActorContext.Provider value={{ actor, setActor, signOut }}>{children}</ActorContext.Provider>;
}

export function useActor() {
  const ctx = useContext(ActorContext);
  if (!ctx) throw new Error("useActor must be used inside ActorProvider");
  return ctx;
}
