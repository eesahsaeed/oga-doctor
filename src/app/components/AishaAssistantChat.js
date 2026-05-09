import { useMemo } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import {
  AuiIf,
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_WELCOME_MESSAGE =
  'Hi, I am Aisha, your Gemini health assistant. Share your symptoms and I will guide your next steps.';

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
    <MessagePrimitive.Root className="mb-3 flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-blue-600 px-3 py-2 text-sm leading-6 text-white shadow-sm">
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
    <MessagePrimitive.If hasContent>
      <MessagePrimitive.Root className="mb-3 flex justify-end">
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
    </MessagePrimitive.If>
  );
}

function ThinkingIndicator({ label = 'Thinking' }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="inline-flex gap-1" aria-label={label} role="status">
        <span className="oga-thinking-dot" style={{ animationDelay: '0ms' }} />
        <span
          className="oga-thinking-dot"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="oga-thinking-dot"
          style={{ animationDelay: '300ms' }}
        />
      </span>

      <style>
        {`
          .oga-thinking-dot {
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            background: rgba(107, 114, 128, 1);
            animation: ogaBounceDots 900ms infinite ease-in-out;
          }
          @keyframes ogaBounceDots {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 0.5;
            }
            40% {
              transform: translateY(-5px);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

function handleComposerInput(event) {
  const element = event.currentTarget;
  if (!element) {
    return;
  }

  element.style.height = '40px';
  element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
}

export default function AishaAssistantChat({
  compact = false,
  placeholder,
  welcomeMessage,
  showDisclaimer = true,
  className = '',
}) {
  const { tr } = useLanguage();
  const resolvedPlaceholder = placeholder || tr('Describe your symptoms...');
  const resolvedWelcomeMessage = welcomeMessage || tr(DEFAULT_WELCOME_MESSAGE);

  const chatModelAdapter = useMemo(
    () => ({
      async run({ messages, abortSignal }) {
        const payloadMessages = toBackendMessages(messages);
        if (payloadMessages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: tr('Please type a question so I can help you.'),
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
                tr(
                  'I could not generate a response right now. Please try again.',
                ),
            },
          ],
        };
      },
    }),
    [tr],
  );

  const runtime = useLocalRuntime(chatModelAdapter, {
    initialMessages: [
      {
        role: 'assistant',
        content: [{ type: 'text', text: resolvedWelcomeMessage }],
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
                {tr('Ask Aisha a health question to get started.')}
              </div>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage: UserMessageBubble,
                AssistantMessage: AssistantMessageBubble,
              }}
            />

            <AuiIf condition={(state) => state.thread.isRunning}>
              <div className="flex justify-end">
                <ThinkingIndicator label={tr('Thinking')} />
              </div>
            </AuiIf>
          </ThreadPrimitive.Viewport>

          <ComposerPrimitive.Root className="mt-2 rounded-xl border border-slate-200 bg-white p-2.5">
            <div className="flex items-end gap-2">
              <ComposerPrimitive.Input
                rows={1}
                placeholder={resolvedPlaceholder}
                onInput={handleComposerInput}
                style={{ fieldSizing: 'content' }}
                className="max-h-40 min-h-10 h-10 flex-1 max-w-full resize-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                submitMode="enter"
              />
              <ComposerPrimitive.Send
                aria-label={tr('Send')}
                title={tr('Send')}
                render={
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_10px_24px_-14px_rgba(15,23,42,0.85)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none sm:w-auto sm:min-w-[96px] sm:gap-2 sm:rounded-xl sm:px-4"
                    style={{
                      border: '1px solid #0f172a',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      opacity: 1,
                      WebkitTextFillColor: '#ffffff',
                    }}
                  />
                }
              >
                <PaperAirplaneIcon
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                  style={{
                    color: 'inherit',
                    fill: 'currentColor',
                    opacity: 1,
                    display: 'block',
                    transform: 'rotate(-45deg)',
                  }}
                />
                <span
                  className="hidden text-sm font-semibold tracking-tight sm:inline"
                  style={{ color: 'inherit' }}
                >
                  {tr('Send')}
                </span>
                <span className="sr-only">{tr('Send')}</span>
              </ComposerPrimitive.Send>
            </div>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>

        {showDisclaimer && (
          <p className="mt-2 text-xs text-slate-500">
            {tr(
              'AI guidance only. For emergencies, seek urgent in-person care immediately.',
            )}
          </p>
        )}
      </div>
    </AssistantRuntimeProvider>
  );
}
