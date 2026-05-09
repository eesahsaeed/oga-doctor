import { useEffect, useRef, useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { getStoredToken } from '../../lib/session';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { isDoctorUser } from '../../lib/account';
import {
  getDoctorChatDisplayText,
  translateDoctorChatText,
} from '../../lib/doctorChatTranslation';

function formatTimestamp(value, formatter) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return formatter(date);
}

function sortChats(chats = []) {
  return [...chats].sort((left, right) =>
    String(right.lastMessageAt || '').localeCompare(
      String(left.lastMessageAt || ''),
    ),
  );
}

function upsertChat(chats = [], nextChat) {
  const remaining = chats.filter((chat) => chat.id !== nextChat.id);
  return sortChats([nextChat, ...remaining]);
}

function buildOptimisticChatMessage({
  message,
  senderType,
  senderName,
  senderLanguage,
}) {
  return {
    id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderType,
    senderName,
    senderLanguage,
    message,
    createdAt: new Date().toISOString(),
    readBy: [senderType],
    optimistic: true,
  };
}

function handleComposerInput(event) {
  const element = event.currentTarget;
  if (!element) {
    return;
  }

  element.style.height = '40px';
  element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  element.style.overflowY = element.scrollHeight > 160 ? 'auto' : 'hidden';
}

