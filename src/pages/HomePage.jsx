import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import HeroBanner from '../components/HeroBanner'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ProductGrid from '../components/ProductGrid'
import QuickShopModal from '../components/QuickShopModal'
import SectionReveal from '../components/SectionReveal'
import { categories } from '../config/categories'
import { useProducts } from '../hooks/useProducts'
import { getPrimaryImageUrl } from '../utils/imageHelpers'

export default function HomePage() {
  const { products, loading, error } = useProducts()
  const [selectedProduct, setSelectedProduct] = useState(null)

  const featuredProducts = useMemo(() => products.slice(0, 6), [products])
  const premiumCollection = useMemo(() => products.slice(0, 3), [products])

  return (
    <div className="space-y-14">
      <HeroBanner />

      <SectionReveal>
        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="section-kicker">Categories</p>
              <h2 className="section-title">Curated By Occasion</h2>
            </div>
            <Link to="/products" className="text-sm font-medium text-brand-maroon underline-offset-4 hover:underline">
              View all collections
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category}
                to={`/products?category=${encodeURIComponent(category)}`}
                className="group rounded-2xl border border-brand-gold/30 bg-white px-4 py-6 text-center shadow-soft transition hover:-translate-y-1 hover:bg-brand-maroon hover:text-brand-cream"
              >
                <p className="font-display text-xl">{category}</p>
              </Link>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.08}>
        <section className="rounded-3xl border border-brand-gold/30 bg-white/70 p-6 md:p-8">
          <p className="section-kicker">Premium Collection</p>
          <h2 className="section-title">Luxury Highlights</h2>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {premiumCollection.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="overflow-hidden rounded-2xl border border-brand-gold/20 bg-brand-cream transition hover:-translate-y-0.5"
                >
                  <img
                    src={getPrimaryImageUrl(
                      product.images,
                      'https://placehold.co/600x800/F8F1E5/5A0F1C?text=Saree'
                    )}
                    alt={product.name}
                    className="h-72 w-full bg-brand-cream/40 p-2 object-contain transition duration-500 hover:scale-[1.02]"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = 'https://placehold.co/600x800/F8F1E5/5A0F1C?text=Saree'
                    }}
                  />
                  <div className="p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-brand-maroon/70">{product.category}</p>
                    <h3 className="mt-1 font-display text-2xl text-brand-maroon">{product.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </SectionReveal>

      <SectionReveal delay={0.12}>
        <section className="space-y-5">
          <div>
            <p className="section-kicker">Featured Sarees</p>
            <h2 className="section-title">New and Trending Styles</h2>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <ProductGrid products={featuredProducts} onQuickShop={setSelectedProduct} />
          )}
        </section>
      </SectionReveal>

      <QuickShopModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
