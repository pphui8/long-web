import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api, { subscribeToTokenUpdates } from './api';
import authService from './authService';
import './index.css';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
}

export default function App() {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pingData, setPingData] = useState<unknown>(null);
  const [resourceData, setResourceData] = useState<unknown>(null);

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [entry, ...prev]);
  }, []);

  const handleRefresh = useCallback(async () => {
    setTimeout(() => addLog('Attempting /refresh via AuthService...'), 0);
    try {
      const token = await authService.refresh();
      if (token) {
        addLog('Refresh Success! New access token received.', 'success');
      }
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error || err.message;
        if (err.response?.status === 401) {
          addLog('Session expired or not found. Please login.', 'info');
        } else {
          addLog(`Refresh Error: ${message}`, 'error');
        }
      } else if (err instanceof Error) {
        message = err.message;
        addLog(`Refresh Error: ${message}`, 'error');
      }
    }
  }, [addLog]);

  // Sync React state with api.ts token
  useEffect(() => {
    subscribeToTokenUpdates((token) => {
      setAccessTokenState(token);
    });
  }, []);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return { error: 'Failed to parse JWT' };
    }
  };

  const handlePing = async () => {
    addLog('Testing /ping...');
    try {
      const res = await api.get('/ping');
      setPingData(res.data);
      addLog(`Ping Success: ${JSON.stringify(res.data)}`, 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Ping Error: ${errorMessage}`, 'error');
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addLog(`Attempting login for ${username} via AuthService...`);
    try {
      const token = await authService.login(username, password);
      if (token) {
        addLog('Login Success! Access token received.', 'success');
      } else {
        addLog('Login response missing access_token', 'error');
      }
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      addLog(`Login Error: ${message}`, 'error');
    }
  };

  const handleFetchResource = async () => {
    addLog('Attempting /resource access...');
    try {
      const res = await api.get('/resource');
      setResourceData(res.data);
      addLog('Resource fetch success!', 'success');
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      addLog(`Resource Error: ${message}`, 'error');
    }
  };

  const decodedToken = accessToken ? parseJwt(accessToken) : null;

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>JWT Auth Test Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Actions Section */}
        <div>
          <section style={sectionStyle}>
            <h2>1. Connectivity</h2>
            <button onClick={handlePing}>Ping /api/ping</button>
            {pingData != null && <pre style={jsonStyle}>{JSON.stringify(pingData, null, 2)}</pre>}
          </section>

          <section style={sectionStyle}>
            <h2>2. Login</h2>
            <form onSubmit={handleLogin}>
              <div>
                <label>Username: </label>
                <input value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div style={{ marginTop: '10px' }}>
                <label>Password: </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" style={{ marginTop: '10px' }}>Login</button>
            </form>
          </section>

          <section style={sectionStyle}>
            <h2>3. Token Actions</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleRefresh} style={{ backgroundColor: '#2ecc71' }}>Refresh Token</button>
              <button onClick={() => authService.logout()} style={{ backgroundColor: '#e74c3c' }}>Clear Access Token</button>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2>4. Protected Resource</h2>
            <button onClick={handleFetchResource} disabled={!accessToken}>Fetch /api/resource</button>
            {resourceData != null && <pre style={jsonStyle}>{JSON.stringify(resourceData, null, 2)}</pre>}
          </section>
        </div>

        {/* Data/Logs Section */}
        <div>
          <section style={sectionStyle}>
            <h2>Access Token (State)</h2>
            {accessToken ? (
              <>
                <div style={{ wordBreak: 'break-all', fontSize: '0.8rem', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                  {accessToken}
                </div>
                <h3>Decoded Payload:</h3>
                <pre style={jsonStyle}>{JSON.stringify(decodedToken, null, 2)}</pre>
              </>
            ) : (
              <p>No token in memory.</p>
            )}
          </section>

          <section style={sectionStyle}>
            <h2>Logs</h2>
            <div style={{ height: '300px', overflowY: 'auto', background: '#2c3e50', color: '#ecf0f1', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '5px', color: log.type === 'error' ? '#ff7675' : log.type === 'success' ? '#55efc4' : '#ecf0f1' }}>
                  [{log.timestamp}] {log.message}
                </div>
              ))}
              {logs.length === 0 && <div>No logs yet...</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#eef2f3',
  padding: '15px',
  borderRadius: '8px',
  marginBottom: '20px',
  border: '1px solid #dcdde1'
};

const jsonStyle: React.CSSProperties = {
  background: '#fff',
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  marginTop: '10px',
  fontSize: '0.85rem',
  overflowX: 'auto'
};
