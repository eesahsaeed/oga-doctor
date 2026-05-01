import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const RTC_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function makeRoomId() {
  return `oga-${Math.random().toString(36).slice(2, 10)}`;
}

function formatParticipantLabel(socketId, mySocketId) {
  if (!socketId) {
    return 'Unknown';
  }
  if (socketId === mySocketId) {
    return 'You';
  }
  return `Guest ${socketId.slice(0, 6)}`;
}

const VIDEO_QUALITY_PRESETS = {
  low: {
    label: 'Low (360p)',
    constraints: {
      width: { ideal: 640, max: 640 },
      height: { ideal: 360, max: 360 },
      frameRate: { ideal: 15, max: 20 },
    },
  },
  balanced: {
    label: 'Balanced (540p)',
    constraints: {
      width: { ideal: 960, max: 960 },
      height: { ideal: 540, max: 540 },
      frameRate: { ideal: 24, max: 30 },
    },
  },
  high: {
    label: 'High (720p)',
    constraints: {
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  },
};

function getVideoConstraints(qualityKey) {
  return (
    VIDEO_QUALITY_PRESETS[qualityKey]?.constraints ||
    VIDEO_QUALITY_PRESETS.balanced.constraints
  );
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

function IconVideo() {
  return (
    <IconBase>
      <rect x="3.5" y="6.5" width="12" height="11" rx="2.2" />
      <path d="m15.5 10 4.8-2.3a.8.8 0 0 1 1.2.7v7.2a.8.8 0 0 1-1.2.7L15.5 14" />
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

function IconCheck() {
  return (
    <IconBase>
      <path d="m5 12 4.5 4.5L19 7" />
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

export default function VideoConsultationPage() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef('');
  const callStateRef = useRef('idle');
  const makingOfferRef = useRef(false);
  const peerSocketIdRef = useRef('');
  const pendingOfferRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const autoJoinAttemptedRef = useRef(false);
  const moreMenuRef = useRef(null);
  const moreToggleRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [roomId, setRoomId] = useState(makeRoomId());
  const [socketState, setSocketState] = useState('disconnected');
  const [callState, setCallState] = useState('idle');
  const [status, setStatus] = useState('Allow camera and mic access to start.');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [pendingOffer, setPendingOffer] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [showFloatingMore, setShowFloatingMore] = useState(false);
  const [mySocketId, setMySocketId] = useState('');
  const [roomParticipants, setRoomParticipants] = useState([]);
  const [activePanel, setActivePanel] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [videoQuality, setVideoQuality] = useState('balanced');

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    if (autoJoinAttemptedRef.current) {
      return;
    }
    autoJoinAttemptedRef.current = true;
    void joinRoom({
      silent: true,
    });
  }, []);

  useEffect(() => {
    if (!isVideoFullscreen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsVideoFullscreen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isVideoFullscreen]);

  useEffect(() => {
    if (!showFloatingMore) {
      return undefined;
    }

    const onPointerDown = (event) => {
      const target = event.target;
      if (
        moreMenuRef.current?.contains(target) ||
        moreToggleRef.current?.contains(target)
      ) {
        return;
      }
      setShowFloatingMore(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [showFloatingMore]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ block: 'end' });
    }
  }, [chatMessages]);

  const setIncomingOffer = (offerData) => {
    pendingOfferRef.current = offerData;
    setPendingOffer(offerData);
  };

  const shouldShowJoinPrompt = (participantCount = 0) =>
    participantCount >= 2 &&
    callStateRef.current !== 'in-call' &&
    callStateRef.current !== 'calling' &&
    callStateRef.current !== 'ringing' &&
    !pendingOfferRef.current;

  useEffect(() => {
    return () => {
      cleanupCall();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const applyTrackPreferences = (stream) => {
    stream.getAudioTracks().forEach((track) => {
      track.enabled = audioEnabled;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = videoEnabled;
    });
  };

  const flushPendingIceCandidates = async () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) {
      return;
    }

    const queued = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of queued) {
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_error) {
        // Keep call active even if a queued candidate is stale.
      }
    }
  };

  const ensureMedia = async () => {
    if (localStreamRef.current) {
      applyTrackPreferences(localStreamRef.current);
      return localStreamRef.current;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera is not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: getVideoConstraints(videoQuality),
      audio: true,
    });

    localStreamRef.current = stream;
    applyTrackPreferences(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const resetPeerConnection = () => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    peerSocketIdRef.current = '';
    makingOfferRef.current = false;
    pendingIceCandidatesRef.current = [];
    setIncomingOffer(null);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setHasRemoteStream(false);
    setRaisedHands({});
  };

  const ensureSocket = () => {
    if (socketRef.current) return socketRef.current;

    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setMySocketId(socket.id);
      setSocketState('connected');
      setStatus('Connected. You can join or start a consultation.');
    });

    socket.on('disconnect', () => {
      setMySocketId('');
      setSocketState('disconnected');
      setStatus('Connection lost. Reconnecting...');
    });

    socket.on('room-error', (payload) => {
      setStatus(payload?.message || 'Room error. Please retry.');
    });

    socket.on('room-joined', (payload) => {
      if (!payload?.roomId || payload.roomId !== activeRoomRef.current) return;
      const nextParticipants = Array.isArray(payload.participants)
        ? payload.participants
        : [];
      setRoomParticipants(nextParticipants);
      setRaisedHands((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([participantId]) =>
            nextParticipants.includes(participantId),
          ),
        ),
      );
      if (payload.participantCount > 1) {
        if (shouldShowJoinPrompt(payload.participantCount)) {
          setShowJoinPrompt(true);
        }
        setStatus(
          `Joined room ${payload.roomId}. Participant found. Tap Start Call when ready.`,
        );
        return;
      }

      setShowJoinPrompt(false);
      setStatus(`Joined room ${payload.roomId}. Waiting for participant...`);
    });

    socket.on('room-state', (payload) => {
      try {
        if (!payload?.roomId || payload.roomId !== activeRoomRef.current) {
          return;
        }
        const nextParticipants = Array.isArray(payload.participants)
          ? payload.participants
          : [];
        setRoomParticipants(nextParticipants);
        setRaisedHands((prev) =>
          Object.fromEntries(
            Object.entries(prev).filter(([participantId]) =>
              nextParticipants.includes(participantId),
            ),
          ),
        );

        if (payload.participantCount >= 2) {
          if (shouldShowJoinPrompt(payload.participantCount)) {
            setShowJoinPrompt(true);
          }
          setStatus(
            `Participant available in room ${payload.roomId}. Tap Start Call to connect.`,
          );
        } else {
          setShowJoinPrompt(false);
        }
      } catch (error) {
        setStatus(error.message || 'Failed to sync room state.');
      }
    });

    socket.on('participant-joined', (payload) => {
      if (!payload?.roomId || payload.roomId !== activeRoomRef.current) {
        return;
      }

      if (
        callStateRef.current !== 'in-call' &&
        callStateRef.current !== 'calling' &&
        callStateRef.current !== 'ringing'
      ) {
        setRoomParticipants((prev) =>
          prev.includes(payload.socketId)
            ? prev
            : [...prev, payload.socketId].filter(Boolean),
        );
        peerSocketIdRef.current = payload.socketId || '';
        if (shouldShowJoinPrompt(payload.participantCount || 2)) {
          setShowJoinPrompt(true);
        }
        setStatus(
          `Participant joined room ${payload.roomId}. Tap Start Call to connect.`,
        );
      }
    });

    socket.on('participant-left', (payload) => {
      if (!payload?.roomId || payload.roomId !== activeRoomRef.current) {
        return;
      }

      setRoomParticipants((prev) =>
        prev.filter((participantId) => participantId !== payload.socketId),
      );
      setRaisedHands((prev) => {
        const next = { ...prev };
        delete next[payload.socketId];
        return next;
      });
      setShowJoinPrompt(false);
      resetPeerConnection();
      setCallState('ready');
      setStatus(
        `Participant left room ${payload.roomId}. Waiting for reconnection...`,
      );
    });

    socket.on('offer-declined', (data) => {
      if (!data?.roomId || data.roomId !== activeRoomRef.current) return;

      setIncomingOffer(null);
      setCallState('ready');
      setStatus(
        data?.reason === 'busy'
          ? 'The other person is currently busy.'
          : 'Call declined.',
      );
    });

    socket.on('receive-offer', (data) => {
      if (!data?.offer || !data?.roomId) return;
      if (activeRoomRef.current && data.roomId !== activeRoomRef.current)
        return;
      if (data.from && data.from === socket.id) return;

      if (
        callStateRef.current === 'in-call' ||
        callStateRef.current === 'calling'
      ) {
        socket.emit('decline-offer', {
          roomId: data.roomId,
          to: data.from,
          reason: 'busy',
        });
        return;
      }

      setShowJoinPrompt(false);
      setIncomingOffer(data);
      setCallState('ringing');
      setStatus(`Incoming call in room ${data.roomId}. Accept or decline.`);
    });

    socket.on('receive-answer', async (data) => {
      if (!data?.answer || !peerRef.current) return;

      try {
        peerSocketIdRef.current = data.from || peerSocketIdRef.current;
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
        await flushPendingIceCandidates();
        setCallState('in-call');
        setStatus('Peer connected.');
      } catch (error) {
        setStatus(error.message || 'Failed to finalize connection.');
      }
    });

    socket.on('receive-ice-candidate', async (data) => {
      if (!data?.candidate) return;
      if (!peerRef.current || !peerRef.current.remoteDescription) {
        pendingIceCandidatesRef.current.push(data.candidate);
        return;
      }
      try {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
      } catch (_error) {
        // Keep trying connection; dropped candidates are non-fatal.
      }
    });

    socket.on('receive-chat-message', (data) => {
      if (!data?.roomId || data.roomId !== activeRoomRef.current) {
        return;
      }

      const senderId = data.from || '';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          from: senderId,
          fromLabel: formatParticipantLabel(senderId, socket.id),
          message: data.message || '',
          at: data.at || new Date().toISOString(),
          isSelf: senderId === socket.id,
        },
      ]);
      setActivePanel((panel) => panel || 'chat');
    });

    socket.on('receive-file-share', (data) => {
      if (!data?.roomId || data.roomId !== activeRoomRef.current) {
        return;
      }

      const senderId = data.from || '';
      setSharedFiles((prev) => [
        ...prev,
        {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          from: senderId,
          fromLabel: formatParticipantLabel(senderId, socket.id),
          name: data.fileName || 'Shared file',
          type: data.fileType || '',
          size: data.fileSize || 0,
          dataUrl: data.fileData || '',
          at: data.at || new Date().toISOString(),
          isSelf: senderId === socket.id,
        },
      ]);
      setActivePanel((panel) => panel || 'files');
      setStatus(`File received: ${data.fileName || 'Shared file'}`);
    });

    socket.on('receive-raise-hand', (data) => {
      if (!data?.roomId || data.roomId !== activeRoomRef.current) {
        return;
      }

      const senderId = data.from || '';
      if (!senderId) {
        return;
      }

      const raised = Boolean(data.raised);
      setRaisedHands((prev) => ({
        ...prev,
        [senderId]: raised,
      }));

      if (senderId !== socket.id) {
        setStatus(
          raised
            ? `${formatParticipantLabel(senderId, socket.id)} raised hand.`
            : `${formatParticipantLabel(senderId, socket.id)} lowered hand.`,
        );
      }
    });

    socketRef.current = socket;
    return socket;
  };

  const ensurePeer = async (nextRoomId) => {
    if (peerRef.current) return peerRef.current;

    const socket = ensureSocket();
    const stream = await ensureMedia();
    const peer = new RTCPeerConnection(RTC_CONFIG);

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setHasRemoteStream(true);
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit('send-ice-candidate', {
        roomId: nextRoomId,
        candidate: event.candidate,
        to: peerSocketIdRef.current || undefined,
      });
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setCallState('in-call');
        setStatus(`Call active in room ${nextRoomId}.`);
      }
      if (peer.connectionState === 'failed') {
        setStatus('Connection failed. End call and retry.');
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const createAndSendOffer = async (nextRoomId, targetSocketId = '') => {
    if (makingOfferRef.current) {
      return;
    }

    try {
      makingOfferRef.current = true;
      const socket = ensureSocket();
      const peer = await ensurePeer(nextRoomId);

      if (peer.signalingState !== 'stable') {
        return;
      }

      if (targetSocketId) {
        peerSocketIdRef.current = targetSocketId;
      }

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('send-offer', {
        roomId: nextRoomId,
        offer,
        to: targetSocketId || undefined,
      });

      setCallState('calling');
      setStatus(`Calling room ${nextRoomId}...`);
    } catch (error) {
      setStatus(error.message || 'Failed to start call.');
    } finally {
      makingOfferRef.current = false;
    }
  };

  const acceptIncomingOffer = async () => {
    const offerData = pendingOfferRef.current;
    if (!offerData?.offer || !offerData?.roomId) {
      setStatus('No pending offer to accept.');
      return;
    }

    try {
      await ensureMedia();
      const pc = await ensurePeer(offerData.roomId);
      const socket = ensureSocket();

      if (pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offerData.offer));
      await flushPendingIceCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      peerSocketIdRef.current = offerData.from || '';

      socket.emit('send-answer', {
        roomId: offerData.roomId,
        answer,
        to: offerData.from,
      });

      setIncomingOffer(null);
      setCallState('in-call');
      setStatus(`Connected in room ${offerData.roomId}.`);
    } catch (error) {
      setStatus(error.message || 'Failed to accept incoming call.');
    }
  };

  const declineIncomingOffer = () => {
    const offerData = pendingOfferRef.current;
    if (!offerData?.roomId) {
      setIncomingOffer(null);
      return;
    }

    const socket = ensureSocket();
    socket.emit('decline-offer', {
      roomId: offerData.roomId,
      to: offerData.from,
      reason: 'declined',
    });

    setIncomingOffer(null);
    setCallState('ready');
    setStatus(`Declined call for room ${offerData.roomId}.`);
  };

  const toggleAudio = async () => {
    try {
      const stream = await ensureMedia();
      const next = !audioEnabled;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
      setAudioEnabled(next);
    } catch (error) {
      setStatus(error.message || 'Unable to toggle microphone.');
    }
  };

  const toggleVideo = async () => {
    try {
      const stream = await ensureMedia();
      const next = !videoEnabled;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
      setVideoEnabled(next);
    } catch (error) {
      setStatus(error.message || 'Unable to toggle camera.');
    }
  };

  const changeVideoQuality = async (event) => {
    const nextQuality = event.target.value;
    if (!VIDEO_QUALITY_PRESETS[nextQuality] || nextQuality === videoQuality) {
      return;
    }

    const previousQuality = videoQuality;
    setVideoQuality(nextQuality);

    if (!localStreamRef.current) {
      setStatus(
        `Video quality set to ${VIDEO_QUALITY_PRESETS[nextQuality].label}.`,
      );
      return;
    }

    try {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        setStatus('Video quality will apply when camera starts.');
        return;
      }

      await videoTrack.applyConstraints(getVideoConstraints(nextQuality));
      setStatus(
        `Video quality set to ${VIDEO_QUALITY_PRESETS[nextQuality].label}.`,
      );
    } catch (error) {
      setVideoQuality(previousQuality);
      setStatus(
        error.message ||
          'Unable to apply selected video quality on this device.',
      );
    }
  };

  const copyRoom = async () => {
    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) {
      setStatus('Enter a room ID first.');
      return;
    }

    try {
      await navigator.clipboard.writeText(trimmedRoomId);
      setStatus(`Room ID copied: ${trimmedRoomId}`);
    } catch (_error) {
      setStatus('Copy failed. Please copy room ID manually.');
    }
  };

  const resendInvite = async () => {
    const nextRoomId = activeRoomRef.current || roomId.trim();
    if (!nextRoomId) {
      setStatus('Join a room before sending another invite.');
      return;
    }
    await createAndSendOffer(nextRoomId, peerSocketIdRef.current);
  };

  const toggleRaiseHand = () => {
    const nextRaised = !isHandRaised;
    setIsHandRaised(nextRaised);
    setRaisedHands((prev) => ({
      ...prev,
      [mySocketId || 'local']: nextRaised,
    }));

    const socket = ensureSocket();
    socket.emit('send-raise-hand', {
      roomId: activeRoomRef.current || roomId.trim(),
      raised: nextRaised,
    });
    setStatus(nextRaised ? 'You raised your hand.' : 'You lowered your hand.');
  };

  const sendChatMessage = (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) {
      return;
    }

    const activeRoomId = activeRoomRef.current || roomId.trim();
    if (!activeRoomId) {
      setStatus('Join a room before sending chat messages.');
      return;
    }

    const socket = ensureSocket();
    socket.emit('send-chat-message', {
      roomId: activeRoomId,
      message,
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from: socket.id,
        fromLabel: 'You',
        message,
        at: new Date().toISOString(),
        isSelf: true,
      },
    ]);
    setChatInput('');
  };

  const triggerFilePicker = () => {
    if (!activeRoomRef.current && !roomId.trim()) {
      setStatus('Join a room before sharing files.');
      return;
    }
    setActivePanel('files');
    fileInputRef.current?.click();
  };

  const shareSelectedFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const activeRoomId = activeRoomRef.current || roomId.trim();
    if (!activeRoomId) {
      setStatus('Join a room before sharing files.');
      return;
    }

    const maxSizeBytes = 4 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setStatus('File too large. Please share files up to 4MB.');
      return;
    }

    try {
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });

      const socket = ensureSocket();
      socket.emit('send-file-share', {
        roomId: activeRoomId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData,
      });

      setSharedFiles((prev) => [
        ...prev,
        {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          from: socket.id,
          fromLabel: 'You',
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: fileData,
          at: new Date().toISOString(),
          isSelf: true,
        },
      ]);
      setActivePanel('files');
      setStatus(`Shared file: ${file.name}`);
    } catch (error) {
      setStatus(error.message || 'Failed to share file.');
    }
  };

  const togglePanel = (panelName) => {
    setActivePanel((prev) => (prev === panelName ? '' : panelName));
  };

  const formatBytes = (bytes = 0) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / 1024 ** index;
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
  };

  const toggleVideoFullscreen = () => {
    setIsVideoFullscreen((prev) => !prev);
    setShowFloatingMore(false);
  };

  const joinRoom = async ({ silent = false, roomOverride = '' } = {}) => {
    const trimmedRoomId = (roomOverride || roomId).trim();
    if (!trimmedRoomId) {
      if (!silent) {
        setStatus('Enter a room ID first.');
      }
      return;
    }

    try {
      const socket = ensureSocket();
      activeRoomRef.current = trimmedRoomId;
      setRoomParticipants(socket.id ? [socket.id] : []);
      setChatMessages([]);
      setSharedFiles([]);
      setRaisedHands({});
      setIsHandRaised(false);
      await ensureMedia();
      await ensurePeer(trimmedRoomId);

      socket.emit('join-room', trimmedRoomId);
      setIncomingOffer(null);
      setShowJoinPrompt(false);
      setCallState('ready');
      setStatus(
        silent
          ? `Auto-joined room ${trimmedRoomId}. Waiting for participant...`
          : `Joined room ${trimmedRoomId}. Waiting for participant...`,
      );
    } catch (error) {
      setStatus(error.message || 'Failed to join room.');
    }
  };

  const startCall = async () => {
    const trimmedRoomId = (activeRoomRef.current || roomId).trim();
    if (!trimmedRoomId) {
      setStatus('Enter a room ID first.');
      return;
    }

    try {
      const socket = ensureSocket();
      activeRoomRef.current = trimmedRoomId;
      setRoomParticipants((prev) => (prev.length ? prev : [socket.id]));
      await ensurePeer(trimmedRoomId);
      socket.emit('join-room', trimmedRoomId);
      setIncomingOffer(null);
      setShowJoinPrompt(false);
      await createAndSendOffer(trimmedRoomId);
    } catch (error) {
      setStatus(error.message || 'Failed to start call.');
    }
  };

  const createRoomAndJoin = async () => {
    const nextRoomId = makeRoomId();
    setRoomId(nextRoomId);
    await joinRoom({
      roomOverride: nextRoomId,
    });
  };

  const cleanupCall = () => {
    try {
      if (socketRef.current && activeRoomRef.current) {
        socketRef.current.emit('leave-room', activeRoomRef.current);
      }
    } catch (_error) {
      // No-op: ending the call should continue even when signaling is unavailable.
    }

    resetPeerConnection();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    activeRoomRef.current = '';
    setRoomParticipants([]);
    setChatMessages([]);
    setChatInput('');
    setSharedFiles([]);
    setRaisedHands({});
    setIsHandRaised(false);
    setActivePanel('');
    setAudioEnabled(true);
    setVideoEnabled(true);
    setIsVideoFullscreen(false);
    setShowFloatingMore(false);
    setShowJoinPrompt(false);
    setCallState('idle');
    setStatus('Call ended.');
  };

  const startCallFromPrompt = async () => {
    setShowJoinPrompt(false);
    await startCall();
  };

  const participantLabels = roomParticipants.map((participantId) => ({
    id: participantId,
    label: formatParticipantLabel(participantId, mySocketId),
    raised: Boolean(raisedHands[participantId]),
  }));

  const raisedCount = Object.values(raisedHands).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Video Consultation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Secure live consultation with real-time audio, video, chat, and file
          sharing.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2">
          <input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            placeholder="Room ID"
          />

          <select
            value={videoQuality}
            onChange={changeVideoQuality}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            aria-label="Video quality"
          >
            {Object.entries(VIDEO_QUALITY_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={createRoomAndJoin}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            New + Join
          </button>

          <button
            type="button"
            onClick={() => joinRoom()}
            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            Join
          </button>

          <button
            type="button"
            onClick={startCall}
            className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start Call
          </button>

          <button
            type="button"
            onClick={copyRoom}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Copy ID
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Connection: {socketState === 'connected' ? 'Online' : 'Offline'}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Session: {callState}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            People: {roomParticipants.length}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Quality:{' '}
            {VIDEO_QUALITY_PRESETS[videoQuality]?.label || 'Balanced (540p)'}
          </span>
          <button
            type="button"
            onClick={cleanupCall}
            className="rounded-lg border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100"
          >
            End Call
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={shareSelectedFile}
        />

        <p className="mt-2 text-sm text-slate-600">{status}</p>
      </section>

      <section
        className={
          isVideoFullscreen
            ? 'fixed inset-0 z-[90] h-screen w-screen border-0 bg-slate-950/55 p-0 shadow-none backdrop-blur-[1px]'
            : 'rounded-2xl border border-slate-200 bg-slate-950 p-3 shadow-sm'
        }
      >
        <div
          className={
            isVideoFullscreen
              ? 'relative h-screen w-screen overflow-hidden bg-slate-950/30'
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

          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
            Remote
          </span>

          <button
            type="button"
            onClick={toggleVideoFullscreen}
            title={isVideoFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            aria-label={isVideoFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75"
          >
            {isVideoFullscreen ? <IconMinimize /> : <IconExpand />}
          </button>

          {isVideoFullscreen && (
            <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 rounded-2xl border border-white/35 bg-white/15 p-2.5 text-[11px] text-white shadow-2xl backdrop-blur-xl">
                <span className="rounded-full bg-white/20 px-2.5 py-1">
                  Room {activeRoomRef.current || roomId}
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-1">
                  {socketState === 'connected' ? 'Online' : 'Offline'}
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-1">
                  {roomParticipants.length} people
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
                  {VIDEO_QUALITY_PRESETS[videoQuality]?.label ||
                    'Balanced (540p)'}
                </span>
              </div>
            </div>
          )}

          <div
            className={[
              'absolute left-1/2 -translate-x-1/2 z-20 rounded-full border border-white/20 bg-black/65 px-2.5 py-2 shadow-lg backdrop-blur-sm',
              isVideoFullscreen ? 'bottom-14' : 'bottom-3',
            ].join(' ')}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAudio}
                title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                aria-label={
                  audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                {audioEnabled ? <IconMic /> : <IconMicOff />}
              </button>
              <button
                type="button"
                onClick={toggleVideo}
                title={videoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
                aria-label={videoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                {videoEnabled ? <IconCamera /> : <IconCameraOff />}
              </button>
              <button
                type="button"
                onClick={() => togglePanel('chat')}
                title="Chat"
                aria-label="Chat"
                className={[
                  'inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/25',
                  activePanel === 'chat' ? 'bg-blue-500' : 'bg-white/15',
                ].join(' ')}
              >
                <IconChat />
              </button>
              <button
                type="button"
                onClick={triggerFilePicker}
                title="Share File"
                aria-label="Share File"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <IconFile />
              </button>
              <button
                type="button"
                onClick={toggleRaiseHand}
                title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                aria-label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                className={[
                  'inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/25',
                  isHandRaised ? 'bg-amber-500' : 'bg-white/15',
                ].join(' ')}
              >
                <IconHand />
              </button>
              <button
                type="button"
                onClick={() => togglePanel('people')}
                title="People"
                aria-label="People"
                className={[
                  'inline-flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/25',
                  activePanel === 'people' ? 'bg-blue-500' : 'bg-white/15',
                ].join(' ')}
              >
                <IconPeople />
              </button>
              <button
                type="button"
                onClick={() => setShowFloatingMore((prev) => !prev)}
                title="More Controls"
                aria-label="More Controls"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                ref={moreToggleRef}
              >
                <IconMore />
              </button>
            </div>
          </div>

          {showFloatingMore && (
            <div
              className={[
                'absolute z-30 min-w-[170px] rounded-xl border border-white/20 bg-black/80 p-2 text-xs text-white shadow-xl backdrop-blur-sm',
                isVideoFullscreen
                  ? 'bottom-24 left-1/2 -translate-x-1/2'
                  : 'bottom-14 left-1/2 -translate-x-1/2',
              ].join(' ')}
              ref={moreMenuRef}
            >
              <button
                type="button"
                onClick={() => {
                  copyRoom();
                  setShowFloatingMore(false);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
              >
                Copy Room ID
              </button>
              <button
                type="button"
                onClick={() => {
                  resendInvite();
                  setShowFloatingMore(false);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
              >
                Re-send Invite
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerFilePicker();
                  setShowFloatingMore(false);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
              >
                Share a file
              </button>
              <button
                type="button"
                onClick={() => {
                  togglePanel('people');
                  setShowFloatingMore(false);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
              >
                Show people
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleVideoFullscreen();
                  setShowFloatingMore(false);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/15"
              >
                {isVideoFullscreen ? 'Exit Full Screen' : 'Go Full Screen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  cleanupCall();
                  setShowFloatingMore(false);
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
                isVideoFullscreen ? 'right-4 top-4' : 'right-3 top-12',
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
                      <p className="text-xs text-slate-300">No messages yet.</p>
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
                  <form onSubmit={sendChatMessage} className="mt-2 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
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
                      People in Room ({roomParticipants.length})
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
              isVideoFullscreen ? 'bottom-24' : 'bottom-3',
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

      {pendingOffer && (
        <div className="fixed inset-0 z-[120] h-screen w-screen bg-white/95 backdrop-blur-md">
          <div className="flex h-full w-full items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-semibold text-emerald-800">
                Incoming call request
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Room: {pendingOffer.roomId}
              </p>

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={acceptIncomingOffer}
                  title="Accept Offer"
                  aria-label="Accept Offer"
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: '#059669' }}
                >
                  <IconCheck />
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  onClick={declineIncomingOffer}
                  title="Decline Offer"
                  aria-label="Decline Offer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <IconClose />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showJoinPrompt && !pendingOffer && (
        <div className="fixed inset-0 z-[110] h-screen w-screen bg-white/92 backdrop-blur-sm">
          <div className="flex h-full w-full items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-semibold text-blue-800">
                Participant is ready to connect
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Room: {activeRoomRef.current || roomId}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={startCallFromPrompt}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <IconVideo />
                  <span>Start Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinPrompt(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <IconClose />
                  <span>Not now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
