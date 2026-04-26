import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FixedPlugin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (location.pathname.startsWith('/app/consultation/chat')) {
    return null;
  }

  const target = isAuthenticated ? '/app/consultation/chat' : '/auth/signin';

  return (
    <button
      type="button"
      onClick={() => navigate(target)}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
    >
      Talk to Alex
    </button>
  );
}
