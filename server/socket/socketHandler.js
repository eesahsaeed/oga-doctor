
function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined room user:${userId}`);
      }
    });

    socket.on("send-offer", (data) => {
      console.log(data);
      const roomId = data?.roomId;
      if (roomId) {
        io.to(roomId).emit("receive-offer", data);
        return;
      }
      io.emit("receive-offer", data);
    });

    socket.on("send-answer", (data) => {
      console.log(data);
      const roomId = data?.roomId;
      if (roomId) {
        io.to(roomId).emit("receive-answer", data);
        return;
      }
      io.emit("receive-answer", data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

export default setupSocket;
