import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const UserListItem = ({ user, onClick }) => {
  return (
    <div className="user-item" onClick={onClick}>
      <div className="user-avatar">{user.username.charAt(0)}</div>
      <div className="user-name">{user.username}</div>
      {user.isOnline && <div className="online-badge">Online</div>}
    </div>
  );
};

const RoomListItem = ({ room, onClick, isActive }) => {
  const { user } = useAuth();
  
  // Get the name for a one-on-one chat
  const getChatName = () => {
    if (room.isGroup) {
      return room.name;
    }
    return room.users.find((u) => u._id !== user?._id)?.username || 'Chat';
  };

  // Format the timestamp
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`room-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="room-header">
        <h3>{getChatName()}</h3>
        {room.latestMessage && (
          <span className="timestamp">{formatTime(room.latestMessage.createdAt)}</span>
        )}
      </div>
      {room.latestMessage && (
        <p className="latest-message">
          <span className={room.latestMessage.sender._id === user?._id ? '' : 'bold'}>
            {room.latestMessage.sender.username === user?.username
              ? 'You: '
              : `${room.latestMessage.sender.username}: `}
          </span>
          {room.latestMessage.content}
        </p>
      )}
    </div>
  );
};

const Sidebar = () => {
  const [showModal, setShowModal] = useState(false);
  const [groupChatName, setGroupChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { rooms, onlineUsers, currentRoom, setCurrentRoom, createRoom, createGroupRoom } = useChat();
  const { user, logout } = useAuth();

  const handleCreateChat = async (userId) => {
    try {
      const newRoom = await createRoom(userId);
      setCurrentRoom(newRoom);
    } catch (error) {
      alert('Failed to create chat: ' + error.message);
    }
  };

  const handleCreateGroupChat = async () => {
    if (!groupChatName) {
      alert('Please enter a group name');
      return;
    }

    if (selectedUsers.length < 2) {
      alert('Please select at least 2 users');
      return;
    }

    try {
      const newGroupRoom = await createGroupRoom(groupChatName, selectedUsers);
      setCurrentRoom(newGroupRoom);
      setShowModal(false);
      setGroupChatName('');
      setSelectedUsers([]);
    } catch (error) {
      alert('Failed to create group chat: ' + error.message);
    }
  };

  // Filter online users that are not the current user
  const filteredOnlineUsers = onlineUsers.filter(
    (onlineUser) => onlineUser.userId !== user?._id
  );

  // Get all users from rooms for the group chat creation
  const allUsers = rooms.reduce((acc, room) => {
    room.users.forEach((roomUser) => {
      if (roomUser._id !== user?._id && !acc.some((u) => u._id === roomUser._id)) {
        acc.push(roomUser);
      }
    });
    return acc;
  }, []);

  // Filter users by search term
  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedUsers(selectedOptions);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <button className="add-button" onClick={() => setShowModal(true)}>+</button>
      </div>

      <div className="rooms-list">
        {rooms.map((room) => (
          <RoomListItem
            key={room._id}
            room={room}
            isActive={currentRoom?._id === room._id}
            onClick={() => setCurrentRoom(room)}
          />
        ))}
      </div>

      <div className="divider"></div>

      <h2>Online Users</h2>
      <div className="users-list">
        {filteredOnlineUsers.length > 0 ? (
          filteredOnlineUsers.map((onlineUser) => (
            <UserListItem
              key={onlineUser.userId}
              user={{
                _id: onlineUser.userId,
                username: onlineUser.username,
                isOnline: true,
              }}
              onClick={() => handleCreateChat(onlineUser.userId)}
            />
          ))
        ) : (
          <p className="no-users">No users online</p>
        )}
      </div>

      <button className="logout-button" onClick={() => logout()}>
        Logout
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create Group Chat</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  value={groupChatName}
                  onChange={(e) => setGroupChatName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Search Users</label>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  multiple
                  className="users-select"
                  value={selectedUsers}
                  onChange={handleUserSelect}
                >
                  {filteredUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              <p className="selected-count">
                Selected: {selectedUsers.length} users
              </p>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="create-button" onClick={handleCreateGroupChat}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 