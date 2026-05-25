import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { categories, getFabricsForCategory } from '../config/categories'
import {
  createProduct,
  editProduct,
  fetchProducts,
  removeProduct,
} from '../services/productService'
import { uploadMultipleImages, uploadSingleImage } from '../services/telegramUploadService'
import { deleteTelegramMedia } from '../services/telegramMediaService'
import { formatINR } from '../utils/formatters'
import { getImageUrl, getPrimaryImageUrl, normalizeImages } from '../utils/imageHelpers'
import { X } from 'lucide-react'

const DEFAULT_DESCRIPTION = `Length: 5.5 mtr
Blouse: 0.8 mtr`

const initialForm = {
  name: '',
  price: '',
  category: categories[0],
  customCategory: '',
  description: DEFAULT_DESCRIPTION,
  fabric: getFabricsForCategory(categories[0])[0] || '',
  customFabric: '',
  sizeLength: '',
  sizeChartText: '',
  sizeChartImage: '',
  inStock: true,
}

export default function AdminDashboardPage() {
  const { logoutAdmin } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [products, setProducts] = useState([])
  const [editingId, setEditingId] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [warning, setWarning] = useState('')
  const [existingImages, setExistingImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [sizeChartFile, setSizeChartFile] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoadingProducts(true)
        setError('')
        const data = await fetchProducts(true)
        setProducts(data)
      } catch (err) {
        setError(err.message || 'Failed to load products.')
      } finally {
        setLoadingProducts(false)
      }
    }

    load()
  }, [])

  const setField = (field, value) => {
    if (field === 'category') {
      if (value === 'other') {
        setForm((prev) => ({
          ...prev,
          category: value,
          fabric: 'other',
        }))
        return
      }

      // When category changes, reset to a matching predefined fabric.
      const nextFabrics = getFabricsForCategory(value)
      setForm((prev) => ({
        ...prev,
        category: value,
        customCategory: '',
        fabric: value ? nextFabrics[0] || 'other' : '',
        customFabric: '',
      }))
      return
    }

    if (field === 'fabric' && value !== 'other') {
      setForm((prev) => ({ ...prev, fabric: value, customFabric: '' }))
      return
    }

    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const availableFabrics = form.category && form.category !== 'other' ? getFabricsForCategory(form.category) : []

  const clearNewImageState = () => {
    newImagePreviews.forEach((preview) => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    })
    setNewImages([])
    setNewImagePreviews([])
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId('')
    setExistingImages([])
    setRemovedImages([])
    clearNewImageState()
    setSizeChartFile(null)
  }

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    setNewImages((prev) => [...prev, ...files])
    setNewImagePreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))])
    // Allow selecting the same file again.
    event.target.value = ''
  }

  const removeExistingImage = (indexToRemove) => {
    const removed = existingImages[indexToRemove]
    if (removed) {
      setRemovedImages((removedPrev) => [...removedPrev, removed])
    }
    setExistingImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const removeNewImage = (indexToRemove) => {
    setNewImages((prev) => prev.filter((_, index) => index !== indexToRemove))
    setNewImagePreviews((prev) => {
      const next = [...prev]
      const [removed] = next.splice(indexToRemove, 1)
      if (removed?.startsWith('blob:')) URL.revokeObjectURL(removed)
      return next
    })
  }

  const handleSizeChartSelect = (event) => {
    const file = event.target.files?.[0]
    setSizeChartFile(file || null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    setWarning('')

    const finalCategory = (form.category === 'other' ? form.customCategory : form.category).trim()
    const finalFabric = (form.fabric === 'other' ? form.customFabric : form.fabric).trim()

    if (!finalCategory) {
      setError('Please select or enter a category.')
      return
    }

    if (!finalFabric) {
      setError('Please select or enter a fabric.')
      return
    }

    try {
      setSaving(true)

      let uploadedImages = []
      let failedCount = 0
      if (newImages.length) {
        const uploadResult = await uploadMultipleImages(newImages)
        uploadedImages = uploadResult.success
        failedCount = uploadResult.failedCount
        if (failedCount > 0) {
          const reason = uploadResult.errors?.[0]
          setWarning(
            reason
              ? `${failedCount} image(s) failed to upload. ${reason}`
              : `${failedCount} image(s) failed to upload`
          )
        }
      }
      const finalImages = normalizeImages([
        ...existingImages,
        ...uploadedImages,
      ])
      if (!finalImages.length) {
        setError('At least one product image is required.')
        return
      }

      let sizeChartImageUrl = form.sizeChartImage
      if (sizeChartFile) {
        const uploadedSizeChart = await uploadSingleImage(sizeChartFile)
        sizeChartImageUrl = uploadedSizeChart.url
      }

      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        category: finalCategory,
        description: form.description.trim() || DEFAULT_DESCRIPTION,
        fabric: finalFabric,
        images: finalImages,
        sizeLength: form.sizeLength.trim(),
        sizeChartText: form.sizeChartText.trim(),
        sizeChartImage: sizeChartImageUrl,
        inStock: form.inStock ?? true,
      }

      if (editingId) {
        let removedMediaResult = null
        if (removedImages.length) {
          removedMediaResult = await deleteTelegramMedia(removedImages)
        }

        await editProduct(editingId, payload)
        if (removedImages.length) {
          if (removedMediaResult?.failedCount > 0) {
            setWarning('Product updated, but some Telegram images could not be deleted.')
          }
          setStatus('Product updated successfully. Removed images were processed for Telegram cleanup.')
        } else {
          setStatus('Product updated successfully.')
        }
      } else {
        await createProduct(payload)
        setStatus('Product added successfully.')
      }

      const refreshed = await fetchProducts(true)
      setProducts(refreshed)
      resetForm()
    } catch (err) {
      setError(err.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product) => {
    const productCategory = String(product.category || '').trim()
    const categoryExists = categories.includes(productCategory)
    const categoryValue = categoryExists ? productCategory : 'other'

    const productFabric = String(product.fabric || '').trim()
    const allowedFabrics = categoryExists ? getFabricsForCategory(productCategory) : []
    const fabricExists = categoryExists && allowedFabrics.includes(productFabric)
    const nextFabric = fabricExists ? productFabric : 'other'

    setEditingId(product.id)
    setForm({
      name: product.name || '',
      price: product.price || '',
      category: categoryValue,
      customCategory: categoryExists ? '' : productCategory,
      description: product.description || DEFAULT_DESCRIPTION,
      fabric: nextFabric,
      customFabric: nextFabric === 'other' ? productFabric : '',
      sizeLength: product.sizeLength || '',
      sizeChartText: product.sizeChartText || '',
      sizeChartImage: getImageUrl(product.sizeChartImage) || product.sizeChartImage || '',
      inStock: product.inStock ?? true,
    })
    setExistingImages(normalizeImages(product.images || []))
    setRemovedImages([])
    clearNewImageState()
    setSizeChartFile(null)
  }

  const handleDelete = async (productId) => {
    const confirmed = window.confirm('Delete this product?')
    if (!confirmed) return

    try {
      setError('')
      setStatus('')
      const deleteResult = await removeProduct(productId)
      const refreshed = await fetchProducts(true)
      setProducts(refreshed)
      if (deleteResult?.failedCount > 0) {
        setWarning('Product deleted, but some Telegram images could not be deleted.')
      }
      setStatus('Product deleted successfully.')
    } catch (err) {
      setError(err.message || 'Failed to delete product.')
    }
  }

  return (
    <div className="space-y-8">
      {warning && (
        <div className="rounded bg-yellow-100 text-yellow-800 px-4 py-2 mb-2">{warning}</div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Admin Panel</p>
          <h1 className="section-title">Manage Store Products</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/orders" className="btn-outline">
            Manage Orders
          </Link>
          <button className="btn-outline" type="button" onClick={logoutAdmin}>
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-brand-gold/30 bg-white p-6 shadow-elevated md:grid-cols-2">
        <input className="input-field" placeholder="Product Name" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
        <input className="input-field" type="number" placeholder="Price" value={form.price} onChange={(e) => setField('price', e.target.value)} required />

        <select className="input-field" value={form.category} onChange={(e) => setField('category', e.target.value)}>
          <option value="">Select Category</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
          <option value="other">Other</option>
        </select>

        <select className="input-field" value={form.fabric} onChange={(e) => setField('fabric', e.target.value)}>
          <option value="">Select Fabric</option>
          {availableFabrics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
          <option value="other">Other</option>
        </select>

        {form.category === 'other' && (
          <input
            type="text"
            className="input-field"
            placeholder="Enter custom category"
            value={form.customCategory}
            onChange={(e) => setField('customCategory', e.target.value)}
          />
        )}

        {form.fabric === 'other' && (
          <input
            type="text"
            className="input-field"
            placeholder="Enter custom fabric"
            value={form.customFabric}
            onChange={(e) => setField('customFabric', e.target.value)}
          />
        )}

        <div className="md:col-span-2 space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.inStock ?? true}
              onChange={e => setField('inStock', e.target.checked)}
            />
            In Stock
          </label>
          <div className="flex justify-between items-center gap-2">
            <label className="text-sm font-medium text-brand-maroon">Description</label>
            <button
              type="button"
              onClick={() => setField('description', DEFAULT_DESCRIPTION)}
              className="text-xs px-2 py-1 rounded bg-brand-gold/20 text-brand-maroon hover:bg-brand-gold/30 transition"
            >
              Reset to Default
            </button>
          </div>
          <textarea
            className="input-field w-full min-h-28"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            required
          />
        </div>

        <input className="input-field" placeholder="Size / Length (optional)" value={form.sizeLength} onChange={(e) => setField('sizeLength', e.target.value)} />
        <input className="input-field" placeholder="Size Chart Text (optional)" value={form.sizeChartText} onChange={(e) => setField('sizeChartText', e.target.value)} />

        <label className="text-sm text-brand-maroon/80">
          Add New Images (multiple)
          <input className="mt-1 block w-full text-sm" type="file" multiple accept="image/*" onChange={handleImageSelect} />
        </label>

        <label className="text-sm text-brand-maroon/80">
          Size Chart Image (optional)
          <input className="mt-1 block w-full text-sm" type="file" accept="image/*" onChange={handleSizeChartSelect} />
        </label>

        {editingId && (
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-brand-maroon">Existing Images</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {existingImages.map((image, index) => (
                <div
                  key={image.public_id || `${image.url}-${index}`}
                  className="group relative overflow-hidden rounded-lg border border-brand-gold/25 bg-brand-cream/30"
                >
                  <img
                    src={getImageUrl(image)}
                    alt="existing"
                    className="h-24 w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-red-700/90 p-1 text-white opacity-100 transition hover:bg-red-700 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Remove existing image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {!existingImages.length && (
                <p className="col-span-full rounded-lg border border-dashed border-brand-gold/40 p-3 text-sm text-brand-maroon/70">
                  No existing images left. Add at least one new image.
                </p>
              )}
            </div>
          </div>
        )}

        {!!newImagePreviews.length && (
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-medium text-brand-maroon">New Images</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {newImagePreviews.map((preview, index) => (
                <div key={`${preview}-${index}`} className="group relative overflow-hidden rounded-lg border border-brand-gold/25 bg-brand-cream/30">
                  <img src={preview} alt="new preview" className="h-24 w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-red-700/90 p-1 text-white opacity-100 transition hover:bg-red-700 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Remove new image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="md:col-span-2 text-sm text-red-700">{error}</p>}
        {status && <p className="md:col-span-2 text-sm text-green-700">{status}</p>}

        <div className="md:col-span-2 flex gap-3">
          <button className="btn-gold" type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
          </button>
          {editingId && (
            <button className="btn-outline" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-3xl text-brand-maroon">Existing Products</h2>
        {loadingProducts ? (
          <p className="text-brand-maroon/70">Loading products...</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <article key={product.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-gold/25 bg-white p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={getPrimaryImageUrl(product.images, 'https://placehold.co/280x280/F8F1E5/5A0F1C?text=Saree')}
                    alt={product.name}
                    className="h-20 w-20 rounded-lg border border-brand-gold/20 bg-brand-cream/40 p-1 object-contain"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-medium text-brand-maroon">{product.name}</p>
                    <p className="text-sm text-brand-maroon/70">
                      {product.category} - {product.fabric} - {formatINR(product.price)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline" onClick={() => handleEdit(product)} type="button">
                    Edit
                  </button>
                  <button className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white" onClick={() => handleDelete(product.id)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
