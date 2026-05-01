import { useMemo } from 'react';
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react';
import { apiClient } from '../lib/api';

const DEFAULT_WELCOME_MESSAGE =
  'Hi, I am Alex, your Gemini health assistant. Share your symptoms and I will guide your next steps.';

function extractTextFromContent(content = []) {
  return content
    .filter(
      (part) =>
        (part?.type === 'text' || part?.type === 'reasoning') &&
        typeof part?.text === 'string',
    )
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function toBackendMessages(messages = []) {
  return messages
    .map((message) => ({
      role: message?.role,
      content: extractTextFromContent(message?.content),
    }))
    .filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        message.content,
    );
}

function UserMessageBubble() {
  return (
    <MessagePrimitive.Root className="mb-3 flex justify-end">
      <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-blue-600 px-3 py-2 text-sm leading-6 text-white shadow-sm">
        <MessagePrimitive.Parts>
          {({ part }) =>
            part.type === 'text' || part.type === 'reasoning' ? (
              <MessagePartPrimitive.Text smooth />
            ) : null
          }
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessageBubble() {
  return (
    <MessagePrimitive.Root className="mb-3 flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-100 px-3 py-2 text-sm leading-6 text-slate-800 shadow-sm">
        <MessagePrimitive.Parts>
          {({ part }) =>
            part.type === 'text' || part.type === 'reasoning' ? (
              <MessagePartPrimitive.Text smooth />
            ) : null
          }
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  );
}

export default function AlexAssistantChat({
  compact = false,
  placeholder = 'Describe your symptoms...',
  welcomeMessage = DEFAULT_WELCOME_MESSAGE,
  showDisclaimer = true,
  className = '',
}) {
  const chatModelAdapter = useMemo(
    () => ({
      async run({ messages, abortSignal }) {
        const payloadMessages = toBackendMessages(messages);
        if (payloadMessages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'Please type a question so I can help you.',
              },
            ],
          };
        }

        const payload = await apiClient.healthChat(payloadMessages, {
          signal: abortSignal,
        });

        return {
          content: [
            {
              type: 'text',
              text:
                payload?.reply ||
                'I could not generate a response right now. Please try again.',
            },
          ],
        };
      },
    }),
    [],
  );

  const runtime = useLocalRuntime(chatModelAdapter, {
    initialMessages: [
      {
        role: 'assistant',
        content: [{ type: 'text', text: welcomeMessage }],
      },
    ],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={['flex h-full flex-col', className].join(' ').trim()}>
        <ThreadPrimitive.Root className="flex h-full flex-col">
          <ThreadPrimitive.Viewport
            className={[
              'overflow-y-auto p-2',
              compact ? 'max-h-80' : 'max-h-[55vh]',
            ].join(' ')}
          >
            <ThreadPrimitive.Empty>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Ask Alex a health question to get started.
              </div>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage: UserMessageBubble,
                AssistantMessage: AssistantMessageBubble,
              }}
            />
          </ThreadPrimitive.Viewport>

          <ComposerPrimitive.Root className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
            <ComposerPrimitive.Input
              rows={compact ? 2 : 3}
              placeholder={placeholder}
              className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none"
              submitMode="enter"
            />
            <div className="mt-2 flex items-center justify-end">
              <ComposerPrimitive.Send className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                Send
              </ComposerPrimitive.Send>
            </div>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>

        {showDisclaimer && (
          <p className="mt-2 text-xs text-slate-500">
            AI guidance only. For emergencies, seek urgent in-person care
            immediately.
          </p>
        )}
      </div>
    </AssistantRuntimeProvider>
  );
}