function ThreeDotsTypingIndicator({
  label = 'Typing',
  className = '',
  dotColor = '#6b7280',
  compact = false,
}) {
  const dotSize = compact ? 6 : 8;
  const bounceHeight = compact ? 4 : 6;

  return (
    <div
      className={`flex items-center gap-2 px-0 py-0 align-middle ${className}`}
    >
      <span className="sr-only">{label}</span>

      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="oga-typing-dot"
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              background: dotColor,
              animationDelay: `${index * 0.15}s`,
              ['--oga-typing-bounce-y']: `-${bounceHeight}px`,
            }}
          />
        ))}
      </div>

      <style>
        {`
          .oga-typing-dot {
            border-radius: 9999px;
            animation: ogaTypingBounce 1s infinite ease-in-out;
          }
          @keyframes ogaTypingBounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 0.6;
            }
            40% {
              transform: translateY(var(--oga-typing-bounce-y, -6px));
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

export default function DoctorMessagesPage() {
  const { user } = useAuth();
  const { tr, formatDateTime, language } = useLanguage();
  const endRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const draftInputRef = useRef(null);
  const previousChatIdRef = useRef('');
  const previousLastMessageIdRef = useRef('');
  const latestTypingChatIdRef = useRef('');
  const typingActiveRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChatId = searchParams.get('chatId') || '';
  const isDoctor = isDoctorUser(user);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [translatedTextMap, setTranslatedTextMap] = useState({});
  const viewerType = isDoctor ? 'doctor' : 'patient';

  const getTypingIndicatorText = (typingIndicator) => {
    if (!typingIndicator) {
      return '';
    }

    return tr(
      typingIndicator.senderType === 'doctor'
        ? 'Doctor is typing...'
        : 'Patient is typing...',
    );
  };

  useEffect(() => {
    let active = true;

    async function loadChats({ initial = false } = {}) {
      if (initial) {
        setLoadingList(true);
        setError('');
      }

      try {
        const payload = await apiClient.doctorChats();
        if (!active) return;

        const nextChats = sortChats(payload?.chats || []);
        setChats(nextChats);

        if (!selectedChatId && nextChats[0]?.id) {
          setSearchParams({ chatId: nextChats[0].id }, { replace: true });
        }
      } catch (loadError) {
        if (active && initial) {
          setError(
            loadError.message || tr('Unable to load doctor conversations.'),
          );
        }
      } finally {
        if (active && initial) {
          setLoadingList(false);
        }
      }
    }

    void loadChats({ initial: true });

    return () => {
      active = false;
    };
  }, [selectedChatId, setSearchParams, tr]);

  useEffect(() => {
    if (!selectedChatId) {
      setSelectedChat(null);
      return;
    }

    let active = true;

    async function loadChat({ initial = false } = {}) {
      if (initial) {
        setLoadingChat(true);
        setError('');
      }

      try {
        const payload = await apiClient.doctorChat(selectedChatId);
        if (!active) return;

        setSelectedChat(payload?.chat || null);
        if (payload?.chat) {
          setChats((current) => upsertChat(current, payload.chat));
        }
      } catch (loadError) {
        if (active && initial) {
          setError(loadError.message || tr('Unable to load this doctor chat.'));
        }
      } finally {
        if (active && initial) {
          setLoadingChat(false);
        }
      }
    }

    void loadChat({ initial: true });

    return () => {
      active = false;
    };
  }, [selectedChatId, tr]);

  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) {
      return;
    }

    const messages = Array.isArray(selectedChat?.messages)
      ? selectedChat.messages
      : [];
    const lastMessageId = messages[messages.length - 1]?.id || '';
    const chatChanged = previousChatIdRef.current !== selectedChatId;
    const messageChanged = previousLastMessageIdRef.current !== lastMessageId;

    if (chatChanged) {
      container.scrollTop = container.scrollHeight;
    } else if (messageChanged && lastMessageId) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    previousChatIdRef.current = selectedChatId;
    previousLastMessageIdRef.current = lastMessageId;
  }, [selectedChatId, selectedChat?.messages]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return undefined;
    }

    const token = getStoredToken();
    if (!token) {
      return undefined;
    }

    const stream = new EventSource(apiClient.doctorChatsStreamUrl(token));

    const handleChatUpdate = (event) => {
      try {
        const payload = JSON.parse(String(event?.data || '{}'));
        const nextChat = payload?.chat;
        if (!nextChat?.id) {
          return;
        }

        setChats((current) => upsertChat(current, nextChat));
        if (nextChat.id === selectedChatId) {
          setSelectedChat(nextChat);
        }
      } catch (_error) {
        // Ignore malformed stream payloads.
      }
    };

    stream.addEventListener('doctor-chat', handleChatUpdate);

    return () => {
      stream.removeEventListener('doctor-chat', handleChatUpdate);
      stream.close();
    };
  }, [selectedChatId]);

  useEffect(() => {
    const uniqueMessages = new Map();

    (chats || []).forEach((chat) => {
      if (chat?.lastMessage?.id) {
        uniqueMessages.set(chat.lastMessage.id, chat.lastMessage);
      }
    });

    (selectedChat?.messages || []).forEach((message) => {
      if (message?.id) {
        uniqueMessages.set(message.id, message);
      }
    });

    if (uniqueMessages.size === 0) {
      setTranslatedTextMap({});
      return;
    }

    let active = true;

    async function translateMessages() {
      const translatedEntries = await Promise.all(
        [...uniqueMessages.values()].map(async (message) => [
          message.id,
          await translateDoctorChatText({
            text: message.message,
            fromLanguage: message.senderLanguage,
            toLanguage: language,
          }),
        ]),
      );

      if (!active) {
        return;
      }

      setTranslatedTextMap(Object.fromEntries(translatedEntries));
    }

    translateMessages();

    return () => {
      active = false;
    };
  }, [chats, language, selectedChat?.messages]);

  const selectedDoctor = selectedChat?.doctor || null;
  const selectedPatient = selectedChat?.patient || null;
  const selectedParty = isDoctor ? selectedPatient : selectedDoctor;
  const hasChats = chats.length > 0;
  const canSendMessage = Boolean(selectedChat?.id && draft.trim() && !sending);
  const typingIndicator = selectedChat?.typingIndicator || null;
  const typingIndicatorText =
    typingIndicator && typingIndicator.senderType !== viewerType
      ? getTypingIndicatorText(typingIndicator)
      : '';

  useEffect(() => {
    const chatId = selectedChat?.id;
    const draftValue = draft.trim();

    async function updateTyping(targetChatId, isTyping) {
      try {
        const payload = await apiClient.setDoctorChatTyping(targetChatId, {
          isTyping,
        });

        if (!payload?.chat) {
          return;
        }

        if (payload.chat.id === selectedChatId) {
          setSelectedChat(payload.chat);
        }
        setChats((current) => upsertChat(current, payload.chat));
      } catch (_error) {
        // Non-blocking presence hint. Ignore failures silently.
      }
    }

    if (!chatId) {
      if (latestTypingChatIdRef.current && typingActiveRef.current) {
        void apiClient
          .setDoctorChatTyping(latestTypingChatIdRef.current, {
            isTyping: false,
          })
          .catch(() => {});
      }

      latestTypingChatIdRef.current = '';
      typingActiveRef.current = false;
      return;
    }

    if (
      latestTypingChatIdRef.current &&
      latestTypingChatIdRef.current !== chatId &&
      typingActiveRef.current
    ) {
      void apiClient
        .setDoctorChatTyping(latestTypingChatIdRef.current, {
          isTyping: false,
        })
        .catch(() => {});
      typingActiveRef.current = false;
      latestTypingChatIdRef.current = '';
    }

    if (draftValue && !sending) {
      latestTypingChatIdRef.current = chatId;
      if (!typingActiveRef.current) {
        typingActiveRef.current = true;
        void updateTyping(chatId, true);
      }
      return;
    }

    if (typingActiveRef.current && latestTypingChatIdRef.current === chatId) {
      typingActiveRef.current = false;
      void updateTyping(chatId, false);
    }
  }, [draft, selectedChat?.id, sending]);

  useEffect(
    () => () => {
      if (latestTypingChatIdRef.current && typingActiveRef.current) {
        void apiClient
          .setDoctorChatTyping(latestTypingChatIdRef.current, {
            isTyping: false,
          })
          .catch(() => {});
      }
    },
    [],
  );

  useEffect(() => {
    const element = draftInputRef.current;
    if (!element) {
      return;
    }

    element.style.height = '40px';
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
    element.style.overflowY = element.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [draft]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const message = draft.trim();
    if (!selectedChat?.id || !message || sending) {
      return;
    }

    const optimisticMessage = buildOptimisticChatMessage({
      message,
      senderType: viewerType,
      senderName: user?.name || tr(isDoctor ? 'Doctor' : 'Patient'),
      senderLanguage: language,
    });
    const previousChatSnapshot = selectedChat;
    const optimisticChat = {
      ...selectedChat,
      messages: [...(selectedChat.messages || []), optimisticMessage],
      lastMessage: optimisticMessage,
      lastMessageAt: optimisticMessage.createdAt,
      typingIndicator: null,
    };

    setSending(true);
    setError('');
    setDraft('');
    setSelectedChat(optimisticChat);
    setChats((current) => upsertChat(current, optimisticChat));

    try {
      const payload = await apiClient.sendDoctorChatMessage(selectedChat.id, {
        message,
      });

      if (payload?.chat) {
        setSelectedChat(payload.chat);
        setChats((current) => upsertChat(current, payload.chat));
      }
    } catch (sendError) {
      setSelectedChat(previousChatSnapshot);
      setChats((current) => upsertChat(current, previousChatSnapshot));
      setDraft(message);
      setError(sendError.message || tr('Unable to send message right now.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid h-[calc(100dvh-6.5rem)] min-h-0 grid-rows-[minmax(240px,0.85fr)_minmax(0,1.15fr)] gap-4 overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)] xl:grid-rows-1 xl:items-stretch">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {tr(isDoctor ? 'Patient Messages' : 'Doctor Messages')}
            </h1>
            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              {tr(
                isDoctor
                  ? 'Review and reply to patient conversations from one inbox.'
                  : 'Continue direct conversations with your doctors and specialists.',
              )}
            </p>
          </div>
          {!isDoctor && (
            <Link
              to="/app/consultation/doctors"
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {tr('Find Doctors')}
            </Link>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-1">
          {loadingList && (
            <p className="text-sm text-slate-500">
              {tr('Loading conversations...')}
            </p>
          )}

          {!loadingList && !hasChats && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              {tr(
                isDoctor
                  ? 'No patient chats yet. Once patients start direct consultations, they will appear here.'
                  : 'No doctor chats yet. Start with a general doctor or choose a specialist.',
              )}
              {!isDoctor && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/app/consultation/doctors"
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {tr('Consult a Doctor')}
                  </Link>
                  <Link
                    to="/app/consultation/doctors?kind=specialist"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {tr('Consult a Specialist')}
                  </Link>
                </div>
              )}
            </div>
          )}

          {chats.map((chat) => {
            const isSelected = chat.id === selectedChatId;
            const party = isDoctor ? chat.patient : chat.doctor;
            const partyAvatar =
              party?.avatar || chat.doctor?.avatar || '/image/ogaDoctor.png';
            const previewText = chat?.typingIndicator
              ? getTypingIndicatorText(chat.typingIndicator)
              : getDoctorChatDisplayText(chat.lastMessage, translatedTextMap) ||
                tr('Open this chat to continue.');
            const unreadCount = Number(chat?.unreadCount || 0);
            const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() =>
                  setSearchParams({ chatId: chat.id }, { replace: false })
                }
                className={[
                  'w-full rounded-2xl border p-3 text-left transition-colors',
                  isSelected
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={partyAvatar}
                    alt={party?.name || tr(isDoctor ? 'Patient' : 'Doctor')}
                    className="h-10 w-10 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {party?.name || tr(isDoctor ? 'Patient' : 'Doctor')}
                          </p>
                          {unreadCount > 0 ? (
                            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                              {unreadLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className="shrink-0 text-[11px] font-medium text-slate-500">
                        {formatTimestamp(chat.lastMessageAt, formatDateTime)}
                      </p>
                    </div>
                    {chat?.typingIndicator ? (
                      <div className="mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate text-sm text-blue-600">
                        <ThreeDotsTypingIndicator
                          label={previewText}
                          dotColor="#3b82f6"
                          compact
                        />
                        <span className="truncate">{previewText}</span>
                      </div>
                    ) : (
                      <p className="mt-0.5 truncate text-sm text-slate-600">
                        {previewText}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!selectedChatId && !hasChats && (
          <div className="flex h-full min-h-0 items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <h2 className="text-xl font-semibold text-slate-900">
                {tr(
                  isDoctor
                    ? 'Your patient inbox will appear here'
                    : 'Start your first doctor conversation',
                )}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {tr(
                  isDoctor
                    ? 'As patients open direct chats, you will be able to continue the thread from this workspace.'
                    : 'Choose a doctor or specialist and your message thread will be ready here.',
                )}
              </p>
            </div>
          </div>
        )}

        {selectedChatId && (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-white/95 px-4 py-2.5 backdrop-blur">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedParty?.avatar ||
                    selectedDoctor?.avatar ||
                    '/image/ogaDoctor.png'
                  }
                  alt={
                    selectedParty?.name || tr(isDoctor ? 'Patient' : 'Doctor')
                  }
                  className="h-9 w-9 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    {selectedParty?.name ||
                      tr(
                        isDoctor
                          ? 'Patient Conversation'
                          : 'Doctor Conversation',
                      )}
                  </h2>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">
                      {tr(
                        isDoctor
                          ? selectedChat?.subject || 'Direct conversation'
                          : selectedDoctor?.title ||
                              selectedDoctor?.specialty ||
                              selectedChat?.subject ||
                              'Direct conversation',
                      )}
                    </span>
                    {typingIndicatorText ? (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600">
                          <ThreeDotsTypingIndicator
                            label={typingIndicatorText}
                            dotColor="#3b82f6"
                            compact
                          />
                          <span>{typingIndicatorText}</span>
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={messagesScrollRef}
              className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain bg-slate-50/45 px-4 py-3"
            >
              {loadingChat && (
                <p className="text-sm text-slate-500">
                  {tr('Loading conversation...')}
                </p>
              )}

              {!loadingChat &&
                (selectedChat?.messages || []).map((message) => {
                  const isLocal = isDoctor
                    ? message.senderType === 'doctor'
                    : message.senderType === 'patient';

                  return (
                    <div
                      key={message.id}
                      className={[
                        'max-w-2xl rounded-2xl px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
                        isLocal
                          ? 'bg-blue-50/85 text-slate-800 ring-1 ring-blue-100'
                          : 'ml-auto bg-white/88 text-slate-800 ring-1 ring-slate-200/70',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {isLocal
                            ? tr('You')
                            : message.senderName ||
                              tr(isDoctor ? 'Patient' : 'Doctor')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTimestamp(message.createdAt, formatDateTime)}
                        </p>
                      </div>
                      <p className="mt-1.5 text-sm leading-5 text-slate-700">
                        {getDoctorChatDisplayText(message, translatedTextMap)}
                      </p>
                    </div>
                  );
                })}
              {typingIndicatorText ? (
                <div className="ml-auto max-w-fit rounded-2xl bg-white/88 px-3 py-2 text-sm font-medium text-slate-500 ring-1 ring-slate-200/70">
                  <div className="flex items-center gap-2">
                    <ThreeDotsTypingIndicator
                      label={typingIndicatorText}
                      dotColor="#94a3b8"
                    />
                    <span>{typingIndicatorText}</span>
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="sticky bottom-0 z-10 shrink-0 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur"
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={draftInputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onInput={handleComposerInput}
                  rows={1}
                  className="h-10 min-h-10 max-h-40 flex-1 resize-none overflow-y-hidden rounded-xl border border-slate-200 bg-slate-50/75 px-3 py-2.5 text-sm leading-5 text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                  placeholder={tr(
                    isDoctor
                      ? 'Share a reply, follow-up instruction, or care update...'
                      : 'Describe your symptoms, ask a follow-up question, or share an update...',
                  )}
                />
                <button
                  type="submit"
                  disabled={!canSendMessage}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[104px] sm:gap-2 sm:rounded-xl sm:px-4"
                  style={{
                    borderColor: '#0f172a',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    boxShadow: '0 10px 24px -14px rgba(15,23,42,0.85)',
                    cursor: canSendMessage ? 'pointer' : 'not-allowed',
                    transform: canSendMessage ? undefined : 'none',
                    opacity: 1,
                    WebkitTextFillColor: '#ffffff',
                  }}
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
                    {sending ? tr('Sending...') : tr('Send')}
                  </span>
                  <span className="sr-only">
                    {sending ? tr('Sending...') : tr('Send Message')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
