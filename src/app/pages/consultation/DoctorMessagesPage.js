import { useEffect, useMemo, useRef, useState } from 'react';
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

function TypingDots({ colorClass = 'bg-current' }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full ${colorClass} animate-bounce`}
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </span>
  );
}

export default function DoctorMessagesPage() {
  const { user } = useAuth();
  const { tr, formatDateTime, language } = useLanguage();
  const endRef = useRef(null);
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
    let inFlight = false;
    let intervalId;

    async function loadChats({ initial = false } = {}) {
      if (inFlight) {
        return;
      }

      inFlight = true;
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
        inFlight = false;
      }
    }

    void loadChats({ initial: true });
    intervalId = window.setInterval(() => {
      void loadChats();
    }, 6000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedChatId, setSearchParams, tr]);

  useEffect(() => {
    if (!selectedChatId) {
      setSelectedChat(null);
      return;
    }

    let active = true;
    let inFlight = false;
    let intervalId;

    async function loadChat({ initial = false } = {}) {
      if (inFlight) {
        return;
      }

      inFlight = true;
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
        inFlight = false;
      }
    }

    void loadChat({ initial: true });
    intervalId = window.setInterval(() => {
      void loadChat();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedChatId, tr]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [selectedChat?.messages]);

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
  const typingIndicator = selectedChat?.typingIndicator || null;
  const typingIndicatorText =
    typingIndicator && typingIndicator.senderType !== viewerType
      ? getTypingIndicatorText(typingIndicator)
      : '';
  const hasDraftText = Boolean(draft.trim());

  useEffect(() => {
    const chatId = selectedChat?.id;
    if (!chatId) {
      return undefined;
    }

    let intervalId;
    let cancelled = false;

    async function updateTyping(isTyping) {
      try {
        const payload = await apiClient.setDoctorChatTyping(chatId, {
          isTyping,
        });

        if (cancelled || !payload?.chat) {
          return;
        }

        setSelectedChat(payload.chat);
        setChats((current) => upsertChat(current, payload.chat));
      } catch (_error) {
        // Non-blocking presence hint. Ignore failures silently.
      }
    }

    if (!hasDraftText || sending) {
      void updateTyping(false);
      return () => {
        cancelled = true;
      };
    }

    void updateTyping(true);
    intervalId = window.setInterval(() => {
      void updateTyping(true);
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      void apiClient
        .setDoctorChatTyping(chatId, { isTyping: false })
        .catch(() => {});
    };
  }, [hasDraftText, selectedChat?.id, sending]);

  const helperText = useMemo(() => {
    if (!selectedParty) {
      return isDoctor
        ? tr('Pick a patient conversation to review their latest message.')
        : tr('Pick a doctor to view your conversation history.');
    }

    if (isDoctor) {
      return tr(
        'Reply directly to your patients from this shared consultation inbox.',
      );
    }

    return '';
  }, [isDoctor, selectedParty, tr]);

  const sendMessage = async (event) => {
    event.preventDefault();

    const message = draft.trim();
    if (!selectedChat?.id || !message || sending) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const payload = await apiClient.sendDoctorChatMessage(selectedChat.id, {
        message,
      });

      if (payload?.chat) {
        setSelectedChat(payload.chat);
        setChats((current) => upsertChat(current, payload.chat));
      }
      setDraft('');
    } catch (sendError) {
      setError(sendError.message || tr('Unable to send message right now.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {tr(isDoctor ? 'Patient Messages' : 'Doctor Messages')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
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
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {tr('Find Doctors')}
            </Link>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-3">
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
                  'w-full rounded-2xl border p-3.5 text-left transition-colors',
                  isSelected
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={partyAvatar}
                    alt={party?.name || tr(isDoctor ? 'Patient' : 'Doctor')}
                    className="h-12 w-12 rounded-2xl object-cover"
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
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {previewText}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!selectedChatId && !hasChats && (
          <div className="flex h-full min-h-[480px] items-center justify-center p-8 text-center">
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
          <div className="flex min-h-[540px] flex-col">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedParty?.name ||
                        tr(
                          isDoctor
                            ? 'Patient Conversation'
                            : 'Doctor Conversation',
                        )}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {tr(
                        isDoctor
                          ? selectedPatient?.email ||
                              selectedChat?.subject ||
                              ''
                          : selectedDoctor?.title ||
                              selectedDoctor?.specialty ||
                              selectedChat?.subject ||
                              '',
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {!isDoctor && selectedDoctor?.nextAvailable && (
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                      {tr('Next available: {value}', {
                        value: tr(selectedDoctor.nextAvailable),
                      })}
                    </span>
                  )}
                  {!isDoctor && selectedDoctor?.responseTime && (
                    <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700">
                      {tr(selectedDoctor.responseTime)}
                    </span>
                  )}
                  {isDoctor && selectedPatient?.email && (
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                      {selectedPatient.email}
                    </span>
                  )}
                </div>
              </div>

              {helperText ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {helperText}
                </p>
              ) : null}

              {typingIndicatorText ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  <TypingDots colorClass="bg-blue-500" />
                  <span>{typingIndicatorText}</span>
                </div>
              ) : null}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
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
                        'max-w-2xl rounded-2xl border px-4 py-3',
                        isLocal
                          ? 'ml-auto border-blue-200 bg-blue-50'
                          : 'border-slate-200 bg-slate-50',
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
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {getDoctorChatDisplayText(message, translatedTextMap)}
                      </p>
                    </div>
                  );
                })}
              {typingIndicatorText ? (
                <div className="max-w-fit rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <TypingDots colorClass="bg-slate-400" />
                    <span>{typingIndicatorText}</span>
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="border-t border-slate-200 p-5"
            >
              <label className="block text-sm font-medium text-slate-700">
                {tr(isDoctor ? 'Send a reply' : 'Send a direct message')}
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  className="min-h-[96px] flex-1 rounded-2xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  placeholder={tr(
                    isDoctor
                      ? 'Share a reply, follow-up instruction, or care update...'
                      : 'Describe your symptoms, ask a follow-up question, or share an update...',
                  )}
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim() || !selectedChat?.id}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
                >
                  {sending ? tr('Sending...') : tr('Send Message')}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
