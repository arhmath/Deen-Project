import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ApiError } from "../../services/api";
import { tokenStore } from "../../services/tokenStore";
import type { Role } from "../../types/user";
import { ErrorState, PermissionDenied } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useMe } from "./useAuth";

/**
 * Route guard. Izin dibaca dari server/session (useMe), bukan sekadar
 * menyembunyikan menu (Frontend Architecture §4). Backend tetap memvalidasi.
 */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const location = useLocation();
  const me = useMe();

  if (!tokenStore.get()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (me.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-cream" aria-busy="true">
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    );
  }
  if (me.isError) {
    if (me.error instanceof ApiError && me.error.status === 401) {
      tokenStore.clear();
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState onRetry={() => me.refetch()} />
      </div>
    );
  }
  if (roles && !roles.includes(me.data.role)) return <PermissionDenied />;
  return <Outlet />;
}
