import { useState } from 'react'
import './App.css'

function App() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password123')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:9001'

  const handleLogin = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        setResponse(`Response:\n${text}`)
        return
      }

      if (res.ok) {
        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)
        setResponse('Login successful!')
      } else {
        setResponse(`Login failed: ${data.error || 'Unknown error'}\n\nFull response:\n${text}`)
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
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
      const res = await fetch(`${apiUrl}/resource`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        setResponse(JSON.stringify(data, null, 2))
      } catch (e) {
        setResponse(text)
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
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
      const res = await fetch(`${apiUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        setResponse(`Response (not JSON):\n${text}`)
        return
      }

      if (res.ok) {
        setAccessToken(data.access_token)
        setResponse('Token refreshed successfully!')
      } else {
        setResponse(`Refresh failed: ${data.error || 'Unknown error'}\n\nFull response:\n${text}`)
      }
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
