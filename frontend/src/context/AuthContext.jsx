import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for user in localStorage on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Set up axios defaults when user changes
  useEffect(() => {
    if (user && user.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.post('https://sysmind-assignment-backend.vercel.app/api/users/login', {
        email,
        password,
      });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.post('https://sysmind-assignment-backend.vercel.app/api/users', {
        username,
        email,
        password,
      });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      if (user && user._id) {
        await axios.post('https://sysmind-assignment-backend.vercel.app/api/users/logout');
      }
      setUser(null);
      localStorage.removeItem('user');
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 