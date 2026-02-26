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
        <p className="text-slate-500 font-medium animate-pulse text-sm">One Momment✍️</p>
      </div>
    </div>
  );
}

/**
 * Combined Guard - Requires Authentication and optional Role
 */
export function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: ReactNode; 
  requiredRole?: 'admin' | 'tutor';
}) {
  const { status, profile } = useAuth();
  const location = useLocation();

  if (status === 'INITIALIZING') {
    return <AuthLoading />;
  }

  if (status === 'UNAUTHENTICATED') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile && profile.role !== requiredRole) {
    const dest = profile.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
}

/**
 * Public Only Guard (Login/Register)
 * Redirects to dashboard if already authenticated
 */
export function PublicRoute({ children }: { children: ReactNode }) {
  const { status, profile } = useAuth();

  if (status === 'INITIALIZING') {
    return <AuthLoading />;
  }

  if (status === 'AUTHENTICATED' && profile) {
    const dest = profile.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
}

// Legacy Aliases for compatibility during migration
export const AdminRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

export const TutorRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="tutor">{children}</ProtectedRoute>
);
