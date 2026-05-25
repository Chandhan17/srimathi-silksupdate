import { useCallback, useEffect, useState } from 'react'
import { fetchProducts } from '../services/productService'

export function useProducts(forceRefresh = false) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchProducts(forceRefresh)
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch products.')
    } finally {
      setLoading(false)
    }
  }, [forceRefresh])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return {
    products,
    loading,
    error,
    reload: loadProducts,
  }
}
