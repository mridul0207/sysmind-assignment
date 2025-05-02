import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const MessageItem = ({ message, isOwnMessage }) => {
  // Format the timestamp
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`${
          isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'
        } rounded-lg px-3 py-2 max-w-[70%]`}
      >
        {!isOwnMessage && (
          <p className="text-xs font-bold mb-1">
            {message.sender.username}
          </p>
        )}
        <p>{message.content}</p>
        <p className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'} text-right`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

const ChatBox = () => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef();
  
  const { currentRoom, messages, sendMessage, isTyping, startTyping, stopTyping, loadingMessages } =
    useChat();
  const { user } = useAuth();
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus on input when currentRoom changes
  useEffect(() => {
    if (currentRoom) {
      inputRef.current?.focus();
    }
  }, [currentRoom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentRoom) return;
    
    try {
      await sendMessage(newMessage, currentRoom._id);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!currentRoom) return;

    // Send typing indicator
    startTyping(currentRoom._id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentRoom._id);
    }, 3000);
  };

  // Get chat name
  const getChatName = () => {
    if (!currentRoom) return '';
    
    if (currentRoom.isGroup) {
      return currentRoom.name;
    }
    
    return currentRoom.users.find((u) => u._id !== user?._id)?.username || 'Chat';
  };

  // Check if this is the typing user
  const isTypingUser = () => {
    if (!isTyping || !currentRoom) return false;
    
    return isTyping.roomId === currentRoom._id && isTyping.user._id !== user?._id;
  };

  return (
    <div className="flex flex-1 h-screen flex-col bg-gray-50">
      {currentRoom ? (
        <>
          <div className="flex p-4 bg-white border-b border-gray-200 items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3 text-sm font-medium">
              {getChatName().charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-medium">{getChatName()}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col justify-end items-stretch">
            {loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageItem
                    key={message._id}
                    message={message}
                    isOwnMessage={message.sender._id === user?._id}
                  />
                ))}
                {isTypingUser() && (
                  <div className="flex justify-start mb-2">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <p className="text-xs font-bold">
                        {isTyping?.user.username} is typing...
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleTyping}
                ref={inputRef}
              />
              <button
                className={`bg-blue-500 text-white px-4 py-2 rounded-r-md ${
                  !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
                type="submit"
                disabled={!newMessage.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-full flex-col">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to Chat App
          </h1>
          <p>Select a chat or start a new conversation</p>
        </div>
      )}
    </div>
  );
};

export default ChatBox; 