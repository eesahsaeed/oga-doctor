function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined room user:${userId}`);
      }
    });

    socket.on('join-room', (roomId) => {
      if (!roomId) {
        return;
      }
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('send-offer', (data) => {
      const roomId = data?.roomId;
      if (roomId) {
        socket.to(roomId).emit('receive-offer', data);
        return;
      }
      socket.broadcast.emit('receive-offer', data);
    });

    socket.on('send-answer', (data) => {
      const roomId = data?.roomId;
      if (roomId) {
        socket.to(roomId).emit('receive-answer', data);
        return;
      }
      socket.broadcast.emit('receive-answer', data);
    });

    socket.on('send-ice-candidate', (data) => {
      const roomId = data?.roomId;
      if (roomId) {
        socket.to(roomId).emit('receive-ice-candidate', data);
        return;
      }
      socket.broadcast.emit('receive-ice-candidate', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export default setupSocket;
