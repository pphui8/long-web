import { useState } from 'react'
import './App.css'
import { api, ApiError } from './api'

function App() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password123')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const data = await api.login(username, password)
      setAccessToken(data.access_token)
      setRefreshToken(data.refresh_token)
      setResponse('Login successful!')
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
    if (!refreshToken) {
      setResponse('No refresh token! Login first.')
      return
    }
    setLoading(true)
    setResponse(null)
    try {
      const data = await api.refresh(refreshToken)
      setAccessToken(data.access_token)
      setResponse('Token refreshed successfully!')
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
    setRefreshToken(null)
    setResponse('Logged out.')
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
                Refresh Token
              </button>
              <button onClick={handleLogout}>Logout</button>
            </div>
            <div className="token-info">
              <div className="token-field">
                <label><strong>Access Token:</strong></label>
                <textarea readOnly value={accessToken || ''} rows={3} />
              </div>
              <div className="token-field">
                <label><strong>Refresh Token:</strong></label>
                <textarea readOnly value={refreshToken || ''} rows={3} />
              </div>
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
