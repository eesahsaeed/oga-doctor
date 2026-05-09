import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Card,
  CardBody,
  Chip,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  Typography,
} from '@material-tailwind/react';
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client';

import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../lib/api';
import { getStoredUser } from '../../lib/session';

const ROOM_KEY = 'ogadoctor_livekit_room';
const NAME_KEY = 'ogadoctor_livekit_name';
const TOPIC_CHAT = 'ogadoctor.chat';
const TOPIC_FILE = 'ogadoctor.file';
const TOPIC_HAND = 'ogadoctor.hand';
const TOPIC_SYSTEM = 'ogadoctor.system';
const TOPIC_TRANSCRIPT = 'ogadoctor.transcript';
const MAX_FILE_BYTES = 700 * 1024;
const SPEECH_LOCALES = {
  en: 'en-US',
  ha: 'ha-NG',
  ig: 'ig-NG',
  yo: 'yo-NG',
};

const QUALITIES = {
  low: {
    label: 'Low (360p)',
    resolution: VideoPresets.h360.resolution,
    frameRate: 20,
  },
  balanced: {
    label: 'Balanced (540p)',
    resolution: VideoPresets.h540.resolution,
    frameRate: 24,
  },
  high: {
    label: 'High (720p)',
    resolution: VideoPresets.h720.resolution,
    frameRate: 30,
  },
};

