import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <p className="section-kicker">404</p>
      <h1 className="section-title">This silk trail ends here</h1>
      <p className="mt-3 text-brand-maroon/70">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-gold mt-6 inline-flex">
        Back to Home
      </Link>
    </div>
  )
}
