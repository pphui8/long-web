import { useState } from 'react'
import './App.css'

function App() {
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pingBackend = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://llm.pphui8.com/api'
      const res = await fetch(`${apiUrl}/ping`)
      const data = await res.text()
      setResponse(`Success: ${data}`)
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Frontend</h1>
      <div className="card">
        <button onClick={pingBackend} disabled={loading}>
          {loading ? 'Pinging...' : 'Ping Backend (llm.pphui8.com/api)'}
        </button>
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
