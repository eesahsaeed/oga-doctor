import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlexAssistantChat from './AlexAssistantChat';

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M7.5 7.5h9" />
      <path d="M7.5 11.5h6.5" />
      <path d="M12 20.5h-5a4.5 4.5 0 0 1-4.5-4.5V8A4.5 4.5 0 0 1 7 3.5h10A4.5 4.5 0 0 1 21.5 8v8a4.5 4.5 0 0 1-4.5 4.5h-1.5l-3.5 2v-2Z" />
    </svg>
  );
}

export default function FixedPlugin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);

  const onChatPage = location.pathname.startsWith('/app/consultation/chat');
  const onAuthPage = location.pathname.startsWith('/auth/');

  if (onChatPage || onAuthPage) {
    return null;
  }

  const openFullPage = () => {
    navigate(isAuthenticated ? '/app/consultation/chat' : '/auth/signin');
  };

  const toggleModal = () => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={[
          'mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
          open ? 'block' : 'hidden',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-600 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Alex Health AI</p>
            <p className="text-xs text-blue-100">Secure assistant chat</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
        <div className="bg-slate-50 p-3">
          <AlexAssistantChat
            compact
            showDisclaimer={false}
            placeholder="Type your health question..."
          />
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={openFullPage}
              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              Open full chat
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleModal}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        title={open ? 'Hide Alex chat' : 'Open Alex chat'}
        aria-label={open ? 'Hide Alex chat' : 'Open Alex chat'}
      >
        <ChatIcon />
      </button>
    </div>
  );
}
