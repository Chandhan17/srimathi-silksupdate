import ProductCard from './ProductCard'

export default function ProductGrid({ products, onQuickShop }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-gold/40 bg-white/60 p-10 text-center text-brand-maroon/70">
        No sarees match the selected filters.
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onQuickShop={onQuickShop} />
      ))}
    </div>
  )
}
