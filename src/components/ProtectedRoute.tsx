import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const guestModeEnabled = import.meta.env.VITE_ENABLE_GUEST_MODE === 'true';
  const isGuestMode = guestModeEnabled && searchParams.get('guest') === 'true';

  if (loading && !isGuestMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
