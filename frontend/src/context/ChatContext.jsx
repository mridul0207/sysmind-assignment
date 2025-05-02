import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io('https://sysmind-assignment-backend.vercel.app');
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Set up the user in socket
    socket.emit('setup', user);

    // Online users event
    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Message received event
    socket.on('messageReceived', (newMessage) => {
      if (currentRoom && currentRoom._id === newMessage.roomId) {
        setMessages((prev) => [...prev, newMessage]);
      }
      
      // Update the rooms list to show latest message
      fetchRooms();
    });

    // Typing indicator events
    socket.on('typing', (data) => {
      setIsTyping(data);
    });

    socket.on('stopTyping', () => {
      setIsTyping(null);
    });

    return () => {
      socket.off('onlineUsers');
      socket.off('messageReceived');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [socket, user, currentRoom]);

  // Join room when currentRoom changes
  useEffect(() => {
    if (socket && currentRoom && user) {
      // Leave previous room if any
      if (currentRoom) {
        socket.emit('leaveRoom', { roomId: currentRoom._id, user });
      }

      // Join new room
      socket.emit('joinRoom', { roomId: currentRoom._id, user });
      
      // Fetch messages for the new room
      fetchMessages(currentRoom._id);
    }
  }, [currentRoom, socket, user]);

  // Fetch all rooms for current user
  const fetchRooms = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingRooms(true);
      const { data } = await axios.get('https://sysmind-assignment-backend.vercel.app/api/rooms');
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  }, [user]);

  // Fetch messages for a room
  const fetchMessages = async (roomId) => {
    if (!user) return;
    
    try {
      setLoadingMessages(true);
      const { data } = await axios.get(`https://sysmind-assignment-backend.vercel.app/api/messages/${roomId}`);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send a message
  const sendMessage = async (content, roomId) => {
    if (!user || !socket) return;
    
    try {
      const { data } = await axios.post('https://sysmind-assignment-backend.vercel.app/api/messages', {
        content,
        roomId,
      });

      // Emit message to socket
      socket.emit('newMessage', data);
      
      // Add to messages list
      setMessages((prev) => [...prev, data]);
      
      // Stop typing indicator
      stopTyping(roomId);
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Create or access a one-to-one chat room
  const createRoom = async (userId) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data } = await axios.post('https://sysmind-assignment-backend.vercel.app/api/rooms', { userId });
      
      // Update rooms list
      await fetchRooms();
      
      return data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  };

  // Create a group chat room
  const createGroupRoom = async (name, users) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data } = await axios.post('https://sysmind-assignment-backend.vercel.app/api/rooms/group', {
        name,
        users: JSON.stringify(users),
      });
      
      // Update rooms list
      await fetchRooms();
      
      return data;
    } catch (error) {
      console.error('Error creating group room:', error);
      throw error;
    }
  };

  // Typing indicators
  const startTyping = useCallback((roomId) => {
    if (socket && user) {
      socket.emit('typing', { roomId, user: { _id: user._id, username: user.username } });
    }
  }, [socket, user]);

  const stopTyping = useCallback((roomId) => {
    if (socket) {
      socket.emit('stopTyping', { roomId });
    }
  }, [socket]);

  // Load rooms on initial mount
  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user, fetchRooms]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        rooms,
        currentRoom,
        messages,
        onlineUsers,
        isTyping,
        loadingRooms,
        loadingMessages,
        fetchRooms,
        setCurrentRoom,
        fetchMessages,
        sendMessage,
        startTyping,
        stopTyping,
        createRoom,
        createGroupRoom,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}; 