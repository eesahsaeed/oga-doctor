import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client';

import { apiClient } from '../../lib/api';
import { getStoredUser } from '../../lib/session';

const ROOM_KEY = 'ogadoctor_livekit_room';
const NAME_KEY = 'ogadoctor_livekit_name';
const TOPIC_CHAT = 'ogadoctor.chat';
const TOPIC_FILE = 'ogadoctor.file';
const TOPIC_HAND = 'ogadoctor.hand';
const TOPIC_SYSTEM = 'ogadoctor.system';
const MAX_FILE_BYTES = 700 * 1024;

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
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioSinkRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const moreMenuRef = useRef(null);
  const moreToggleRef = useRef(null);

  const roomRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const remoteVideoTrackRef = useRef(null);
  const audioTracksRef = useRef(new Map());
  const roomNameRef = useRef('');
  const leavingRef = useRef(false);
  const seenChatRef = useRef(new Set());
  const seenFileRef = useRef(new Set());
  const pinnedParticipantIdRef = useRef('');

  const [roomId, setRoomId] = useState(() =>
    getStoredValue(ROOM_KEY, makeRoomId()),
  );
  const [participantName, setParticipantName] = useState(() =>
    getStoredValue(NAME_KEY, getDefaultName()),
  );

  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(
    'Ready. Join a consultation room to begin.',
  );
  const [error, setError] = useState('');

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [videoQuality, setVideoQuality] = useState('balanced');

  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const [activePanel, setActivePanel] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);

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
    if (!showMore) return undefined;
    const onDown = (event) => {
      const target = event.target;
      if (
        moreMenuRef.current?.contains(target) ||
        moreToggleRef.current?.contains(target)
      )
        return;
      setShowMore(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showMore]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatMessages]);

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

  const leaveRoom = async (preserveStatus = false) => {
    const room = roomRef.current;
    roomRef.current = null;
    if (!room) {
      if (!preserveStatus) setStatus('Call ended. You can rejoin any room.');
      return;
    }

    leavingRef.current = true;
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
    setShowMore(false);
    if (!preserveStatus) setStatus('Call ended. You can rejoin any room.');
    leavingRef.current = false;
  };

  const bindRoom = (room) => {
    room.on(RoomEvent.Connected, async () => {
      setIsConnected(true);
      setStatus(`Connected to room ${roomNameRef.current || room.name}.`);
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
      if (!leavingRef.current)
        setStatus('Disconnected from room. Rejoin to continue.');
    });

    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      if (state === 'reconnecting' || state === 'signalReconnecting')
        setStatus('Reconnecting call...');
    });

    room.on(RoomEvent.ParticipantConnected, (participant) => {
      syncParticipants(room);
      syncRemoteTiles(room);
      syncRemoteVideo(room);
      setStatus(
        `${labelForParticipant(participant, room.localParticipant.identity)} joined the room.`,
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
        `${labelForParticipant(participant, room.localParticipant.identity)} left the room.`,
      );
    });

    room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
      if (track.kind === Track.Kind.Audio) attachAudioTrack(track);
      if (track.kind === Track.Kind.Video) {
        syncRemoteVideo(room);
        syncRemoteTiles(room);
      }
      setStatus(
        `${labelForParticipant(participant, room.localParticipant.identity)} is live.`,
      );
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
      if (track.kind === Track.Kind.Audio) detachAudioTrack(track);
      if (track.kind === Track.Kind.Video) {
        syncRemoteVideo(room);
        syncRemoteTiles(room);
      }
      setStatus(
        `${labelForParticipant(participant, room.localParticipant.identity)} stream updated.`,
      );
    });

    room.on(RoomEvent.LocalTrackPublished, () => syncLocalVideo(room));
    room.on(RoomEvent.LocalTrackUnpublished, () => syncLocalVideo(room));

    room.on(RoomEvent.MediaDevicesError, (mediaError) => {
      setError(mediaError?.message || 'Unable to access camera or microphone.');
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
        setStatus(`File received: ${data.fileName || 'Shared file'}`);
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
              ? `${labelForParticipant(participant, localId)} raised hand.`
              : `${labelForParticipant(participant, localId)} lowered hand.`,
          );
        }
        return;
      }

      if (topic === TOPIC_SYSTEM && data.type === 'room-reminder') {
        const from =
          data.fromLabel || labelForParticipant(participant, localId);
        const remindedRoom = data.roomId || roomNameRef.current;
        setStatus(`${from} shared room reminder: ${remindedRoom}`);
      }
    });
  };

  const joinRoom = async () => {
    const nextRoom = roomId.trim();
    const nextName = participantName.trim();
    if (!nextRoom) return setError('Room ID is required.');
    if (!nextName) return setError('Participant name is required.');

    setIsJoining(true);
    setJoinModalDismissed(false);
    setError('');

    try {
      await leaveRoom(true);
      setStatus('Requesting secure room access...');

      const tokenPayload = await apiClient.createConsultationToken({
        roomName: nextRoom,
        participantName: nextName,
      });
      if (!tokenPayload?.token || !tokenPayload?.serverUrl) {
        throw new Error('LiveKit token service returned an invalid response.');
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
      setStatus(`Connecting to room ${roomNameRef.current}...`);

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
      setError(joinError.message || 'Unable to join room.');
      setStatus('Join failed. Check LiveKit backend configuration and retry.');
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
    if (!value) return setError('Room ID is required before copying.');
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`Room ID copied: ${value}`);
      setError('');
    } catch (_error) {
      setError('Unable to copy room ID. Please copy manually.');
    }
  };

  const createRoom = () => {
    const next = makeRoomId();
    setRoomId(next);
    setStatus(`Created room ${next}. Share it and tap Join Room.`);
    setError('');
  };

  const resendInvite = async () => {
    await copyRoom();
    setStatus(`Invitation details ready. Share room ID ${roomId.trim()}.`);

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
      setStatus(next ? 'Microphone enabled.' : 'Microphone muted.');
    } catch (toggleError) {
      setAudioEnabled(!next);
      setError(toggleError.message || 'Unable to update microphone state.');
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
      setStatus(next ? 'Camera enabled.' : 'Camera disabled.');
    } catch (toggleError) {
      setVideoEnabled(!next);
      setError(toggleError.message || 'Unable to update camera state.');
    }
  };

  const changeQuality = async (nextQuality) => {
    const room = roomRef.current;
    const quality = QUALITIES[nextQuality] || QUALITIES.balanced;
    setVideoQuality(nextQuality);

    if (!room || !videoEnabled) {
      setStatus(`Video quality set to ${quality.label}.`);
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
      setStatus(`Video quality switched to ${quality.label}.`);
    } catch (qualityError) {
      setError(qualityError.message || 'Unable to change video quality.');
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
      setStatus(next ? 'You raised your hand.' : 'You lowered your hand.');
    } catch (handError) {
      setIsHandRaised(!next);
      setRaisedHands((prev) => ({
        ...prev,
        [room.localParticipant.identity]: !next,
      }));
      setError(handError.message || 'Unable to update raised hand status.');
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
      setError(chatError.message || 'Unable to send chat message.');
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
        `File is too large. Max size is ${formatBytes(MAX_FILE_BYTES)}.`,
      );
    }

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () =>
          reject(new Error('Unable to read selected file.'));
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
      setStatus(`Shared file: ${file.name}`);
    } catch (fileError) {
      setError(fileError.message || 'Unable to share file.');
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
    setStatus('Focused selected participant.');
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
      <div className="fixed inset-0 z-[130] h-dvh min-h-dvh w-screen bg-white/92 backdrop-blur-sm">
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="relative w-full max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setJoinModalDismissed(true)}
              className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close join consultation modal"
              title="Close"
            >
              <IconClose />
            </button>
            <p className="text-sm font-semibold text-blue-800">
              Join video consultation
            </p>
            <p className="mt-1 text-xs text-slate-600">Room: {roomId}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void joinRoom()}
                disabled={isJoining}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? 'Joining...' : 'Join Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div ref={audioSinkRef} className="hidden" />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Video Consultation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Secure one-on-one and group video consultations.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr_auto_auto_auto]">
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            placeholder="Room ID"
          />
          <input
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            placeholder="Your name"
          />
          <button
            type="button"
            onClick={createRoom}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            New Room
          </button>
          <button
            type="button"
            onClick={() => void copyRoom()}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Copy ID
          </button>
          {!isConnected ? (
            <button
              type="button"
              onClick={() => void joinRoom()}
              disabled={isJoining}
              className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isJoining ? 'Joining...' : 'Join Consultation'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void leaveRoom()}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Leave Room
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Video: Secure
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Room: {currentRoom}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            People: {participants.length}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Status: {isConnected ? 'Connected' : 'Idle'}
          </span>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Video Quality
          </label>
          <select
            value={videoQuality}
            onChange={(e) => void changeQuality(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 md:max-w-[260px]"
          >
            {Object.entries(QUALITIES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => void shareFile(e)}
        />
        <p className="mt-2 text-sm text-slate-600">{status}</p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </section>

      <ScreenPortal enabled={isFullscreen}>
        <section
          className={
            isFullscreen
              ? 'fixed inset-0 z-[140] h-dvh min-h-dvh w-screen border-0 bg-black p-0 shadow-none backdrop-blur-sm'
              : 'rounded-2xl border border-slate-200 bg-slate-950 p-3 shadow-sm'
          }
        >
          <div
            className={
              isFullscreen
                ? 'relative h-dvh min-h-dvh w-screen overflow-hidden bg-slate-950/30'
                : 'relative aspect-video min-h-[280px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900'
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
                Waiting for participant video
              </div>
            )}

            {remoteVideoTiles.length > 0 && (
              <div
                className={[
                  'absolute z-20 flex max-w-[calc(100%-5.5rem)] items-start gap-2 overflow-x-auto rounded-xl border border-white/20 bg-black/45 p-2 shadow-lg backdrop-blur-sm',
                  isFullscreen ? 'left-4 top-4' : 'left-3 top-3',
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
                    Room {currentRoom}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {participants.length} people
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {audioEnabled ? 'Mic on' : 'Mic off'}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {videoEnabled ? 'Camera on' : 'Camera off'}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {raisedCount} raised hand
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-1">
                    {(QUALITIES[videoQuality] || QUALITIES.balanced).label}
                  </span>
                </div>
              </div>
            )}

            <div
              className={[
                'absolute left-1/2 -translate-x-1/2 z-20 rounded-full border border-white/20 bg-black/65 px-2.5 py-2 shadow-lg backdrop-blur-sm',
                isFullscreen ? 'bottom-14' : 'bottom-3',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <ControlButton
                  title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                  onClick={() => void toggleAudio()}
                >
                  {audioEnabled ? <IconMic /> : <IconMicOff />}
                </ControlButton>
                <ControlButton
                  title={videoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
                  onClick={() => void toggleVideo()}
                >
                  {videoEnabled ? <IconCamera /> : <IconCameraOff />}
                </ControlButton>
                <ControlButton
                  title="Chat"
                  active={activePanel === 'chat'}
                  onClick={() =>
                    setActivePanel((prev) => (prev === 'chat' ? '' : 'chat'))
                  }
                >
                  <IconChat />
                </ControlButton>
                <ControlButton title="Share File" onClick={triggerFilePicker}>
                  <IconFile />
                </ControlButton>
                <ControlButton
                  title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                  active={isHandRaised}
                  onClick={() => void toggleHand()}
                >
                  <IconHand />
                </ControlButton>
                <ControlButton
                  title="People"
                  active={activePanel === 'people'}
                  onClick={() =>
                    setActivePanel((prev) =>
                      prev === 'people' ? '' : 'people',
                    )
                  }
                >
                  <IconPeople />
                </ControlButton>
                <ControlButton
                  title="More Controls"
                  onClick={() => setShowMore((prev) => !prev)}
                  buttonRef={moreToggleRef}
                >
                  <IconMore />
                </ControlButton>
              </div>
            </div>

            {showMore && (
              <div
                className={[
                  'absolute z-30 min-w-[170px] rounded-xl border border-white/20 bg-black/80 p-2 text-xs text-white shadow-xl backdrop-blur-sm',
                  isFullscreen
                    ? 'bottom-24 left-1/2 -translate-x-1/2'
                    : 'bottom-14 left-1/2 -translate-x-1/2',
                ].join(' ')}
                ref={moreMenuRef}
              >
                <button
                  type="button"
                  onClick={() => {
                    void copyRoom();
                    setShowMore(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
                >
                  Copy Room ID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void resendInvite();
                    setShowMore(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
                >
                  Re-send Invite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerFilePicker();
                    setShowMore(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
                >
                  Share a file
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePanel((prev) =>
                      prev === 'people' ? '' : 'people',
                    );
                    setShowMore(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
                >
                  Show people
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFullscreen((prev) => !prev);
                    setShowMore(false);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
                >
                  {isFullscreen ? 'Exit Full Screen' : 'Go Full Screen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void leaveRoom();
                    setShowMore(false);
                  }}
                  className="mt-1 block w-full rounded-lg bg-red-600/90 px-2 py-1.5 text-left font-semibold text-white hover:bg-red-700"
                >
                  End Call
                </button>
              </div>
            )}

            {activePanel && (
              <aside
                className={[
                  'absolute z-20 w-[92%] max-w-sm rounded-2xl border border-white/20 bg-slate-950/85 p-3 text-white shadow-2xl backdrop-blur-xl',
                  isFullscreen ? 'right-4 top-4' : 'right-3 top-12',
                ].join(' ')}
              >
                {activePanel === 'chat' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Chat</p>
                      <button
                        type="button"
                        onClick={() => setActivePanel('')}
                        className="rounded-full bg-white/10 p-1 hover:bg-white/20"
                      >
                        <IconClose />
                      </button>
                    </div>
                    <div className="h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2">
                      {chatMessages.length === 0 && (
                        <p className="text-xs text-slate-300">
                          No messages yet.
                        </p>
                      )}
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={[
                            'rounded-lg px-2 py-1.5 text-xs',
                            message.isSelf
                              ? 'ml-8 bg-blue-600 text-white'
                              : 'mr-8 bg-white/10 text-slate-100',
                          ].join(' ')}
                        >
                          {!message.isSelf && (
                            <p className="mb-0.5 text-[10px] text-blue-200">
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
                        placeholder="Type a message"
                        className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-300"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}

                {activePanel === 'files' && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Shared Files</p>
                      <button
                        type="button"
                        onClick={() => setActivePanel('')}
                        className="rounded-full bg-white/10 p-1 hover:bg-white/20"
                      >
                        <IconClose />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={triggerFilePicker}
                      className="mb-2 w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                    >
                      Share New File
                    </button>
                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2">
                      {sharedFiles.length === 0 && (
                        <p className="text-xs text-slate-300">
                          No files shared yet.
                        </p>
                      )}
                      {sharedFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.dataUrl || '#'}
                          download={file.name}
                          className="block rounded-lg border border-white/10 bg-white/10 px-2 py-1.5 text-xs hover:bg-white/20"
                        >
                          <p className="font-semibold">{file.name}</p>
                          <p className="text-[10px] text-slate-300">
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
                      <p className="text-sm font-semibold">
                        People in Room ({participantLabels.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setActivePanel('')}
                        className="rounded-full bg-white/10 p-1 hover:bg-white/20"
                      >
                        <IconClose />
                      </button>
                    </div>
                    <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2">
                      {participantLabels.length === 0 && (
                        <p className="text-xs text-slate-300">
                          Nobody else has joined yet.
                        </p>
                      )}
                      {participantLabels.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-2 py-1.5 text-xs"
                        >
                          <span>{participant.label}</span>
                          {participant.raised && (
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                              Hand raised
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            )}

            <div
              className={[
                'absolute right-3 w-[35%] min-w-[150px] max-w-[240px] overflow-hidden rounded-lg border border-white/35 bg-slate-950 shadow-xl',
                isFullscreen ? 'bottom-24' : 'bottom-3',
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
                You
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
