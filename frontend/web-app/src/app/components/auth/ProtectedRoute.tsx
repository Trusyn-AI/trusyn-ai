import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { authService } from "../../api/services/authService";
import { ApiError } from "../../api/errors";
import { getAccessToken } from "../../api/auth";
import { setSessionUser } from "../../utils/sessionUser";
import { useSessionUser } from "../../state/session";

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map(part => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProtectedRoute() {
  const [hydrating, setHydrating] = useState(true);
  const sessionUser = useSessionUser();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function hydrate(): Promise<void> {
      const token = getAccessToken();
      if (!token) {
        if (!cancelled) setHydrating(false);
        return;
      }

      if (sessionUser) {
        if (!cancelled) setHydrating(false);
        return;
      }

      try {
        const me = await authService.me();
        const user = me.user;
        setSessionUser({
          id: user.id,
          organizationId: user.organization_id,
          name: user.full_name,
          role: user.role,
          email: user.email,
          initials: initialsFromName(user.full_name),
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          authService.logout();
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  if (hydrating) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: "#F8F5FF" }}>
        <div className="flex items-center gap-3 text-sm" style={{ color: "#6B6B82" }}>
          <span
            className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#8B3CF7", borderTopColor: "transparent" }}
          />
          Loading secure workspace...
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const sessionUser = useSessionUser();
  if (sessionUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

