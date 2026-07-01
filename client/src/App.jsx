import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";
import StatusPage from "./pages/StatusPage";

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/status/:slug" element={<StatusPage />} />
      <Route path="/dashboard/*" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/*" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}