import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FiltersBar from '../components/FiltersBar'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ProductGrid from '../components/ProductGrid'
import QuickShopModal from '../components/QuickShopModal'
import SectionReveal from '../components/SectionReveal'
import { useProducts } from '../hooks/useProducts'

const initialFilters = {
  search: '',
  fabric: '',
  sizeLength: '',
  minPrice: '',
  maxPrice: '',
  onlyAvailable: false,
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFromParams = searchParams.get('category') || ''
  const [filters, setFilters] = useState(initialFilters)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const { products, loading, error } = useProducts()

  const sizeOptions = useMemo(
    () =>
      [...new Set(products.map((product) => String(product.sizeLength || '').trim()).filter(Boolean))].sort(),
    [products]
  )

  const filteredProducts = useMemo(() => {
    const minPrice = Number(filters.minPrice || 0)
    const maxPrice = Number(filters.maxPrice || Number.POSITIVE_INFINITY)
    const query = filters.search.trim().toLowerCase()

    return products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(query)
      const categoryMatch = !categoryFromParams || product.category === categoryFromParams
      const fabricMatch = !filters.fabric || product.fabric === filters.fabric
      const sizeMatch = !filters.sizeLength || product.sizeLength === filters.sizeLength
      const price = Number(product.price || 0)
      const priceMatch = price >= minPrice && price <= maxPrice
      const availableMatch = !filters.onlyAvailable || product.inStock !== false
      return nameMatch && categoryMatch && fabricMatch && sizeMatch && priceMatch && availableMatch
    })
  }, [products, filters, categoryFromParams])

  const updateFilter = (field, value) => {
    if (field === 'category') {
      const nextParams = new URLSearchParams(searchParams)
      if (value) {
        nextParams.set('category', value)
      } else {
        nextParams.delete('category')
      }
      setSearchParams(nextParams)
      return
    }
    setFilters((prev) => ({ ...prev, [field]: value }))
  }
  return (
    <SectionReveal>
      <FiltersBar
        filters={filters}
        onChange={updateFilter}
        onClear={() => setFilters(initialFilters)}
        sizeOptions={sizeOptions}
      />
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.onlyAvailable}
            onChange={e => updateFilter('onlyAvailable', e.target.checked)}
          />
          Show only available products
        </label>
      </div>
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-dashed border-red-400 bg-white/60 p-10 text-center text-red-700">
          {error}
        </div>
      ) : (
        <ProductGrid products={filteredProducts} onQuickShop={setSelectedProduct} />
      )}
      <QuickShopModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </SectionReveal>
  )
}
