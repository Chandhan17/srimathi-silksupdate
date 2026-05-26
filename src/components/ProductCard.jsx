import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../utils/formatters'
import { getPrimaryImageUrl } from '../utils/imageHelpers'

const NEW_ARRIVAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000
const NEW_ARRIVAL_THRESHOLD_MS = Date.now() - NEW_ARRIVAL_WINDOW_MS

export default function ProductCard({ product, onQuickShop }) {
  const navigate = useNavigate()
  const primaryImage = getPrimaryImageUrl(
    product.images,
    'https://placehold.co/600x800/F8F1E5/5A0F1C?text=Saree'
  )

  const isNewArrival = useMemo(() => {
    if (!product?.createdAt?.seconds) return false
    const createdTime = product.createdAt.seconds * 1000
    return createdTime >= NEW_ARRIVAL_THRESHOLD_MS
  }, [product])

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/products/${product.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate(`/products/${product.id}`)
        }
      }}
      className={`group overflow-hidden rounded-3xl border border-brand-gold/30 bg-white shadow-elevated transition duration-500 hover:-translate-y-1 hover:shadow-royal focus:outline-none ${product.inStock === false ? 'opacity-60' : ''}`}
    >
      <div className="relative overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="h-72 w-full bg-brand-cream/40 p-2 object-contain transition duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = 'https://placehold.co/600x800/F8F1E5/5A0F1C?text=Saree'
          }}
        />
        {product.inStock === false && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
        {isNewArrival && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-maroon px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-cream">
            New Arrival
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        <p className="break-words text-xs uppercase tracking-[0.22em] text-brand-maroon/70">{product.category}</p>
        <h3 className="break-words font-display text-2xl leading-tight text-brand-maroon">{product.name}</h3>
        <p className="break-words text-sm text-brand-maroon/70">Fabric: {product.fabric}</p>
        <p className="text-lg font-semibold text-brand-gold">{formatINR(product.price)}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/products/${product.id}`}
            className="btn-outline flex-1 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            View Details
          </Link>
          <button
            onClick={(event) => {
              event.stopPropagation()
              onQuickShop(product)
            }}
            className="btn-gold flex-1"
            type="button"
          >
            Quick Shop
          </button>
        </div>
      </div>
    </article>
  )
}
