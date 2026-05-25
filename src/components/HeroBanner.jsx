import { Link } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import clientConfig from '../config/clientConfig'

const fallbackHeroImage =
  'https://placehold.co/900x1200/F8F1E5/5A0F1C?text=Premium+Saree+Collection'

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand-gold/30 bg-brand-maroon text-brand-cream shadow-royal">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />

      <div className="grid items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-12">
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="mb-2 text-sm uppercase tracking-[0.32em] text-brand-gold">
            Premium Collection
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-6xl">
            {clientConfig.brandName}
          </h1>
          <p className="mt-6 max-w-xl text-brand-cream/90">{clientConfig.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn-gold">
              Explore Collections
            </Link>
            <a
              href={`https://wa.me/${clientConfig.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              Talk to Stylist
            </a>
          </div>
        </Motion.div>

        <Motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9 }}
        >
          <div className="grid grid-cols-2 gap-3">
            {clientConfig.heroImages.map((image, index) => (
              <img
                key={image}
                src={image}
                alt={`Saree showcase ${index + 1}`}
                className="h-64 w-full rounded-2xl object-cover ring-1 ring-brand-gold/30"
                style={{ objectPosition: index === 1 ? 'center 32%' : 'center center' }}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = fallbackHeroImage
                }}
              />
            ))}
          </div>
        </Motion.div>
      </div>
    </section>
  )
}
