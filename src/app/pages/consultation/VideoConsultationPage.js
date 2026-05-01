import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
  ConnectionState,
  ConnectionStateToast,
} from '@livekit/components-react';
import '@livekit/components-styles';

import { apiClient } from '../../lib/api';
import { getStoredUser } from '../../lib/session';

const ROOM_STORAGE_KEY = 'ogadoctor_livekit_room';
const NAME_STORAGE_KEY = 'ogadoctor_livekit_name';

function makeRoomId() {
  return `oga-${Math.random().toString(36).slice(2, 10)}`;
}

function getStoredValue(key, fallback = '') {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return window.localStorage.getItem(key) || fallback;
}

function getDefaultParticipantName() {
  const user = getStoredUser();
  if (user?.name && typeof user.name === 'string') {
    return user.name;
  }
  return 'OgaDoctor User';
}

export default function VideoConsultationPage() {
  const [roomId, setRoomId] = useState(() =>
    getStoredValue(ROOM_STORAGE_KEY, makeRoomId()),
  );
  const [participantName, setParticipantName] = useState(() =>
    getStoredValue(NAME_STORAGE_KEY, getDefaultParticipantName()),
  );

  const [activeRoom, setActiveRoom] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [token, setToken] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(
    'Ready. Join a room to start your consultation.',
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(ROOM_STORAGE_KEY, roomId);
  }, [roomId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(NAME_STORAGE_KEY, participantName);
  }, [participantName]);

  const createRoom = () => {
    const nextRoom = makeRoomId();
    setRoomId(nextRoom);
    setStatus(`Created room ${nextRoom}. Share it and tap Join.`);
    setError('');
  };

  const copyRoomId = async () => {
    const value = roomId.trim();
    if (!value) {
      setError('Room ID is required before copying.');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setStatus(`Room ID copied: ${value}`);
      setError('');
    } catch (_error) {
      setError('Unable to copy room ID. Please copy manually.');
    }
  };

  const joinRoom = async () => {
    const nextRoom = roomId.trim();
    const nextName = participantName.trim();

    if (!nextRoom) {
      setError('Room ID is required.');
      return;
    }

    if (!nextName) {
      setError('Participant name is required.');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const payload = await apiClient.createConsultationToken({
        roomName: nextRoom,
        participantName: nextName,
      });

      if (!payload?.token || !payload?.serverUrl) {
        throw new Error('Token service returned an invalid response.');
      }

      setToken(payload.token);
      setServerUrl(payload.serverUrl);
      setActiveRoom(payload.roomName || nextRoom);
      setStatus(`Connecting to room ${payload.roomName || nextRoom}...`);
    } catch (joinError) {
      setError(joinError.message || 'Unable to join consultation room.');
      setStatus('Join failed. Please check backend configuration and retry.');
    } finally {
      setIsJoining(false);
    }
  };

  const leaveRoom = () => {
    setToken('');
    setIsConnected(false);
    setStatus('Call ended. You can rejoin any room.');
    setError('');
  };

  const isInRoom = Boolean(token && serverUrl);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Video Consultation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Powered by LiveKit for reliable peer communication, conference calls,
          and room chat.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr_auto_auto_auto]">
          <input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
            placeholder="Room ID"
          />

          <input
            value={participantName}
            onChange={(event) => setParticipantName(event.target.value)}
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
            onClick={copyRoomId}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Copy ID
          </button>

          {!isInRoom ? (
            <button
              type="button"
              onClick={joinRoom}
              disabled={isJoining}
              className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          ) : (
            <button
              type="button"
              onClick={leaveRoom}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Leave Room
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Framework: LiveKit
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Room: {activeRoom || roomId || '-'}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-600">
            Status:{' '}
            {isConnected ? 'Connected' : isInRoom ? 'Connecting' : 'Idle'}
          </span>
          {isInRoom && (
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">
              <ConnectionState />
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-600">{status}</p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </section>

      {isInRoom && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect
            audio
            video
            data-lk-theme="default"
            className="h-[74vh] min-h-[540px]"
            onConnected={() => {
              setIsConnected(true);
              setStatus(`Connected to room ${activeRoom}.`);
            }}
            onDisconnected={() => {
              setIsConnected(false);
              setStatus('Disconnected from room.');
            }}
            onError={(liveKitError) => {
              setError(
                liveKitError?.message ||
                  'Live consultation encountered a connection issue.',
              );
            }}
          >
            <RoomAudioRenderer />
            <ConnectionStateToast />
            <VideoConference />
          </LiveKitRoom>
        </section>
      )}
    </div>
  );
}
