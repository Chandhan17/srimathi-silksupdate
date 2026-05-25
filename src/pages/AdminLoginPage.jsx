import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdminEmail } from '../config/adminConfig'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginAdmin, logoutAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const routeMessage = location.state?.message

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      setLoading(true)
      const user = await loginAdmin(email, password)

      if (!isAdminEmail(user?.email)) {
        await logoutAdmin()
        setError('Unauthorized access')
        return
      }

      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    } catch {
      setError('Invalid admin credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-brand-gold/30 bg-white p-6 shadow-elevated">
      <h1 className="font-display text-4xl text-brand-maroon">Admin Login</h1>
      <p className="mt-1 text-sm text-brand-maroon/70">Sign in to manage products and collections.</p>

      {routeMessage && <p className="mt-3 text-sm text-red-700">{routeMessage}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          className="input-field"
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button className="btn-gold w-full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
