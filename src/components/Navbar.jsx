import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import clientConfig from '../config/clientConfig'
import { isAdminEmail } from '../config/adminConfig'

export default function Navbar() {
  const { user } = useAuth()
  const canAccessAdmin = isAdminEmail(user?.email)
  const mobileCategories = [
    { label: 'Pattu', value: 'Pattu' },
    { label: 'Fancy', value: 'Fancy' },
    { label: 'Bridal', value: 'Bridal Collection' },
    { label: 'Cotton', value: 'Cotton' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-brand-gold/20 bg-brand-maroon/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-brand-cream md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={clientConfig.logo}
            alt={clientConfig.brandName}
            className="h-12 w-12 rounded-lg border border-brand-gold/60 object-cover"
            loading="lazy"
          />
          <div>
            <h1 className="font-display text-xl tracking-wide">{clientConfig.brandName}</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold/80">
              Premium Saree Studio
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm md:gap-5">
          <NavLink className="nav-link" to="/products">
            Collections
          </NavLink>
          {mobileCategories.map((category) => (
            <NavLink
              key={category.label}
              className="nav-link md:hidden"
              to={`/products?category=${encodeURIComponent(category.value)}`}
            >
              {category.label}
            </NavLink>
          ))}
          {['Pattu', 'Bridal Collection', 'Fancy', 'Cotton'].map((category) => (
            <NavLink
              key={category}
              className="nav-link hidden md:inline"
              to={`/products?category=${encodeURIComponent(category)}`}
            >
              {category}
            </NavLink>
          ))}
          {canAccessAdmin && (
            <NavLink className="nav-link" to="/admin">
              Admin
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
