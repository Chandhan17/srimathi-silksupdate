import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import clientConfig from './config/clientConfig'
import AdminLoginPage from './pages/AdminLoginPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import ProductsPage from './pages/ProductsPage'

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrders'))

function StoreLayout({ children }) {
  return (
    <div className="min-h-screen bg-brocade text-brand-maroon">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
      <Footer />
    </div>
  )
}

function hexToRgbTriplet(hex) {
  const clean = String(hex || '').replace('#', '')
  if (clean.length !== 6) return null
  const intVal = Number.parseInt(clean, 16)
  if (Number.isNaN(intVal)) return null
  const r = (intVal >> 16) & 255
  const g = (intVal >> 8) & 255
  const b = intVal & 255
  return `${r} ${g} ${b}`
}

function App() {
  useEffect(() => {
    const gold = hexToRgbTriplet(clientConfig.theme.gold)
    const maroon = hexToRgbTriplet(clientConfig.theme.maroon)
    const cream = hexToRgbTriplet(clientConfig.theme.cream)

    if (gold) document.documentElement.style.setProperty('--brand-gold-rgb', gold)
    if (maroon) document.documentElement.style.setProperty('--brand-maroon-rgb', maroon)
    if (cream) document.documentElement.style.setProperty('--brand-cream-rgb', cream)

    document.title = clientConfig.brandName
    const favicon = document.querySelector("link[rel='icon']")
    if (favicon) {
      favicon.setAttribute('href', clientConfig.logo)
    }
  }, [])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <StoreLayout>
            <HomePage />
          </StoreLayout>
        }
      />
      <Route
        path="/products"
        element={
          <StoreLayout>
            <ProductsPage />
          </StoreLayout>
        }
      />
      <Route
        path="/products/:id"
        element={
          <StoreLayout>
            <ProductDetailsPage />
          </StoreLayout>
        }
      />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <StoreLayout>
              <Suspense fallback={<div className="p-10 text-center text-brand-maroon">Loading admin panel...</div>}>
                <AdminDashboardPage />
              </Suspense>
            </StoreLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute>
            <StoreLayout>
              <Suspense fallback={<div className="p-10 text-center text-brand-maroon">Loading orders...</div>}>
                <AdminOrdersPage />
              </Suspense>
            </StoreLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route
        path="*"
        element={
          <StoreLayout>
            <NotFoundPage />
          </StoreLayout>
        }
      />
    </Routes>
  )
}

export default App
