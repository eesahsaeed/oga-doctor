import { useState } from 'react';
import { apiClient } from '../../lib/api';

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hi, I am Alex, your ChatGPT health assistant. Share your symptoms and I will guide your next steps.',
  },
];

export default function AIConsultationPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const payload = await apiClient.healthChat(
        nextMessages.map((msg) => ({ role: msg.role, content: msg.content })),
      );

      if (payload?.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content:
              payload.reply || 'I could not generate a response right now.',
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: 'assistant',
          content:
            error.message ||
            'I could not reach the AI service right now. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">AI Consultation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chat with ChatGPT health guidance powered by your backend integration.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="max-h-[55vh] overflow-y-auto space-y-3 p-1">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={isUser ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={[
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6',
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-100 text-slate-800 rounded-tl-sm',
                  ].join(' ')}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-sm text-slate-600">
                Alex is typing...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="mt-3 flex gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={2}
            placeholder="Describe your symptoms..."
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="self-end rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Send
          </button>
        </form>

        <p className="mt-2 text-xs text-slate-500">
          AI guidance only. For emergencies, seek urgent in-person care
          immediately.
        </p>
      </section>
    </div>
  );
}
