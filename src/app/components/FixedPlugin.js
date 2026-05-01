import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import AishaAssistantChat from './AishaAssistantChat';

function ChatIcon() {
  return <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />;
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
    <>
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Aisha chat backdrop"
          className="fixed inset-0 z-40 h-dvh min-h-dvh w-screen bg-slate-900/20 backdrop-blur-[1px]"
        />
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <div
          className={[
            'mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
            open ? 'block' : 'hidden',
          ].join(' ')}
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-blue-600 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/image/aisha.png"
                alt="Aisha AI assistant"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  Aisha Health AI
                </p>
                <p className="text-xs text-blue-100">Secure assistant chat</p>
              </div>
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
            <AishaAssistantChat
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
          title={open ? 'Hide Aisha chat' : 'Open Aisha chat'}
          aria-label={open ? 'Hide Aisha chat' : 'Open Aisha chat'}
        >
          <ChatIcon />
        </button>
      </div>
    </>
  );
}
