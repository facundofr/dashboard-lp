import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const StatusPage = lazy(() => import("./pages/StatusPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  const protectedElement = user
    ? (user.approved === false ? <PendingApproval /> : <Suspense fallback={null}><Dashboard /></Suspense>)
    : <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/status/:slug" element={
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <StatusPage />
        </Suspense>
      } />
      <Route path="/dashboard/*" element={protectedElement} />
      <Route path="/*" element={protectedElement} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
}