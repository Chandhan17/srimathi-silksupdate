import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdminEmail } from '../config/adminConfig'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { user, authLoading } = useAuth()

  if (authLoading) {
    return <div className="p-10 text-center text-brand-maroon">Checking admin access...</div>
  }

  if (!user || !isAdminEmail(user.email)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          unauthorized: Boolean(user),
          message: 'Unauthorized access',
        }}
      />
    )
  }

  return children
}
