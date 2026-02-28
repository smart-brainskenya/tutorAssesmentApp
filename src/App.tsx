import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute, PublicRoute, AuthLoading } from './components/AuthGuards';
import { Layout } from './components/layout/Layout';
import { lazy, Suspense } from 'react';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const TutorDashboard = lazy(() => import('./pages/tutor/Dashboard'));
const AssessmentPage = lazy(() => import('./pages/tutor/AssessmentPage'));
const TutorResults = lazy(() => import('./pages/tutor/Results'));
const AdminDashboard = lazy(() => import('./pages/admin/Analytics'));
const AdminManage = lazy(() => import('./pages/admin/Manage'));
const AdminTutors = lazy(() => import('./pages/admin/Tutors'));
const ReviewQueue = lazy(() => import('./pages/admin/ReviewQueue'));
const AdminCategoryDetail = lazy(() => import('./pages/admin/AdminCategoryDetail'));
const AdminSectionDetail = lazy(() => import('./pages/admin/AdminSectionDetail'));

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
              <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              
              {/* Tutor Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole="tutor">
                  <AuthenticatedLayout><TutorDashboard /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/assessments/:id" element={
                <ProtectedRoute requiredRole="tutor">
                  <AuthenticatedLayout><AssessmentPage /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/results" element={
                <ProtectedRoute requiredRole="tutor">
                  <AuthenticatedLayout><TutorResults /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/manage" element={
                <ProtectedRoute requiredRole="admin">
                  <AuthenticatedLayout><AdminManage /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/category/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <AuthenticatedLayout><AdminCategoryDetail /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/section/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <AuthenticatedLayout><AdminSectionDetail /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tutors" element={
                <ProtectedRoute requiredRole="admin">
                  <AuthenticatedLayout><AdminTutors /></AuthenticatedLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/review" element={
                <ProtectedRoute requiredRole="admin">
                  <AuthenticatedLayout><ReviewQueue /></AuthenticatedLayout>
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
