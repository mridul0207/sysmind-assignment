# SysMind Chat Application

## Project Overview
A real-time chat application built with MERN stack (MongoDB, Express, React, Node.js) featuring private and group messaging capabilities. The application allows users to register, login, create one-on-one or group chats, see online status of users, and communicate in real-time with typing indicators.

## Features
- User authentication (register, login, logout)
- Real-time messaging using Socket.IO
- One-on-one private chats
- Group chat functionality
- Online/offline user status
- Typing indicators
- Message history
- Responsive design

## Technologies Used
### Frontend
- React.js
- Socket.IO Client
- Axios for API requests
- React Router for navigation
- Context API for state management
- CSS for styling

### Backend
- Node.js with Express
- MongoDB with Mongoose ORM
- Socket.IO for real-time communication
- JWT for authentication
- Bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file in the backend directory with the following:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. Start the backend server:
   ```
   npm start
   ```
   For development with auto-reload:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

## Usage
1. Register a new account or login with existing credentials
2. View available chat rooms or create a new one-on-one or group chat
3. Send and receive messages in real-time
4. See when users are typing and who is online


## Local Development
For local development, both frontend and backend services use:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000 