import { useState, useEffect } from 'react';
import { subscribeToTokenUpdates } from './api';
import { authService } from './authService';
import { Login } from './components/Login';
import { ChatLayout } from './components/Chat';
import './index.css';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState('User');

  useEffect(() => {
    // Initial sync with token from api.ts (which was restored from localStorage)
    subscribeToTokenUpdates((token) => {
      setAccessToken(token);
      setIsInitializing(false);
      
      if (token) {
        try {
          // Attempt to extract username from JWT
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUsername(payload.username || payload.sub || 'User');
        } catch (e) {
          console.error('Failed to parse token for username', e);
          setUsername('User');
        }
      }
    });
  }, []);

  if (isInitializing) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Initializing application...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {accessToken ? (
        <ChatLayout username={username} />
      ) : (
        <Login onLoginSuccess={(token) => setAccessToken(token)} />
      )}
    </div>
  );
}
