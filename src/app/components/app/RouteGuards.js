import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isOnboardingDone } from '../../lib/session';

function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-slate-700 shadow-sm">
        Loading your care workspace...
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/auth/signin" replace state={{ from: location.pathname }} />
    );
  }

  return children;
}

export function OnboardingRequiredRoute({ children }) {
  const { user } = useAuth();

  if (!isOnboardingDone(user)) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
