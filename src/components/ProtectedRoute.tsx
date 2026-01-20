import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Allow guest access with ?guest=true for external tools like ChatGPT
  const isGuestMode = searchParams.get('guest') === 'true';

  if (loading && !isGuestMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access if user is authenticated OR guest mode is enabled
  if (!user && !isGuestMode) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
