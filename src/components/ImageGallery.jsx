import { lazy, Suspense, useState } from 'react'
import { getImageUrl } from '../utils/imageHelpers'

const ImageZoom = lazy(() => import('./ImageZoom'))

export default function ImageGallery({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage =
    getImageUrl(images[activeIndex]) || 'https://placehold.co/800x1000/F8F1E5/5A0F1C?text=Saree'
  const galleryImages = images.length ? images : [activeImage]

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-[480px] animate-pulse rounded-2xl border border-brand-gold/30 bg-brand-cream/40" />}>
        <ImageZoom src={activeImage} alt="Selected saree" />
      </Suspense>

      <div className="grid grid-cols-4 gap-2">
        {galleryImages.map((image, index) => {
          const src = getImageUrl(image) || activeImage
          const key = typeof image === 'object' ? image.public_id || image.url || index : `${image}-${index}`

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-lg border ${
                activeIndex === index ? 'border-brand-gold' : 'border-brand-maroon/20'
              }`}
            >
              <img src={src} alt={`Thumbnail ${index + 1}`} className="h-24 w-full object-cover" loading="lazy" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
