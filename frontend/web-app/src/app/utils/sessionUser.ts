export type SessionUser = {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  email: string;
  initials: string;
};

const STORAGE_KEY = "trusyn_session_user";
const CHANGE_EVENT = "trusyn:session-user-changed";

function emitSessionChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function isValidSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.organizationId === "string" &&
    typeof item.name === "string" &&
    typeof item.role === "string" &&
    typeof item.email === "string" &&
    typeof item.initials === "string"
  );
}

export function getSessionUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidSessionUser(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  emitSessionChange();
}

export function clearSessionUser(): void {
  localStorage.removeItem(STORAGE_KEY);
  emitSessionChange();
}

export function subscribeSessionUser(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const storageHandler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", storageHandler);
  window.addEventListener(CHANGE_EVENT, listener as EventListener);

  return () => {
    window.removeEventListener("storage", storageHandler);
    window.removeEventListener(CHANGE_EVENT, listener as EventListener);
  };
}
