import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdminRoute, TutorRoute, AuthLoading } from './components/AuthGuards';
import { Layout } from './components/layout/Layout';
import { lazy, Suspense } from 'react';

// Lazy Load Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const TutorDashboard = lazy(() => import('./pages/tutor/Dashboard'));
const AssessmentPage = lazy(() => import('./pages/tutor/AssessmentPage'));
const TutorResults = lazy(() => import('./pages/tutor/Results'));
const AdminDashboard = lazy(() => import('./pages/admin/Analytics'));
const AdminManage = lazy(() => import('./pages/admin/Manage'));
const AdminTutors = lazy(() => import('./pages/admin/Tutors'));

/**
 * Intelligent Redirector for Landing Page
 */
function LandingRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  
  if (profile) {
    return profile.role === 'admin' 
      ? <Navigate to="/admin/dashboard" replace /> 
      : <Navigate to="/dashboard" replace />;
  }

  return <AuthLoading />;
}

/**
 * Wrap protected routes with standard Layout
 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  return (
    <Layout userRole={profile?.role} userName={profile?.full_name}>
      <ErrorBoundary>
        <Suspense fallback={<AuthLoading />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" />
        <Router>
          <Suspense fallback={<AuthLoading />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Landing Logic */}
              <Route path="/" element={<LandingRedirect />} />
              
              {/* Tutor Routes */}
              <Route path="/dashboard" element={
                <TutorRoute>
                  <AuthenticatedLayout><TutorDashboard /></AuthenticatedLayout>
                </TutorRoute>
              } />
              <Route path="/assessments/:id" element={
                <TutorRoute>
                  <AuthenticatedLayout><AssessmentPage /></AuthenticatedLayout>
                </TutorRoute>
              } />
              <Route path="/results" element={
                <TutorRoute>
                  <AuthenticatedLayout><TutorResults /></AuthenticatedLayout>
                </TutorRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout>
                </AdminRoute>
              } />
              <Route path="/admin/manage" element={
                <AdminRoute>
                  <AuthenticatedLayout><AdminManage /></AuthenticatedLayout>
                </AdminRoute>
              } />
              <Route path="/admin/tutors" element={
                <AdminRoute>
                  <AuthenticatedLayout><AdminTutors /></AuthenticatedLayout>
                </AdminRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<LandingRedirect />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
