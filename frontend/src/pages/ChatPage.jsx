import React, { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import { useChat } from '../context/ChatContext';

const ChatPage = () => {
  const { fetchRooms } = useChat();

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <ChatBox />
    </div>
  );
};

export default ChatPage; 