import { useState, useMemo } from 'react'
import './App.css'
import { api, ApiError } from './api'

// Helper to decode Base64Url
const decodeBase64Url = (str: string) => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Helper to convert Base64Url to Hex
const base64ToHex = (str: string) => {
  try {
    const raw = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const hex = raw.charCodeAt(i).toString(16);
      result += (hex.length === 2 ? hex : '0' + hex);
    }
    return result.toUpperCase();
  } catch {
    return 'Invalid format';
  }
};

function App() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password123')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [secretKey, setSecretKey] = useState('')

  const jwtParts = useMemo(() => {
    if (!accessToken) return null;
    const parts = accessToken.split('.');
    if (parts.length !== 3) return null;
    
    return {
      header: decodeBase64Url(parts[0]),
      payload: decodeBase64Url(parts[1]),
      signature: parts[2],
      signatureHex: base64ToHex(parts[2])
    };
  }, [accessToken]);

  const handleLogin = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const data = await api.login(username, password)
      setAccessToken(data.access_token)
      setResponse('Login successful! Refresh token cookie set by server.')
    } catch (err) {
      if (err instanceof ApiError) {
        setResponse(`Login failed: ${err.message}\nStatus: ${err.status}\n\nFull response:\n${JSON.stringify(err.data, null, 2)}`)
      } else {
        setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchResource = async () => {
    if (!accessToken) {
      setResponse('No access token! Login first.')
      return
    }
    setLoading(true)
    setResponse(null)
    try {
      const data = await api.getResource(accessToken)
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      if (err instanceof ApiError) {
        setResponse(`Request failed: ${err.message}\nStatus: ${err.status}\n\nFull response:\n${JSON.stringify(err.data, null, 2)}`)
      } else {
        setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const data = await api.refresh()
      setAccessToken(data.access_token)
      setResponse('Token refreshed successfully via HttpOnly cookie!')
    } catch (err) {
      if (err instanceof ApiError) {
        setResponse(`Refresh failed: ${err.message}\nStatus: ${err.status}\n\nFull response:\n${JSON.stringify(err.data, null, 2)}`)
      } else {
        setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePing = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const data = await api.ping()
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setAccessToken(null)
    setResponse('Logged out (Local state cleared).')
  }

  return (
    <div className="container">
      <h1>JWT Authentication Test</h1>
      <div className="card">
        <div className="status-actions" style={{ marginBottom: '1rem' }}>
          <button onClick={handlePing} disabled={loading}>
            Ping Server
          </button>
        </div>

        {!accessToken ? (
          <div className="login-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        ) : (
          <div className="actions">
            <p>Logged in as: <strong>{username}</strong></p>
            <div className="button-group">
              <button onClick={fetchResource} disabled={loading}>
                Fetch Protected Resource
              </button>
              <button onClick={handleRefresh} disabled={loading}>
                Refresh Access Token
              </button>
              <button onClick={handleLogout}>Logout</button>
            </div>
            
            <div className="jwt-debugger">
              <h3>JWT Debugger (Access Token)</h3>
              <p className="debug-intro">
                The <strong>Access Token</strong> is short-lived and sent in the <code>Authorization: Bearer</code> header.
              </p>
              
              <div className="debugger-section">
                <label><strong>Encoded Token:</strong></label>
                <textarea readOnly value={accessToken} rows={3} className="token-textarea" />
              </div>

              {/* <div className="debugger-section">
                <label><strong>Encoded Token:</strong></label>
                <textarea readOnly value={refreshtoken} rows={3} className="token-textarea" />
              </div> */}

              {jwtParts && (
                <>
                  <div className="debugger-grid">
                    <div className="debugger-section">
                      <label><strong>Header (Algorithm & Type)</strong></label>
                      <pre className="json-block">{JSON.stringify(jwtParts.header, null, 2)}</pre>
                    </div>
                    
                    <div className="debugger-section">
                      <label><strong>Payload (Claims)</strong></label>
                      <pre className="json-block">{JSON.stringify(jwtParts.payload, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="debugger-section">
                    <label><strong>Signature (Hex Output)</strong></label>
                    <div className="signature-input-group">
                      <input
                        type="password"
                        placeholder="Enter Secret Key to see raw signature hex"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        className="secret-input"
                      />
                    </div>
                    {secretKey && (
                      <div className="signature-display">
                        <code className="hex-block">{jwtParts.signatureHex}</code>
                        <p className="verification-hint">
                          <small>Note: Signature bytes are shown in hex. In a real app, the backend verifies this using the secret key.</small>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {response && (
          <div className="response">
            <strong>Response:</strong>
            <pre>{response}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
