import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || null;

  useEffect(() => {
    if (!SOCKET_URL) {
      console.log('Socket provider disabled: no VITE_SOCKET_URL configured.');
      return;
    }

    try {
      const socket = io(SOCKET_URL, {
        timeout: 5000,
        forceNew: false,
        reconnection: false,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected to', SOCKET_URL);
        setConnected(true);
      });

      socket.on('connect_error', (error) => {
        console.warn('Socket connection failed:', error.message);
        setConnected(false);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      const connectionTimeout = setTimeout(() => {
        if (!socket.connected) {
          console.log('Socket connection timeout - using Firebase backend without real-time socket updates');
        }
      }, 5000);

      return () => {
        clearTimeout(connectionTimeout);
        socket.disconnect();
      };
    } catch (error) {
      console.warn('Socket initialization failed:', error.message);
    }
  }, [SOCKET_URL]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
