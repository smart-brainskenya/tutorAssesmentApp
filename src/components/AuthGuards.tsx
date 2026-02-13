import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

/**
 * Universal Loading Spinner
 */
export function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse text-sm">Securing your connection...</p>
      </div>
    </div>
  );
}

/**
 * Base Guard - Requires Authentication
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!user) {
    console.warn('[ProtectedRoute] Unauthorized access attempt to:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Admin Only Guard
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <AuthLoading />;

  if (!user) return <Navigate to="/login" replace />;

  if (profile && profile.role !== 'admin') {
    console.error('[AdminRoute] Role mismatch. Expected admin, got:', profile.role);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * Tutor Only Guard
 */
export function TutorRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <AuthLoading />;

  if (!user) return <Navigate to="/login" replace />;

  if (profile && profile.role !== 'tutor') {
    console.error('[TutorRoute] Role mismatch. Expected tutor, got:', profile.role);
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
