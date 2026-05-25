import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ImageGallery from '../components/ImageGallery'
import QuickShopModal from '../components/QuickShopModal'
import { fetchProductById } from '../services/productService'
import { formatINR } from '../utils/formatters'
import { getImageUrl } from '../utils/imageHelpers'

export default function ProductDetailsPage() {
	const { id } = useParams()
	const [product, setProduct] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [quickOpen, setQuickOpen] = useState(false)

	useEffect(() => {
		async function loadProduct() {
			try {
				setLoading(true)
				const data = await fetchProductById(id)
				if (!data) {
					setError('Product not found.')
				} else {
					setProduct(data)
				}
			} catch {
				setError('Unable to load product details.')
			} finally {
				setLoading(false)
			}
		}

		loadProduct()
	}, [id])

	if (loading) {
		return <div className="p-10 text-center text-brand-maroon">Loading product details...</div>
	}

	if (error || !product) {
		return <div className="p-10 text-center text-brand-maroon">{error || 'Product not available.'}</div>
	}

	const sizeChartImageUrl = getImageUrl(product.sizeChartImage) || product.sizeChartImage

	return (
		<div className="grid gap-8 lg:grid-cols-2">
			<ImageGallery images={product.images} />

			<section className="space-y-4 rounded-2xl border border-brand-gold/20 bg-white p-6 shadow-soft">
				<p className="section-kicker">{product.category}</p>
				<h1 className="font-display text-4xl text-brand-maroon">{product.name}</h1>
				<p className="text-2xl font-semibold text-brand-gold">{formatINR(product.price)}</p>
				<p className="text-brand-maroon/80">{product.description}</p>

				{product.inStock === false && (
					<p className="text-red-600 font-semibold mt-2">
						This product is currently out of stock
					</p>
				)}

				<div className="space-y-2 rounded-xl bg-brand-cream p-4 text-sm text-brand-maroon">
					<p>
						<span className="font-semibold">Fabric:</span> {product.fabric}
					</p>
					{product.sizeLength && (
						<p>
							<span className="font-semibold">Size / Length:</span> {product.sizeLength}
						</p>
					)}
					{product.sizeChartText && (
						<p>
							<span className="font-semibold">Size Chart:</span> {product.sizeChartText}
						</p>
					)}
				</div>

				{sizeChartImageUrl && (
					<img
						src={sizeChartImageUrl}
						alt="Size chart"
						className="max-h-64 rounded-xl border border-brand-gold/20 object-contain"
						loading="lazy"
					/>
				)}

				<button type="button" className="btn-gold w-full" onClick={() => setQuickOpen(true)}>
					Enquire on WhatsApp
				</button>
			</section>

			<QuickShopModal product={product} isOpen={quickOpen} onClose={() => setQuickOpen(false)} />
		</div>
	)
}
