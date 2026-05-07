import { useState, useEffect } from 'react';
import { subscribeToTokenUpdates } from './api';
import { Login } from './components/Login';
import { ChatLayout } from './components/Chat';
import './index.css';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState('Admin User');

  useEffect(() => {
    // Initial sync with token from api.ts (which might have been restored or set elsewhere)
    subscribeToTokenUpdates((token) => {
      setAccessToken(token);
      setIsInitializing(false);
      // In a real app, you might decode the token here to get the actual username
      if (token) {
        setUsername('Admin User'); // Placeholder
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
