const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');
const User = require('./models/userModel');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Connect user to socket
  socket.on('setup', async (userData) => {
    try {
      if (userData && userData._id) {
        // Add user to online users map
        onlineUsers.set(userData._id.toString(), {
          socketId: socket.id,
          userId: userData._id.toString(),
          username: userData.username,
        });

        // Update user online status in database
        await User.findByIdAndUpdate(userData._id, { isOnline: true });

        // Create a room for the user
        socket.join(userData._id.toString());

        // Emit online users
        io.emit('onlineUsers', Array.from(onlineUsers.values()));
        console.log(`User online: ${userData.username}`);
      }
    } catch (error) {
      console.error(`Error setting up user: ${error.message}`);
    }
  });

  // Join a room
  socket.on('joinRoom', ({ roomId, user }) => {
    try {
      if (roomId && user) {
        console.log(`User ${user.username} joined room: ${roomId}`);
        socket.join(roomId);
        socket.emit('roomJoined', { roomId });

        // Send typing indicator to room
        socket.on('typing', ({ roomId, user }) => {
          socket.to(roomId).emit('typing', { roomId, user });
        });

        socket.on('stopTyping', ({ roomId }) => {
          socket.to(roomId).emit('stopTyping', { roomId });
        });
      }
    } catch (error) {
      console.error(`Error joining room: ${error.message}`);
    }
  });

  // Leave a room
  socket.on('leaveRoom', ({ roomId, user }) => {
    try {
      if (roomId && user) {
        console.log(`User ${user.username} left room: ${roomId}`);
        socket.leave(roomId);
      }
    } catch (error) {
      console.error(`Error leaving room: ${error.message}`);
    }
  });

  // Handle new message
  socket.on('newMessage', (message) => {
    try {
      const room = message.roomId;
      if (!room) return;

      // Send message to room
      socket.to(room).emit('messageReceived', message);
    } catch (error) {
      console.error(`Error sending message: ${error.message}`);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);

    // Find user by socket id
    for (const [userId, user] of onlineUsers.entries()) {
      if (user.socketId === socket.id) {
        // Remove from online users
        onlineUsers.delete(userId);

        // Update user online status in database
        await User.findByIdAndUpdate(userId, { isOnline: false });

        // Emit updated online users
        io.emit('onlineUsers', Array.from(onlineUsers.values()));
        console.log(`User offline: ${user.username}`);
        break;
      }
    }
  });

  // Handle explicit logout
  socket.on('logout', async (userId) => {
    try {
      if (userId) {
        // Remove from online users
        onlineUsers.delete(userId.toString());

        // Update user online status in database
        await User.findByIdAndUpdate(userId, { isOnline: false });

        // Emit updated online users
        io.emit('onlineUsers', Array.from(onlineUsers.values()));
        console.log(`User logged out: ${userId}`);
      }
    } catch (error) {
      console.error(`Error logging out user: ${error.message}`);
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 