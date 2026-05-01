function listRoomParticipants(io, roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []);
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    function relayToTargetOrRoom(eventName, data = {}) {
      const roomId = data?.roomId;
      const targetSocketId = data?.to;
      const payload = {
        ...data,
        from: socket.id,
        at: new Date().toISOString(),
      };

      if (targetSocketId) {
        io.to(targetSocketId).emit(eventName, payload);
        return;
      }

      if (roomId) {
        socket.to(roomId).emit(eventName, payload);
        return;
      }

      socket.broadcast.emit(eventName, payload);
    }

    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined room user:${userId}`);
      }
    });

    socket.on('join-room', (roomId) => {
      try {
        if (!roomId) {
          return;
        }

        socket.join(roomId);
        const participants = listRoomParticipants(io, roomId);

        socket.emit('room-joined', {
          roomId,
          participantCount: participants.length,
          participants,
        });

        io.to(roomId).emit('room-state', {
          roomId,
          participantCount: participants.length,
          participants,
        });

        socket.to(roomId).emit('participant-joined', {
          roomId,
          socketId: socket.id,
          participantCount: participants.length,
        });

        console.log(`Socket ${socket.id} joined room ${roomId}`);
      } catch (error) {
        console.error('join-room error:', error);
        socket.emit('room-error', {
          message: 'Unable to join room. Please retry.',
        });
      }
    });

    socket.on('leave-room', (roomId) => {
      try {
        if (!roomId) {
          return;
        }

        socket.leave(roomId);
        const participants = listRoomParticipants(io, roomId);

        socket.to(roomId).emit('participant-left', {
          roomId,
          socketId: socket.id,
          participantCount: participants.length,
        });

        io.to(roomId).emit('room-state', {
          roomId,
          participantCount: participants.length,
          participants,
        });
      } catch (error) {
        console.error('leave-room error:', error);
      }
    });

    socket.on('send-offer', (data) => {
      try {
        relayToTargetOrRoom('receive-offer', data);
      } catch (error) {
        console.error('send-offer error:', error);
      }
    });

    socket.on('send-answer', (data) => {
      try {
        relayToTargetOrRoom('receive-answer', data);
      } catch (error) {
        console.error('send-answer error:', error);
      }
    });

    socket.on('send-ice-candidate', (data) => {
      try {
        relayToTargetOrRoom('receive-ice-candidate', data);
      } catch (error) {
        console.error('send-ice-candidate error:', error);
      }
    });

    socket.on('decline-offer', (data) => {
      try {
        relayToTargetOrRoom('offer-declined', data);
      } catch (error) {
        console.error('decline-offer error:', error);
      }
    });

    socket.on('send-chat-message', (data) => {
      try {
        relayToTargetOrRoom('receive-chat-message', data);
      } catch (error) {
        console.error('send-chat-message error:', error);
      }
    });

    socket.on('send-file-share', (data) => {
      try {
        relayToTargetOrRoom('receive-file-share', data);
      } catch (error) {
        console.error('send-file-share error:', error);
      }
    });

    socket.on('send-raise-hand', (data) => {
      try {
        relayToTargetOrRoom('receive-raise-hand', data);
      } catch (error) {
        console.error('send-raise-hand error:', error);
      }
    });

    socket.on('disconnecting', () => {
      try {
        socket.rooms.forEach((roomId) => {
          if (roomId === socket.id) {
            return;
          }

          const currentParticipants = listRoomParticipants(io, roomId);
          socket.to(roomId).emit('participant-left', {
            roomId,
            socketId: socket.id,
            participantCount: Math.max(currentParticipants.length - 1, 0),
          });
        });
      } catch (error) {
        console.error('disconnecting error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export default setupSocket;