function makeRoomId() {
  return `oga-${Math.random().toString(36).slice(2, 10)}`;
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStoredValue(key, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function getDefaultName() {
  const user = getStoredUser();
  return user?.name && typeof user.name === 'string'
    ? user.name
    : 'OgaDoctor User';
}

function labelForParticipant(participant, localIdentity = '') {
  if (!participant) return 'Unknown';
  if (participant.identity === localIdentity) return 'You';
  if (participant.name?.trim()) return participant.name.trim();
  return participant.identity
    ? `Participant ${participant.identity.slice(0, 6)}`
    : 'Participant';
}

function encodePayload(value) {
  return new TextEncoder().encode(JSON.stringify(value || {}));
}

function decodePayload(payload) {
  try {
    return JSON.parse(new TextDecoder().decode(payload));
  } catch (_error) {
    return null;
  }
}

function normalizeTranscriptEntry(input = {}) {
  const text = String(input.text || input.message || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    return null;
  }

  const at = new Date(input.at || Date.now());
  return {
    id: String(input.id || makeId('transcript'))
      .trim()
      .slice(0, 120),
    speakerIdentity: String(input.speakerIdentity || input.from || '')
      .trim()
      .slice(0, 120),
    speakerName:
      String(input.speakerName || input.fromLabel || 'Participant')
        .trim()
        .slice(0, 120) || 'Participant',
    speakerUserId: String(input.speakerUserId || '')
      .trim()
      .slice(0, 120),
    source:
      String(input.source || 'manual')
        .trim()
        .toLowerCase()
        .slice(0, 24) || 'manual',
    text,
    at: Number.isNaN(at.getTime())
      ? new Date().toISOString()
      : at.toISOString(),
  };
}

function mergeTranscriptEntries(existingEntries = [], incomingEntries = []) {
  const entryMap = new Map();

  [...existingEntries, ...incomingEntries].forEach((entry) => {
    const normalized = normalizeTranscriptEntry(entry);
    if (!normalized) {
      return;
    }

    const key =
      normalized.id || `${normalized.speakerIdentity}-${normalized.at}`;
    const current = entryMap.get(key) || {};
    entryMap.set(key, { ...current, ...normalized });
  });

  return Array.from(entryMap.values()).sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

function formatTranscriptTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTranscriptSavedAt(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildTranscriptParticipants(room, currentUser, fallbackName = '') {
  if (!room) {
    return currentUser?.id
      ? [
          {
            identity: '',
            userId: currentUser.id,
            name: fallbackName || currentUser.name || 'Participant',
            accountType: currentUser.accountType || 'patient',
            isLocal: true,
          },
        ]
      : [];
  }

  const localIdentity = room.localParticipant?.identity || '';
  return [
    {
      identity: localIdentity,
      userId: currentUser?.id || '',
      name:
        labelForParticipant(room.localParticipant, localIdentity) ||
        fallbackName ||
        currentUser?.name ||
        'You',
      accountType: currentUser?.accountType || 'patient',
      isLocal: true,
    },
    ...Array.from(room.remoteParticipants.values()).map((participant) => ({
      identity: participant.identity || '',
      userId: '',
      name: labelForParticipant(participant, localIdentity),
      accountType: '',
      isLocal: false,
    })),
  ];
}

function formatBytes(size = 0) {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  const value = size / 1024 ** idx;
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[idx]}`;
}

function getSpeechLocale(language = 'en') {
  return SPEECH_LOCALES[language] || SPEECH_LOCALES.en;
}

function getWebSpeechRecognition() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function normalizeSpeechChunk(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getParticipantCameraTrack(participant) {
  if (!participant) return null;
  const cameraPub = participant.getTrackPublication(Track.Source.Camera);
  if (cameraPub?.track?.kind === Track.Kind.Video) return cameraPub.track;
  for (const videoPub of participant.videoTrackPublications.values()) {
    if (videoPub?.track?.kind === Track.Kind.Video) return videoPub.track;
  }
  return null;
}

function IconBase({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconMic() {
  return (
    <IconBase>
      <path d="M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      <path d="M18 11.25v1.5a6 6 0 1 1-12 0v-1.5" />
      <path d="M12 18.75V22.5" />
      <path d="M8.25 22.5h7.5" />
    </IconBase>
  );
}

function IconMicOff() {
  return (
    <IconBase>
      <path d="M12 15.75a3 3 0 0 1-3-3V9" />
      <path d="M15 9.75V4.5a3 3 0 1 0-6 0V6" />
      <path d="M18 11.25v1.5a6 6 0 0 1-9.1 5.1" />
      <path d="M6 11.25v1.5a6 6 0 0 0 .9 3.1" />
      <path d="M12 18.75V22.5" />
      <path d="M8.25 22.5h7.5" />
      <path d="M4 4l16 16" />
    </IconBase>
  );
}

function IconCamera() {
  return (
    <IconBase>
      <path d="M15.75 10.5v6.75A2.25 2.25 0 0 1 13.5 19.5h-9a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 4.5 4.5h9a2.25 2.25 0 0 1 2.25 2.25v3.75Z" />
      <path d="m15.75 10.5 4.72-2.36a.75.75 0 0 1 1.03.67v6.38a.75.75 0 0 1-1.03.67l-4.72-2.36" />
    </IconBase>
  );
}

function IconCameraOff() {
  return (
    <IconBase>
      <path d="M15.75 10.5v6.75A2.25 2.25 0 0 1 13.5 19.5H7.5" />
      <path d="M4.2 15.5A2.25 2.25 0 0 1 2.25 13.25V6.75A2.25 2.25 0 0 1 4.5 4.5h9a2.25 2.25 0 0 1 2.25 2.25v1.1" />
      <path d="m15.75 10.5 4.72-2.36a.75.75 0 0 1 1.03.67v6.38a.75.75 0 0 1-1.03.67l-2.05-1.03" />
      <path d="M4 4l16 16" />
    </IconBase>
  );
}

function IconChat() {
  return (
    <IconBase>
      <path d="M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v6.5A2.75 2.75 0 0 1 17.25 16H9l-4.5 3V6.75Z" />
      <path d="M8 9.25h8" />
      <path d="M8 12h5.5" />
    </IconBase>
  );
}

function IconTranscript() {
  return (
    <IconBase>
      <path d="M6.75 4.5h10.5A1.75 1.75 0 0 1 19 6.25v11.5a1.75 1.75 0 0 1-1.75 1.75H6.75A1.75 1.75 0 0 1 5 17.75V6.25A1.75 1.75 0 0 1 6.75 4.5Z" />
      <path d="M8.5 8.25h7" />
      <path d="M8.5 11.5h7" />
      <path d="M8.5 14.75h4.5" />
    </IconBase>
  );
}

function IconFile() {
  return (
    <IconBase>
      <path d="M7.5 3.75h6L18 8.25v10.5A1.5 1.5 0 0 1 16.5 20.25h-9A1.5 1.5 0 0 1 6 18.75v-13.5A1.5 1.5 0 0 1 7.5 3.75Z" />
      <path d="M13.5 3.75v4.5H18" />
      <path d="M9 12h6" />
      <path d="M9 15h4.5" />
    </IconBase>
  );
}

function IconHand() {
  return (
    <IconBase>
      <path d="M9.5 11.5V6.25a1.25 1.25 0 1 1 2.5 0V10" />
      <path d="M12 10V4.75a1.25 1.25 0 1 1 2.5 0V10.5" />
      <path d="M14.5 10.5V6a1.25 1.25 0 1 1 2.5 0v7.75c0 3.18-2.57 5.75-5.75 5.75h-.5A5.75 5.75 0 0 1 5 13.75V11a1.25 1.25 0 1 1 2.5 0v2.25" />
    </IconBase>
  );
}

function IconPeople() {
  return (
    <IconBase>
      <path d="M8.5 11.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" />
      <path d="M15.75 10.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
      <path d="M3.75 18a4.75 4.75 0 0 1 9.5 0" />
      <path d="M13.5 18a3.75 3.75 0 0 1 6.75-2.25" />
    </IconBase>
  );
}

function IconMore() {
  return (
    <IconBase>
      <path d="M6 12h.01" />
      <path d="M12 12h.01" />
      <path d="M18 12h.01" />
    </IconBase>
  );
}

function IconExpand() {
  return (
    <IconBase>
      <path d="M8 3H3v5" />
      <path d="M3 3l6 6" />
      <path d="M16 3h5v5" />
      <path d="M21 3l-6 6" />
      <path d="M8 21H3v-5" />
      <path d="M3 21l6-6" />
      <path d="M16 21h5v-5" />
      <path d="M21 21l-6-6" />
    </IconBase>
  );
}

function IconMinimize() {
  return (
    <IconBase>
      <path d="M9 9H3V3" />
      <path d="M3 9l6-6" />
      <path d="M15 9h6V3" />
      <path d="M21 9l-6-6" />
      <path d="M9 15H3v6" />
      <path d="M3 15l6 6" />
      <path d="M15 15h6v6" />
      <path d="M21 15l-6 6" />
    </IconBase>
  );
}

function IconClose() {
  return (
    <IconBase>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

function ParticipantVideoTile({
  label,
  track,
  selected,
  onClick,
  compact = false,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;
    if (!track) {
      el.srcObject = null;
      return undefined;
    }
    track.attach(el);
    return () => {
      try {
        track.detach(el);
      } catch (_error) {
        // no-op
      }
    };
  }, [track]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Focus ${label}`}
      className={[
        'relative shrink-0 overflow-hidden rounded-lg border bg-slate-900 text-left',
        compact ? 'h-20 w-32' : 'h-24 w-40',
        selected
          ? 'border-blue-400 ring-2 ring-blue-500/70'
          : 'border-white/25',
      ].join(' ')}
    >
      {track ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-800 text-[11px] text-slate-200">
          Camera off
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-[10px] font-medium text-white">
        {label}
      </div>
    </button>
  );
}

function ControlButton({
  title,
  active = false,
  onClick,
  children,
  buttonRef,
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      ref={buttonRef}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/25',
        active ? 'bg-blue-500' : 'bg-white/15',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function ScreenPortal({ enabled = false, children }) {
  if (enabled && typeof document !== 'undefined') {
    return createPortal(children, document.body);
  }
  return children;
}

export default function VideoConsultationPage() {
  const { tr, language, languageMeta } = useLanguage();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioSinkRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const transcriptEndRef = useRef(null);

  const roomRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const remoteVideoTrackRef = useRef(null);
  const audioTracksRef = useRef(new Map());
  const roomNameRef = useRef('');
  const leavingRef = useRef(false);
  const seenChatRef = useRef(new Set());
  const seenFileRef = useRef(new Set());
  const seenTranscriptRef = useRef(new Set());
  const pinnedParticipantIdRef = useRef('');
  const transcriptEntriesRef = useRef([]);
  const speechRecognitionRef = useRef(null);
  const speechRestartTimerRef = useRef(null);
  const lastSpeechChunkRef = useRef({ text: '', at: 0 });

  const currentUser = useMemo(() => getStoredUser(), []);
  const speechSupported = useMemo(() => Boolean(getWebSpeechRecognition()), []);
  const speechLocale = useMemo(() => getSpeechLocale(language), [language]);

  const [roomId, setRoomId] = useState(() =>
    getStoredValue(ROOM_KEY, makeRoomId()),
  );
  const [participantName, setParticipantName] = useState(() =>
    getStoredValue(NAME_KEY, getDefaultName()),
  );

  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(
    tr('Ready. Join a consultation room to begin.'),
  );
  const [error, setError] = useState('');

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [videoQuality, setVideoQuality] = useState('balanced');

  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activePanel, setActivePanel] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [transcriptEntries, setTranscriptEntries] = useState([]);
  const [transcriptRecordId, setTranscriptRecordId] = useState('');
  const [transcriptUpdatedAt, setTranscriptUpdatedAt] = useState('');
  const [transcriptSaving, setTranscriptSaving] = useState(false);
  const [autoTranscriptEnabled, setAutoTranscriptEnabled] = useState(false);
  const [autoTranscriptListening, setAutoTranscriptListening] = useState(false);
  const [autoTranscriptPreview, setAutoTranscriptPreview] = useState('');
  const [autoTranscriptError, setAutoTranscriptError] = useState('');

  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [participants, setParticipants] = useState([]);
  const [remoteVideoTiles, setRemoteVideoTiles] = useState([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState('');
  const [joinModalDismissed, setJoinModalDismissed] = useState(false);

  const participantLabels = useMemo(
    () =>
      participants.map((p) => ({ ...p, raised: Boolean(raisedHands[p.id]) })),
    [participants, raisedHands],
  );
  const raisedCount = useMemo(
    () => participantLabels.filter((p) => p.raised).length,
    [participantLabels],
  );

  useEffect(() => {
    if (typeof window !== 'undefined')
      window.localStorage.setItem(ROOM_KEY, roomId);
  }, [roomId]);

  useEffect(() => {
    if (typeof window !== 'undefined')
      window.localStorage.setItem(NAME_KEY, participantName);
  }, [participantName]);

  useEffect(() => {
    pinnedParticipantIdRef.current = pinnedParticipantId;
  }, [pinnedParticipantId]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatMessages]);

  useEffect(() => {
    transcriptEntriesRef.current = transcriptEntries;
    transcriptEndRef.current?.scrollIntoView({ block: 'end' });
  }, [transcriptEntries]);

  const detachAudioTrack = (track) => {
    const sid = track?.sid;
    if (!sid) return;
    const entry = audioTracksRef.current.get(sid);
    if (!entry) return;
    try {
      track.detach(entry.element);
    } catch (_error) {
      // no-op
    }
    entry.element.parentElement?.removeChild(entry.element);
    audioTracksRef.current.delete(sid);
  };

  const attachAudioTrack = (track) => {
    const sid = track?.sid;
    if (!sid || !audioSinkRef.current || audioTracksRef.current.has(sid))
      return;
    const element = track.attach();
    element.autoplay = true;
    element.playsInline = true;
    element.className = 'hidden';
    audioSinkRef.current.appendChild(element);
    audioTracksRef.current.set(sid, { track, element });
  };

  const detachAllAudio = () => {
    for (const entry of audioTracksRef.current.values()) {
      try {
        entry.track.detach(entry.element);
      } catch (_error) {
        // no-op
      }
      entry.element.parentElement?.removeChild(entry.element);
    }
    audioTracksRef.current.clear();
  };

  const syncParticipants = (room) => {
    if (!room) {
      setParticipants([]);
      return;
    }
    const localId = room.localParticipant.identity;
    setParticipants([
      {
        id: localId,
        label: labelForParticipant(room.localParticipant, localId),
        isLocal: true,
      },
      ...Array.from(room.remoteParticipants.values()).map((participant) => ({
        id: participant.identity,
        label: labelForParticipant(participant, localId),
        isLocal: false,
      })),
    ]);
  };

  const syncRemoteTiles = (room) => {
    if (!room) {
      setRemoteVideoTiles([]);
      return;
    }

    const localId = room.localParticipant.identity;
    const nextTiles = Array.from(room.remoteParticipants.values()).map(
      (participant) => ({
        id: participant.identity,
        label: labelForParticipant(participant, localId),
        track: getParticipantCameraTrack(participant),
      }),
    );

    const currentPinned = pinnedParticipantIdRef.current;
    if (currentPinned && !nextTiles.some((tile) => tile.id === currentPinned)) {
      pinnedParticipantIdRef.current = '';
      setPinnedParticipantId('');
    }

    setRemoteVideoTiles(nextTiles);
  };

  const syncLocalVideo = (room) => {
    const el = localVideoRef.current;
    if (!el || !room) return;
    const pub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    const track = pub?.track?.kind === Track.Kind.Video ? pub.track : null;

    if (
      localVideoTrackRef.current &&
      (!track || localVideoTrackRef.current.sid !== track.sid)
    ) {
      try {
        localVideoTrackRef.current.detach(el);
      } catch (_error) {
        // no-op
      }
    }

    if (track) {
      track.attach(el);
      el.muted = true;
      localVideoTrackRef.current = track;
    } else {
      el.srcObject = null;
      localVideoTrackRef.current = null;
    }
  };

  const syncRemoteVideo = (
    room,
    preferredParticipantId = pinnedParticipantIdRef.current,
  ) => {
    const el = remoteVideoRef.current;
    if (!el || !room) return;
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    const participantToFocus =
      remoteParticipants.find(
        (participant) => participant.identity === preferredParticipantId,
      ) ||
      remoteParticipants.find((participant) =>
        Boolean(getParticipantCameraTrack(participant)),
      ) ||
      remoteParticipants[0];

    const track = getParticipantCameraTrack(participantToFocus);

    if (
      remoteVideoTrackRef.current &&
      (!track || remoteVideoTrackRef.current.sid !== track.sid)
    ) {
      try {
        remoteVideoTrackRef.current.detach(el);
      } catch (_error) {
        // no-op
      }
    }

    if (track) {
      track.attach(el);
      remoteVideoTrackRef.current = track;
      setHasRemoteStream(true);
    } else {
      el.srcObject = null;
      remoteVideoTrackRef.current = null;
      setHasRemoteStream(false);
    }
  };

  const clearMedia = () => {
    if (localVideoTrackRef.current && localVideoRef.current) {
      try {
        localVideoTrackRef.current.detach(localVideoRef.current);
      } catch (_error) {
        // no-op
      }
    }

    if (remoteVideoTrackRef.current && remoteVideoRef.current) {
      try {
        remoteVideoTrackRef.current.detach(remoteVideoRef.current);
      } catch (_error) {
        // no-op
      }
    }

    localVideoTrackRef.current = null;
    remoteVideoTrackRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    detachAllAudio();
  };

  const shareTranscriptEntry = useCallback(
    async ({ text, source = 'manual' }) => {
      const room = roomRef.current;
      const normalizedText = normalizeSpeechChunk(text);

      if (!room || !normalizedText) {
        return false;
      }

      const localId = room.localParticipant.identity;
      const entry = normalizeTranscriptEntry({
        id: makeId('transcript'),
        speakerIdentity: localId,
        speakerName: labelForParticipant(room.localParticipant, localId),
        speakerUserId: currentUser?.id || '',
        source,
        text: normalizedText,
        at: new Date().toISOString(),
      });

      if (!entry) {
        return false;
      }

      seenTranscriptRef.current.add(entry.id);
      setTranscriptEntries((prev) => mergeTranscriptEntries(prev, [entry]));
      setActivePanel((prev) => prev || 'transcript');

      try {
        await room.localParticipant.publishData(encodePayload(entry), {
          reliable: true,
          topic: TOPIC_TRANSCRIPT,
        });
        return true;
      } catch (transcriptError) {
        const message =
          transcriptError.message || tr('Unable to share transcript entry.');
        setError(message);
        if (source === 'speech') {
          setAutoTranscriptError(message);
        }
        return false;
      }
    },
    [currentUser?.id, tr],
  );

  const loadTranscript = async (nextRoomName) => {
    const normalizedRoom = String(nextRoomName || '').trim();

    if (!normalizedRoom) {
      setTranscriptEntries([]);
      setTranscriptRecordId('');
      setTranscriptUpdatedAt('');
      seenTranscriptRef.current.clear();
      return;
    }

    try {
      const payload = await apiClient.consultationTranscript(normalizedRoom);
      const transcript = payload?.transcript || null;
      const nextEntries = mergeTranscriptEntries([], transcript?.entries || []);

      seenTranscriptRef.current = new Set(nextEntries.map((entry) => entry.id));
      setTranscriptEntries(nextEntries);
      setTranscriptRecordId(transcript?.id || '');
      setTranscriptUpdatedAt(transcript?.updatedAt || '');
    } catch (loadError) {
      setError(loadError.message || tr('Unable to load saved transcript.'));
    }
  };

  const persistTranscript = async ({
    status = 'active',
    suppressStatus = false,
    roomOverride = null,
  } = {}) => {
    const normalizedRoom = String(roomNameRef.current || roomId || '').trim();
    const room = roomOverride || roomRef.current;
    const entries = transcriptEntriesRef.current;
    const participantsPayload = buildTranscriptParticipants(
      room,
      currentUser,
      participantName.trim(),
    );

    if (
      !normalizedRoom ||
      (entries.length === 0 && participantsPayload.length === 0)
    ) {
      return null;
    }

    setTranscriptSaving(true);
    try {
      const payload = await apiClient.saveConsultationTranscript({
        roomName: normalizedRoom,
        consultationType: 'video',
        status,
        identity: room?.localParticipant?.identity || '',
        participantName: participantName.trim(),
        participants: participantsPayload,
        entries,
      });

      const savedTranscript = payload?.transcript || null;
      if (savedTranscript) {
        const nextEntries = mergeTranscriptEntries(
          [],
          savedTranscript.entries || [],
        );
        seenTranscriptRef.current = new Set(
          nextEntries.map((entry) => entry.id),
        );
        setTranscriptEntries(nextEntries);
        setTranscriptRecordId(savedTranscript.id || '');
        setTranscriptUpdatedAt(savedTranscript.updatedAt || '');
      }

      if (!suppressStatus) {
        setStatus(
          status === 'completed'
            ? tr('Transcript saved and consultation closed.')
            : tr('Transcript saved.'),
        );
      }

      return savedTranscript;
    } catch (saveError) {
      if (!suppressStatus) {
        setError(saveError.message || tr('Unable to save transcript.'));
      }
      return null;
    } finally {
      setTranscriptSaving(false);
    }
  };

  const leaveRoom = async (preserveStatus = false) => {
    const room = roomRef.current;
    if (!room) {
      if (!preserveStatus)
        setStatus(tr('Call ended. You can rejoin any room.'));
      return;
    }

    leavingRef.current = true;
    try {
      await persistTranscript({
        status: preserveStatus ? 'active' : 'completed',
        suppressStatus: true,
        roomOverride: room,
      });
    } catch (_error) {
      // no-op
    }
    roomRef.current = null;
    try {
      await room.disconnect();
    } catch (_error) {
      // no-op
    }
    try {
      room.removeAllListeners();
    } catch (_error) {
      // no-op
    }

    clearMedia();
    setIsConnected(false);
    setHasRemoteStream(false);
    setParticipants([]);
    setRemoteVideoTiles([]);
    pinnedParticipantIdRef.current = '';
    setPinnedParticipantId('');
    setRaisedHands({});
    setIsHandRaised(false);
    setActivePanel('');
    setAutoTranscriptEnabled(false);
    setAutoTranscriptListening(false);
    setAutoTranscriptPreview('');
    setAutoTranscriptError('');
    lastSpeechChunkRef.current = { text: '', at: 0 };
    if (!preserveStatus) setStatus(tr('Call ended. You can rejoin any room.'));
    leavingRef.current = false;
  };

  useEffect(() => {
    if (speechRestartTimerRef.current) {
      window.clearTimeout(speechRestartTimerRef.current);
      speechRestartTimerRef.current = null;
    }

    if (!autoTranscriptEnabled) {
      setAutoTranscriptListening(false);
      setAutoTranscriptPreview('');
      return undefined;
    }

    if (!isConnected || !roomRef.current) {
      setAutoTranscriptEnabled(false);
      return undefined;
    }

    const SpeechRecognition = getWebSpeechRecognition();
    if (!SpeechRecognition) {
      const message = tr('Live transcript unavailable on this browser.');
      setAutoTranscriptError(message);
      setError(message);
      setAutoTranscriptEnabled(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    speechRecognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = speechLocale;

    recognition.onstart = () => {
      setAutoTranscriptListening(true);
      setAutoTranscriptError('');
    };

    recognition.onresult = (event) => {
      const finalChunks = [];
      let preview = '';

      for (let idx = event.resultIndex; idx < event.results.length; idx += 1) {
        const result = event.results[idx];
        const transcript = normalizeSpeechChunk(result?.[0]?.transcript || '');
        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          finalChunks.push(transcript);
        } else {
          preview = transcript;
        }
      }

      setAutoTranscriptPreview(preview);

      finalChunks.forEach((chunk) => {
        const isDuplicate =
          lastSpeechChunkRef.current.text === chunk &&
          Date.now() - lastSpeechChunkRef.current.at < 4000;

        if (isDuplicate) {
          return;
        }

        lastSpeechChunkRef.current = {
          text: chunk,
          at: Date.now(),
        };
        void shareTranscriptEntry({ text: chunk, source: 'speech' });
      });
    };

    recognition.onerror = (event) => {
      const blocked =
        event?.error === 'not-allowed' ||
        event?.error === 'service-not-allowed';
      const unsupportedLanguage = event?.error === 'language-not-supported';
      const message = blocked
        ? tr('Speech recognition permission is required for live transcript.')
        : unsupportedLanguage
          ? tr(
              'Speech recognition is not available in {language} on this device.',
              {
                language: languageMeta.label,
              },
            )
          : event?.message || tr('Unable to start live transcript.');

      setAutoTranscriptError(message);
      setError(message);

      if (blocked || unsupportedLanguage) {
        setAutoTranscriptEnabled(false);
      }
    };

    recognition.onend = () => {
      setAutoTranscriptListening(false);
      setAutoTranscriptPreview('');

      if (!autoTranscriptEnabled || !isConnected || !roomRef.current) {
        return;
      }

      speechRestartTimerRef.current = window.setTimeout(() => {
        try {
          recognition.start();
        } catch (restartError) {
          const message =
            restartError?.message || tr('Unable to start live transcript.');
          setAutoTranscriptError(message);
          setError(message);
          setAutoTranscriptEnabled(false);
        }
      }, 300);
    };

    try {
      recognition.start();
    } catch (startError) {
      const message =
        startError?.message || tr('Unable to start live transcript.');
      setAutoTranscriptError(message);
      setError(message);
      setAutoTranscriptEnabled(false);
    }

    return () => {
      if (speechRestartTimerRef.current) {
        window.clearTimeout(speechRestartTimerRef.current);
        speechRestartTimerRef.current = null;
      }

      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      if (speechRecognitionRef.current === recognition) {
        speechRecognitionRef.current = null;
      }

      try {
        recognition.stop();
      } catch (_error) {
        try {
          recognition.abort();
        } catch (_abortError) {
          // no-op
        }
      }
    };
  }, [
    autoTranscriptEnabled,
    isConnected,
    languageMeta.label,
    shareTranscriptEntry,
    speechLocale,
    tr,
  ]);

  const toggleAutoTranscript = () => {
    if (autoTranscriptEnabled) {
      setAutoTranscriptEnabled(false);
      setAutoTranscriptListening(false);
      setAutoTranscriptPreview('');
      setAutoTranscriptError('');
      setStatus(tr('Live transcript stopped.'));
      return;
    }

    if (!roomRef.current || !isConnected) {
      setError(tr('Join a room before starting live transcript.'));
      return;
    }

    if (!speechSupported) {
      const message = tr('Live transcript unavailable on this browser.');
      setAutoTranscriptError(message);
      setError(message);
      return;
    }

    setAutoTranscriptError('');
    setAutoTranscriptPreview('');
    setActivePanel((prev) => prev || 'transcript');
    setAutoTranscriptEnabled(true);
    setStatus(tr('Live transcript started.'));
  };

  const bindRoom = (room) => {
    room.on(RoomEvent.Connected, async () => {
      setIsConnected(true);
      setStatus(
        tr('Connected to room {room}.', {
          room: roomNameRef.current || room.name,
        }),
      );
      setError('');
      syncParticipants(room);
      syncLocalVideo(room);
      syncRemoteVideo(room);
      syncRemoteTiles(room);
      try {
        await room.startAudio();
      } catch (_error) {
        // no-op
      }
    });

    room.on(RoomEvent.Disconnected, () => {
      clearMedia();
      setIsConnected(false);
      setHasRemoteStream(false);
      setParticipants([]);
      setRemoteVideoTiles([]);
      pinnedParticipantIdRef.current = '';
      setPinnedParticipantId('');
      setAutoTranscriptEnabled(false);
      setAutoTranscriptListening(false);
      setAutoTranscriptPreview('');
      if (!leavingRef.current)
        setStatus(tr('Disconnected from room. Rejoin to continue.'));
    });

    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      if (state === 'reconnecting' || state === 'signalReconnecting')
        setStatus(tr('Reconnecting call...'));
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      syncParticipants(room);
      syncRemoteTiles(room);
      syncRemoteVideo(room);
      setStatus(
        tr('{name} joined the room.', {
          name: labelForParticipant(
            participant,
            room.localParticipant.identity,
          ),
        }),
      );
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      syncParticipants(room);
      syncRemoteTiles(room);
      syncRemoteVideo(room);
      setRaisedHands((prev) => {
        const next = { ...prev };
        delete next[participant.identity];
        return next;
      });
      setStatus(
        tr('{name} left the room.', {
          name: labelForParticipant(
            participant,
            room.localParticipant.identity,
          ),
        }),
      );
    });

    room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
      if (track.kind === Track.Kind.Audio) attachAudioTrack(track);
      if (track.kind === Track.Kind.Video) {
        syncRemoteVideo(room);
        syncRemoteTiles(room);
      }
      setStatus(
        tr('{name} is live.', {
          name: labelForParticipant(
            participant,
            room.localParticipant.identity,
          ),
        }),
      );
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
      if (track.kind === Track.Kind.Audio) detachAudioTrack(track);
      if (track.kind === Track.Kind.Video) {
        syncRemoteVideo(room);
        syncRemoteTiles(room);
      }
      setStatus(
        tr('{name} stream updated.', {
          name: labelForParticipant(
            participant,
            room.localParticipant.identity,
          ),
        }),
      );
    });

    room.on(RoomEvent.LocalTrackPublished, () => syncLocalVideo(room));
    room.on(RoomEvent.LocalTrackUnpublished, () => syncLocalVideo(room));

    room.on(RoomEvent.MediaDevicesError, (mediaError) => {
      setError(
        mediaError?.message || tr('Unable to access camera or microphone.'),
      );
    });

    room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
      const data = decodePayload(payload);
      if (!data || !topic) return;

      const senderId = participant?.identity || '';
      const localId = room.localParticipant.identity;

      if (topic === TOPIC_CHAT) {
        const id = data.id || makeId('chat');
        if (seenChatRef.current.has(id)) return;
        seenChatRef.current.add(id);
        setChatMessages((prev) => [
          ...prev,
          {
            id,
            from: senderId,
            fromLabel:
              data.fromLabel || labelForParticipant(participant, localId),
            message: data.message || '',
            at: data.at || new Date().toISOString(),
            isSelf: senderId === localId,
          },
        ]);
        setActivePanel((prev) => prev || 'chat');
        return;
      }

      if (topic === TOPIC_FILE) {
        const id = data.id || makeId('file');
        if (seenFileRef.current.has(id)) return;
        seenFileRef.current.add(id);
        setSharedFiles((prev) => [
          ...prev,
          {
            id,
            from: senderId,
            fromLabel:
              data.fromLabel || labelForParticipant(participant, localId),
            name: data.fileName || 'Shared file',
            type: data.fileType || '',
            size: data.fileSize || 0,
            dataUrl: data.fileData || '',
            at: data.at || new Date().toISOString(),
            isSelf: senderId === localId,
          },
        ]);
        setActivePanel((prev) => prev || 'files');
        setStatus(
          tr('File received: {name}', {
            name: data.fileName || tr('Shared file'),
          }),
        );
        return;
      }

      if (topic === TOPIC_TRANSCRIPT) {
        const entry = normalizeTranscriptEntry({
          ...data,
          id: data.id || makeId('transcript'),
          speakerIdentity: senderId,
          speakerName:
            data.speakerName || labelForParticipant(participant, localId),
        });
        if (!entry) {
          return;
        }

        if (seenTranscriptRef.current.has(entry.id)) {
          return;
        }

        seenTranscriptRef.current.add(entry.id);
        setTranscriptEntries((prev) => mergeTranscriptEntries(prev, [entry]));
        setActivePanel((prev) => prev || 'transcript');
        setStatus(
          tr('Transcript updated by {name}.', {
            name: entry.speakerName,
          }),
        );
        return;
      }

      if (topic === TOPIC_HAND) {
        const raised = Boolean(data.raised);
        setRaisedHands((prev) => ({ ...prev, [senderId]: raised }));
        if (senderId === localId) {
          setIsHandRaised(raised);
        } else {
          setStatus(
            raised
              ? tr('{name} raised hand.', {
                  name: labelForParticipant(participant, localId),
                })
              : tr('{name} lowered hand.', {
                  name: labelForParticipant(participant, localId),
                }),
          );
        }
        return;
      }

      if (topic === TOPIC_SYSTEM && data.type === 'room-reminder') {
        const from =
          data.fromLabel || labelForParticipant(participant, localId);
        const remindedRoom = data.roomId || roomNameRef.current;
        setStatus(
          tr('{name} shared room reminder: {room}', {
            name: from,
            room: remindedRoom,
          }),
        );
      }
    });
  };

  const joinRoom = async () => {
    const nextRoom = roomId.trim();
    const nextName = participantName.trim();
    if (!nextRoom) return setError(tr('Room ID is required.'));
    if (!nextName) return setError(tr('Participant name is required.'));

    setIsJoining(true);
    setJoinModalDismissed(false);
    setError('');

    try {
      await loadTranscript(nextRoom);
      await leaveRoom(true);
      setStatus(tr('Requesting secure room access...'));

      const tokenPayload = await apiClient.createConsultationToken({
        roomName: nextRoom,
        participantName: nextName,
      });
      if (!tokenPayload?.token || !tokenPayload?.serverUrl) {
        throw new Error(
          tr('LiveKit token service returned an invalid response.'),
        );
      }

      if (tokenPayload.roomName && tokenPayload.roomName !== nextRoom) {
        await loadTranscript(tokenPayload.roomName);
      }

      roomNameRef.current = tokenPayload.roomName || nextRoom;
      const quality = QUALITIES[videoQuality] || QUALITIES.balanced;

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: quality.resolution,
          frameRate: quality.frameRate,
        },
      });

      bindRoom(room);
      roomRef.current = room;
      setStatus(
        tr('Connecting to room {room}...', {
          room: roomNameRef.current,
        }),
      );

      await room.connect(tokenPayload.serverUrl, tokenPayload.token, {
        autoSubscribe: true,
      });
      await room.localParticipant.setMicrophoneEnabled(audioEnabled);
      await room.localParticipant.setCameraEnabled(videoEnabled, {
        resolution: quality.resolution,
        frameRate: quality.frameRate,
      });

      syncParticipants(room);
      syncLocalVideo(room);
      syncRemoteVideo(room);
      syncRemoteTiles(room);
    } catch (joinError) {
      const joinMessage = joinError?.message || tr('Unable to join room.');
      setError(joinMessage);
      setStatus(tr('Join failed: {message}', { message: joinMessage }));
      await leaveRoom(true);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    return () => {
      void leaveRoom(true);
    };
  }, []);

  const copyRoom = async () => {
    const value = roomId.trim();
    if (!value) return setError(tr('Room ID is required before copying.'));
    try {
      await navigator.clipboard.writeText(value);
      setStatus(tr('Room ID copied: {room}', { room: value }));
      setError('');
    } catch (_error) {
      setError(tr('Unable to copy room ID. Please copy manually.'));
    }
  };

  const createRoom = () => {
    const next = makeRoomId();
    setRoomId(next);
    setTranscriptInput('');
    setTranscriptEntries([]);
    setTranscriptRecordId('');
    setTranscriptUpdatedAt('');
    seenTranscriptRef.current.clear();
    setStatus(
      tr('Created room {room}. Share it and tap Join Room.', {
        room: next,
      }),
    );
    setError('');
  };

  const resendInvite = async () => {
    await copyRoom();
    setStatus(
      tr('Invitation details ready. Share room ID {room}.', {
        room: roomId.trim(),
      }),
    );

    const room = roomRef.current;
    if (!room || !isConnected) return;

    try {
      await room.localParticipant.publishData(
        encodePayload({
          type: 'room-reminder',
          roomId: roomNameRef.current || roomId.trim(),
          fromLabel: labelForParticipant(
            room.localParticipant,
            room.localParticipant.identity,
          ),
          at: new Date().toISOString(),
        }),
        { reliable: true, topic: TOPIC_SYSTEM },
      );
    } catch (_error) {
      // Keep local invite flow even if reminder broadcast fails.
    }
  };

  const toggleAudio = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !audioEnabled;
    setAudioEnabled(next);
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setStatus(next ? tr('Microphone enabled.') : tr('Microphone muted.'));
    } catch (toggleError) {
      setAudioEnabled(!next);
      setError(toggleError.message || tr('Unable to update microphone state.'));
    }
  };

  const toggleVideo = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !videoEnabled;
    setVideoEnabled(next);
    const quality = QUALITIES[videoQuality] || QUALITIES.balanced;
    try {
      await room.localParticipant.setCameraEnabled(next, {
        resolution: quality.resolution,
        frameRate: quality.frameRate,
      });
      syncLocalVideo(room);
      setStatus(next ? tr('Camera enabled.') : tr('Camera disabled.'));
    } catch (toggleError) {
      setVideoEnabled(!next);
      setError(toggleError.message || tr('Unable to update camera state.'));
    }
  };

  const changeQuality = async (nextQuality) => {
    const room = roomRef.current;
    const quality = QUALITIES[nextQuality] || QUALITIES.balanced;
    setVideoQuality(nextQuality);

    if (!room || !videoEnabled) {
      setStatus(
        tr('Video quality set to {quality}.', {
          quality: tr(quality.label),
        }),
      );
      return;
    }

    try {
      const pub = room.localParticipant.getTrackPublication(
        Track.Source.Camera,
      );
      const localTrack = pub?.track;
      if (localTrack && typeof localTrack.restartTrack === 'function') {
        await localTrack.restartTrack({
          resolution: quality.resolution,
          frameRate: quality.frameRate,
        });
      } else {
        await room.localParticipant.setCameraEnabled(true, {
          resolution: quality.resolution,
          frameRate: quality.frameRate,
        });
      }
      syncLocalVideo(room);
      setStatus(
        tr('Video quality switched to {quality}.', {
          quality: tr(quality.label),
        }),
      );
    } catch (qualityError) {
      setError(qualityError.message || tr('Unable to change video quality.'));
    }
  };

  const toggleHand = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isHandRaised;
    setIsHandRaised(next);
    setRaisedHands((prev) => ({
      ...prev,
      [room.localParticipant.identity]: next,
    }));

    try {
      await room.localParticipant.publishData(encodePayload({ raised: next }), {
        reliable: true,
        topic: TOPIC_HAND,
      });
      setStatus(
        next ? tr('You raised your hand.') : tr('You lowered your hand.'),
      );
    } catch (handError) {
      setIsHandRaised(!next);
      setRaisedHands((prev) => ({
        ...prev,
        [room.localParticipant.identity]: !next,
      }));
      setError(handError.message || tr('Unable to update raised hand status.'));
    }
  };

  const sendChatMessage = async (event) => {
    event.preventDefault();
    const room = roomRef.current;
    if (!room) return;
    const text = chatInput.trim();
    if (!text) return;

    const id = makeId('chat');
    const localId = room.localParticipant.identity;
    const fromLabel = labelForParticipant(room.localParticipant, localId);
    const at = new Date().toISOString();
    seenChatRef.current.add(id);

    setChatMessages((prev) => [
      ...prev,
      { id, from: localId, fromLabel, message: text, at, isSelf: true },
    ]);
    setChatInput('');

    try {
      await room.localParticipant.publishData(
        encodePayload({ id, message: text, fromLabel, at }),
        {
          reliable: true,
          topic: TOPIC_CHAT,
        },
      );
    } catch (chatError) {
      setError(chatError.message || tr('Unable to send chat message.'));
    }
  };

  const addTranscriptEntry = async (event) => {
    event.preventDefault();
    const text = transcriptInput.trim();

    if (!roomRef.current) {
      return setError(tr('Join a room before adding transcript entries.'));
    }

    if (!text) {
      return;
    }

    setTranscriptInput('');
    const shared = await shareTranscriptEntry({ text, source: 'manual' });
    if (shared) {
      setStatus(tr('Transcript updated.'));
    }
  };

  const triggerFilePicker = () => {
    if (!isConnected) return;
    fileInputRef.current?.click();
  };

  const shareFile = async (event) => {
    const room = roomRef.current;
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!room || !file) return;

    if (file.size > MAX_FILE_BYTES) {
      return setError(
        tr('File is too large. Max size is {size}.', {
          size: formatBytes(MAX_FILE_BYTES),
        }),
      );
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () =>
          reject(new Error(tr('Unable to read selected file.')));
        reader.readAsDataURL(file);
      });

      const id = makeId('file');
      const localId = room.localParticipant.identity;
      const fromLabel = labelForParticipant(room.localParticipant, localId);
      const at = new Date().toISOString();
      seenFileRef.current.add(id);

      setSharedFiles((prev) => [
        ...prev,
        {
          id,
          from: localId,
          fromLabel,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          at,
          isSelf: true,
        },
      ]);
      setActivePanel((prev) => prev || 'files');

      await room.localParticipant.publishData(
        encodePayload({
          id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: dataUrl,
          fromLabel,
          at,
        }),
        { reliable: true, topic: TOPIC_FILE },
      );
      setStatus(tr('Shared file: {name}', { name: file.name }));
    } catch (fileError) {
      setError(fileError.message || tr('Unable to share file.'));
    }
  };

  const currentRoom = roomNameRef.current || roomId || '-';
  const focusedParticipantId =
    pinnedParticipantId ||
    remoteVideoTiles.find((tile) => Boolean(tile.track))?.id ||
    remoteVideoTiles[0]?.id ||
    '';

  const focusParticipant = (participantId) => {
    if (!participantId) return;
    pinnedParticipantIdRef.current = participantId;
    setPinnedParticipantId(participantId);
    syncRemoteVideo(roomRef.current, participantId);
    setStatus(tr('Focused selected participant.'));
  };

  useEffect(() => {
    if (!isConnected) return undefined;
    const room = roomRef.current;
    if (!room) return undefined;

    // Fullscreen uses a portal; when DOM nodes remount, re-attach live tracks.
    const frame = window.requestAnimationFrame(() => {
      syncLocalVideo(room);
      syncRemoteVideo(room);
      syncRemoteTiles(room);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isFullscreen, isConnected]);

  const joinModal =
    !isConnected && !joinModalDismissed ? (
      <div className="fixed inset-0 z-[130] h-dvh min-h-dvh w-screen bg-slate-950/55 backdrop-blur-sm">
        <div className="flex h-full w-full items-center justify-center p-4 sm:p-6">
          <Card className="relative w-full max-w-md border border-slate-200 shadow-2xl">
            <CardBody className="space-y-4 p-6">
              <button
                type="button"
                onClick={() => setJoinModalDismissed(true)}
                className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-none transition hover:bg-slate-100"
                style={{
                  borderColor: '#e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                }}
                aria-label={tr('Close join consultation modal')}
                title={tr('Close')}
              >
                <IconClose />
              </button>
              <div className="space-y-1">
                <Typography variant="h5" color="blue-gray">
                  {tr('Join video consultation')}
                </Typography>
                <Typography className="text-sm font-normal text-slate-600">
                  {tr('Room')}: {roomId}
                </Typography>
              </div>
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={isJoining}
                className="w-full rounded-full px-4 py-3 text-sm font-semibold shadow-none transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  border: '1px solid #0f172a',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                }}
              >
                {isJoining ? tr('Joining...') : tr('Join Now')}
              </button>
            </CardBody>
          </Card>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-5">
      <div ref={audioSinkRef} className="hidden" />

      <Card shadow={false} className="border border-slate-200">
        <CardBody className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <Typography variant="h4" color="blue-gray">
              {tr('Video Consultation')}
            </Typography>
            <Typography className="text-sm font-normal text-slate-600">
              {tr('Secure one-on-one and group video consultations.')}
            </Typography>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip
              value={`${tr('Room')}: ${currentRoom}`}
              className="w-fit rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700"
            />
            <Chip
              value={`${tr('People')}: ${participants.length}`}
              className="w-fit rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700"
            />
            <Chip
              value={`${tr('Status')}: ${isConnected ? tr('Connected') : tr('Idle')}`}
              className="w-fit rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-700"
            />
          </div>
        </CardBody>
      </Card>

      <Card shadow={false} className="border border-slate-200">
        <CardBody className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {tr('Room ID')}
              </label>
              <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                placeholder={tr('Room ID')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {tr('Your name')}
              </label>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                placeholder={tr('Your name')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_auto_minmax(0,220px)_1fr]">
            <button
              type="button"
              onClick={createRoom}
              className="rounded-full border px-4 py-3 text-xs font-semibold shadow-none transition hover:bg-slate-50"
              style={{
                borderColor: '#cbd5e1',
                color: '#334155',
                backgroundColor: '#ffffff',
              }}
            >
              {tr('New Room')}
            </button>
            <button
              type="button"
              onClick={() => void copyRoom()}
              className="rounded-full border px-4 py-3 text-xs font-semibold shadow-none transition hover:bg-slate-50"
              style={{
                borderColor: '#cbd5e1',
                color: '#334155',
                backgroundColor: '#ffffff',
              }}
            >
              {tr('Copy ID')}
            </button>
            <select
              value={videoQuality}
              onChange={(e) => void changeQuality(e.target.value)}
              className="w-full rounded-full border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
            >
              {Object.entries(QUALITIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {tr(value.label)}
                </option>
              ))}
            </select>
            {!isConnected ? (
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={isJoining}
                className="rounded-full px-4 py-3 text-sm font-semibold shadow-none transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  border: '1px solid #0f172a',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                }}
              >
                {isJoining ? tr('Joining...') : tr('Join Consultation')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void leaveRoom()}
                className="rounded-full border px-4 py-3 text-sm font-semibold shadow-none transition hover:bg-red-50"
                style={{
                  borderColor: '#fca5a5',
                  backgroundColor: '#ffffff',
                  color: '#b91c1c',
                }}
              >
                {tr('Leave Room')}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {status}
            </div>
            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => void shareFile(e)}
          />
        </CardBody>
      </Card>

      <ScreenPortal enabled={isFullscreen}>
        <section
          className={
            isFullscreen
              ? 'fixed inset-0 z-[140] h-dvh min-h-dvh w-screen border-0 bg-black p-0 shadow-none backdrop-blur-sm'
              : 'rounded-2xl border border-slate-200 bg-slate-950 p-2 shadow-sm sm:p-3'
          }
        >
          <div
            className={
              isFullscreen
                ? 'relative h-dvh min-h-dvh w-screen overflow-hidden bg-slate-950/30'
                : 'relative aspect-[4/5] min-h-[360px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 sm:aspect-video sm:min-h-[280px]'
            }
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            />
            {!hasRemoteStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-sm text-slate-300">
                {tr('Waiting for participant video')}
              </div>
            )}

            {remoteVideoTiles.length > 0 && (
              <div
                className={[
                  'absolute z-20 flex items-start gap-2 overflow-x-auto rounded-xl border border-white/20 bg-black/45 p-2 shadow-lg backdrop-blur-sm',
                  isFullscreen
                    ? 'left-4 top-4 max-w-[calc(100%-5.5rem)]'
                    : 'left-2 right-12 top-2 max-w-none sm:left-3 sm:right-auto sm:top-3 sm:max-w-[calc(100%-5.5rem)]',
                ].join(' ')}
              >
                {remoteVideoTiles.map((tile) => (
                  <ParticipantVideoTile
                    key={tile.id}
                    label={tile.label}
                    track={tile.track}
                    selected={focusedParticipantId === tile.id}
                    compact={!isFullscreen}
                    onClick={() => focusParticipant(tile.id)}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
            >
              {isFullscreen ? <IconMinimize /> : <IconExpand />}
            </button>

            {isFullscreen && (
              <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 rounded-2xl border border-white/35 bg-white/15 p-2.5 text-[11px] text-white shadow-2xl backdrop-blur-xl">
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {tr('Room')} {currentRoom}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {isConnected ? tr('Online') : tr('Offline')}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {participants.length} {tr('people')}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {audioEnabled ? tr('Mic on') : tr('Mic off')}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {videoEnabled ? tr('Camera on') : tr('Camera off')}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {raisedCount} {tr('raised hand')}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {transcriptEntries.length} {tr('transcript notes')}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {tr((QUALITIES[videoQuality] || QUALITIES.balanced).label)}
                  </span>
                </div>
              </div>
            )}

            <div
              className={[
                'absolute z-20 border border-white/20 bg-black/65 shadow-lg backdrop-blur-sm',
                isFullscreen
                  ? 'bottom-14 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-2'
                  : 'inset-x-2 bottom-2 rounded-2xl px-2 py-2 sm:bottom-3 sm:left-1/2 sm:right-auto sm:inset-x-auto sm:-translate-x-1/2 sm:rounded-full sm:px-2.5',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 overflow-x-auto">
                <ControlButton
                  title={
                    audioEnabled
                      ? tr('Mute Microphone')
                      : tr('Unmute Microphone')
                  }
                  onClick={() => void toggleAudio()}
                >
                  {audioEnabled ? <IconMic /> : <IconMicOff />}
                </ControlButton>
                <ControlButton
                  title={
                    videoEnabled ? tr('Turn Camera Off') : tr('Turn Camera On')
                  }
                  onClick={() => void toggleVideo()}
                >
                  {videoEnabled ? <IconCamera /> : <IconCameraOff />}
                </ControlButton>
                <ControlButton
                  title={tr('Chat')}
                  active={activePanel === 'chat'}
                  onClick={() => setActivePanel('chat')}
                >
                  <IconChat />
                </ControlButton>
                <ControlButton
                  title={tr('Transcript')}
                  active={activePanel === 'transcript'}
                  onClick={() => setActivePanel('transcript')}
                >
                  <IconTranscript />
                </ControlButton>
                <ControlButton
                  title={tr('Share File')}
                  onClick={triggerFilePicker}
                >
                  <IconFile />
                </ControlButton>
                <ControlButton
                  title={isHandRaised ? tr('Lower Hand') : tr('Raise Hand')}
                  active={isHandRaised}
                  onClick={() => void toggleHand()}
                >
                  <IconHand />
                </ControlButton>
                <ControlButton
                  title={tr('People')}
                  active={activePanel === 'people'}
                  onClick={() => setActivePanel('people')}
                >
                  <IconPeople />
                </ControlButton>
                <Menu placement="top-end">
                  <MenuHandler>
                    <div>
                      <ControlButton title={tr('More Controls')}>
                        <IconMore />
                      </ControlButton>
                    </div>
                  </MenuHandler>
                  <MenuList className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl shadow-slate-200/60">
                    <MenuItem
                      className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => void copyRoom()}
                    >
                      {tr('Copy Room ID')}
                    </MenuItem>
                    <MenuItem
                      className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => void resendInvite()}
                    >
                      {tr('Re-send Invite')}
                    </MenuItem>
                    <MenuItem
                      className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => setActivePanel('transcript')}
                    >
                      {tr('Open transcript')}
                    </MenuItem>
                    <MenuItem
                      className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() =>
                        void persistTranscript({
                          status: isConnected ? 'active' : 'completed',
                        })
                      }
                    >
                      {tr('Save transcript')}
                    </MenuItem>
                    <MenuItem
                      className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => {
                        setActivePanel('files');
                        triggerFilePicker();
                      }}
                    >
                      {tr('Share a file')}
                    </MenuItem>
                    <MenuItem
                      className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => setActivePanel('people')}
                    >
                      {tr('Show people')}
                    </MenuItem>
                    <MenuItem
                      className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900"
                      onClick={() => setIsFullscreen((prev) => !prev)}
                    >
                      {isFullscreen
                        ? tr('Exit Full Screen')
                        : tr('Go Full Screen')}
                    </MenuItem>
                    <MenuItem
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:!bg-red-100 focus:!bg-red-100 focus:text-red-700"
                      onClick={() => void leaveRoom()}
                    >
                      {tr('End Call')}
                    </MenuItem>
                  </MenuList>
                </Menu>
              </div>
            </div>

            {activePanel && (
              <aside
                className={[
                  'absolute z-20',
                  isFullscreen
                    ? 'right-4 top-4 w-[92%] max-w-sm'
                    : 'inset-x-2 bottom-16 top-auto w-auto max-w-none sm:bottom-auto sm:right-3 sm:top-12 sm:left-auto sm:w-[92%] sm:max-w-sm',
                ].join(' ')}
              >
                <Card
                  shadow={false}
                  className="border border-slate-200 bg-white text-slate-900"
                >
                  <CardBody className="space-y-3 p-3">
                    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:grid-cols-4">
                      {[
                        ['chat', tr('Chat')],
                        ['transcript', tr('Transcript')],
                        ['files', tr('Files')],
                        ['people', tr('People')],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActivePanel(key)}
                          className={[
                            'rounded-xl px-2 py-2 text-[11px] font-semibold transition',
                            activePanel === key
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-white',
                          ].join(' ')}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {activePanel === 'transcript' && (
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {tr('Transcript')}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {transcriptEntries.length} {tr('entries')}
                              {transcriptUpdatedAt
                                ? ` - ${tr('saved')} ${formatTranscriptSavedAt(transcriptUpdatedAt)}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void persistTranscript({
                                  status: isConnected ? 'active' : 'completed',
                                })
                              }
                              disabled={transcriptSaving}
                              className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {transcriptSaving ? tr('Saving...') : tr('Save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePanel('')}
                              className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50"
                            >
                              <IconClose />
                            </button>
                          </div>
                        </div>
                        <div className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-emerald-900">
                                {autoTranscriptError
                                  ? autoTranscriptError
                                  : autoTranscriptListening
                                    ? tr('Listening for speech...')
                                    : speechSupported
                                      ? tr(
                                          'Automatic transcript stays off until you start it.',
                                        )
                                      : tr(
                                          'Live transcript unavailable on this browser.',
                                        )}
                              </p>
                              {!autoTranscriptError &&
                                autoTranscriptPreview && (
                                  <p className="mt-1 truncate text-[10px] text-emerald-700">
                                    {autoTranscriptPreview}
                                  </p>
                                )}
                            </div>
                            <button
                              type="button"
                              onClick={toggleAutoTranscript}
                              disabled={!isConnected && !autoTranscriptEnabled}
                              className={[
                                'rounded-xl px-3 py-2 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-60',
                                autoTranscriptEnabled
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                  : 'border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100',
                              ].join(' ')}
                            >
                              {autoTranscriptEnabled
                                ? tr('Stop Live Transcript')
                                : tr('Start Live Transcript')}
                            </button>
                          </div>
                        </div>
                        <div className="h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                          {transcriptEntries.length === 0 && (
                            <p className="text-xs text-slate-500">
                              {tr(
                                'Add important spoken notes here so the consultation is saved as a transcript.',
                              )}
                            </p>
                          )}
                          {transcriptEntries.map((entry) => {
                            const isSelf =
                              entry.speakerIdentity ===
                              roomRef.current?.localParticipant?.identity;

                            return (
                              <div
                                key={entry.id}
                                className={[
                                  'rounded-lg px-2 py-1.5 text-xs',
                                  isSelf
                                    ? 'ml-8 bg-emerald-600 text-white'
                                    : 'mr-8 border border-slate-200 bg-white text-slate-700',
                                ].join(' ')}
                              >
                                <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                                  <span
                                    className={
                                      isSelf
                                        ? 'text-emerald-50'
                                        : 'text-slate-500'
                                    }
                                  >
                                    {entry.speakerName}
                                  </span>
                                  <span
                                    className={
                                      isSelf
                                        ? 'text-emerald-100'
                                        : 'text-slate-400'
                                    }
                                  >
                                    {formatTranscriptTime(entry.at)}
                                  </span>
                                </div>
                                <p>{entry.text}</p>
                              </div>
                            );
                          })}
                          <div ref={transcriptEndRef} />
                        </div>
                        <form
                          onSubmit={(e) => void addTranscriptEntry(e)}
                          className="mt-2 space-y-2"
                        >
                          <textarea
                            value={transcriptInput}
                            onChange={(e) => setTranscriptInput(e.target.value)}
                            placeholder={tr(
                              'Add a transcript line or consultation note',
                            )}
                            rows={3}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                            >
                              {tr('Add line')}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void persistTranscript({
                                  status: isConnected ? 'active' : 'completed',
                                })
                              }
                              disabled={transcriptSaving}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {transcriptRecordId
                                ? tr('Update record')
                                : tr('Save transcript')}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {activePanel === 'chat' && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {tr('Chat')}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActivePanel('')}
                            className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50"
                          >
                            <IconClose />
                          </button>
                        </div>
                        <div className="h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                          {chatMessages.length === 0 && (
                            <p className="text-xs text-slate-500">
                              {tr('No messages yet.')}
                            </p>
                          )}
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={[
                                'rounded-lg px-2 py-1.5 text-xs',
                                message.isSelf
                                  ? 'ml-8 bg-slate-900 text-white'
                                  : 'mr-8 border border-slate-200 bg-white text-slate-700',
                              ].join(' ')}
                            >
                              {!message.isSelf && (
                                <p className="mb-0.5 text-[10px] text-slate-500">
                                  {message.fromLabel}
                                </p>
                              )}
                              <p>{message.message}</p>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                        <form
                          onSubmit={(e) => void sendChatMessage(e)}
                          className="mt-2 flex gap-2"
                        >
                          <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={tr('Type a message')}
                            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400"
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            {tr('Send')}
                          </button>
                        </form>
                      </div>
                    )}

                    {activePanel === 'files' && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {tr('Shared Files')}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActivePanel('')}
                            className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50"
                          >
                            <IconClose />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={triggerFilePicker}
                          className="mb-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          {tr('Share New File')}
                        </button>
                        <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                          {sharedFiles.length === 0 && (
                            <p className="text-xs text-slate-500">
                              {tr('No files shared yet.')}
                            </p>
                          )}
                          {sharedFiles.map((file) => (
                            <a
                              key={file.id}
                              href={file.dataUrl || '#'}
                              download={file.name}
                              className="block rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <p className="font-semibold text-slate-900">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {file.fromLabel} - {formatBytes(file.size)}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {activePanel === 'people' && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {tr('People in Room ({count})', {
                              count: participantLabels.length,
                            })}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActivePanel('')}
                            className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50"
                          >
                            <IconClose />
                          </button>
                        </div>
                        <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                          {participantLabels.length === 0 && (
                            <p className="text-xs text-slate-500">
                              {tr('Nobody else has joined yet.')}
                            </p>
                          )}
                          {participantLabels.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                            >
                              <span>{participant.label}</span>
                              {participant.raised && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                                  {tr('Hand raised')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </aside>
            )}

            <div
              className={[
                'absolute z-10 overflow-hidden rounded-lg border border-white/35 bg-slate-950 shadow-xl',
                isFullscreen
                  ? 'bottom-24 right-3 w-[240px] max-w-[32vw]'
                  : 'bottom-16 right-2 w-24 sm:bottom-3 sm:right-3 sm:w-[35%] sm:min-w-[150px] sm:max-w-[240px]',
              ].join(' ')}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="aspect-video w-full object-cover"
              />
              <div className="bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
                {tr('You')}
              </div>
            </div>
          </div>
        </section>
      </ScreenPortal>

      {typeof document !== 'undefined' && joinModal
        ? createPortal(joinModal, document.body)
        : null}
    </div>
  );
}
