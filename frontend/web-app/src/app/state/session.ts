import { useSyncExternalStore } from "react";
import { getSessionUser, subscribeSessionUser, type SessionUser } from "../utils/sessionUser";

export function useSessionUser(): SessionUser | null {
  return useSyncExternalStore(subscribeSessionUser, getSessionUser, () => null);
}

