import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TutorDashboard from './pages/tutor/Dashboard';
import AssessmentPage from './pages/tutor/AssessmentPage';
import TutorResults from './pages/tutor/Results';
import AdminDashboard from './pages/admin/Analytics';
import AdminManage from './pages/admin/Manage';
import { Layout } from './components/layout/Layout';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'tutor' }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading secure session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && profile?.role !== role) {
    // If we're looking for a specific role but don't have a profile yet,
    // we should wait or show an error instead of immediately redirecting back to /
    // which could cause a loop if / also redirects here.
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Verifying permissions...</p>
          </div>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  return (
    <Layout userRole={profile?.role} userName={profile?.full_name}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Layout>
  );
}

function HomeRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  // If user is logged in but profile is not found yet
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Finalizing your account setup...</p>
        </div>
      </div>
    );
  }
  
  return profile.role === 'admin' 
    ? <Navigate to="/admin/dashboard" replace /> 
    : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
            },
          }} 
        />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<HomeRedirect />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute role="tutor">
                <TutorDashboard />
              </ProtectedRoute>
            } />

            <Route path="/assessments/:id" element={
              <ProtectedRoute role="tutor">
                <AssessmentPage />
              </ProtectedRoute>
            } />

            <Route path="/results" element={
              <ProtectedRoute role="tutor">
                <TutorResults />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/manage" element={
              <ProtectedRoute role="admin">
                <AdminManage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
