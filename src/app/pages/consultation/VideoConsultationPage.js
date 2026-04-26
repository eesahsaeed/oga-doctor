import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const RTC_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function makeRoomId() {
  return `oga-${Math.random().toString(36).slice(2, 10)}`;
}

export default function VideoConsultationPage() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef('');

  const [roomId, setRoomId] = useState(makeRoomId());
  const [socketState, setSocketState] = useState('disconnected');
  const [callState, setCallState] = useState('idle');
  const [status, setStatus] = useState('Allow camera and mic access to start.');

  useEffect(() => {
    return () => {
      cleanupCall();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const ensureMedia = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera is not supported in this browser.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const ensureSocket = () => {
    if (socketRef.current) return socketRef.current;

    const baseUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(baseUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setSocketState('connected');
      setStatus('Signaling connected. You can create or join a room.');
    });

    socket.on('disconnect', () => {
      setSocketState('disconnected');
      setStatus('Signaling disconnected.');
    });

    socket.on('receive-offer', async (data) => {
      if (!data?.offer || !data?.roomId) return;
      if (activeRoomRef.current && data.roomId !== activeRoomRef.current)
        return;

      try {
        await ensureMedia();
        const pc = await ensurePeer(data.roomId);
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('send-answer', {
          roomId: data.roomId,
          answer,
        });

        setCallState('in-call');
        setStatus(`Connected in room ${data.roomId}.`);
      } catch (error) {
        setStatus(error.message || 'Failed to answer incoming call.');
      }
    });

    socket.on('receive-answer', async (data) => {
      if (!data?.answer || !peerRef.current) return;

      try {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );
        setCallState('in-call');
        setStatus('Peer connected.');
      } catch (error) {
        setStatus(error.message || 'Failed to finalize connection.');
      }
    });

    socket.on('receive-ice-candidate', async (data) => {
      if (!data?.candidate || !peerRef.current) return;
      try {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
      } catch (_error) {
        // Keep trying connection; dropped candidates are non-fatal.
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
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit('send-ice-candidate', {
        roomId: nextRoomId,
        candidate: event.candidate,
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

  const joinRoom = async () => {
    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) {
      setStatus('Enter a room ID first.');
      return;
    }

    try {
      const socket = ensureSocket();
      await ensureMedia();
      await ensurePeer(trimmedRoomId);

      socket.emit('join-room', trimmedRoomId);
      activeRoomRef.current = trimmedRoomId;
      setCallState('ready');
      setStatus(`Joined room ${trimmedRoomId}. Waiting for call offer...`);
    } catch (error) {
      setStatus(error.message || 'Failed to join room.');
    }
  };

  const startCall = async () => {
    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) {
      setStatus('Enter a room ID first.');
      return;
    }

    try {
      const socket = ensureSocket();
      const peer = await ensurePeer(trimmedRoomId);
      socket.emit('join-room', trimmedRoomId);
      activeRoomRef.current = trimmedRoomId;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('send-offer', {
        roomId: trimmedRoomId,
        offer,
      });

      setCallState('calling');
      setStatus(`Calling room ${trimmedRoomId}...`);
    } catch (error) {
      setStatus(error.message || 'Failed to start call.');
    }
  };

  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    activeRoomRef.current = '';
    setCallState('idle');
    setStatus('Call ended.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Video Consultation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Live WebRTC consultation with socket signaling through your backend.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
          <input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            placeholder="Room ID"
          />

          <button
            type="button"
            onClick={() => setRoomId(makeRoomId())}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            New Room
          </button>

          <button
            type="button"
            onClick={joinRoom}
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
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Signaling: {socketState}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Call: {callState}
          </span>
          <button
            type="button"
            onClick={cleanupCall}
            className="rounded-lg border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100"
          >
            End Call
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600">{status}</p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Local Stream
          </h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-xl bg-slate-900 aspect-video object-cover"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Remote Stream
          </h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-xl bg-slate-900 aspect-video object-cover"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Use HTTPS in production and allow camera/mic permissions in your
        browser. For best results, both participants should use the same room
        ID.
      </section>
    </div>
  );
}
