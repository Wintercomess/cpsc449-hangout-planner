const { Server } = require('socket.io');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client joins a specific group room
    socket.on('group:join', (groupId) => {
      if (!groupId) return;
      socket.join(`group:${groupId}`);
      console.log(`Socket ${socket.id} joined group:${groupId}`);
    });

    // Client leaves a group room
    socket.on('group:leave', (groupId) => {
      if (!groupId) return;
      socket.leave(`group:${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function emitToGroup(groupId, event, payload) {
  if (!io || !groupId) return;
  io.to(`group:${groupId}`).emit(event, payload);
}

module.exports = { initSocket, emitToGroup };