import clientConfig from '../config/clientConfig'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const whatsappNumber = String(clientConfig.whatsapp || '').replace(/\D/g, '')
  const phoneNumber = String(clientConfig.phone || '').replace(/\D/g, '')
  const instagramUrl = String(clientConfig.instagram || '').trim()
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clientConfig.address || '')}`

  return (
    <footer className="mt-20 border-t border-brand-gold/30 bg-brand-maroon text-brand-cream">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-2 md:px-8">
        <div>
          <h4 className="font-display text-2xl text-brand-gold">{clientConfig.brandName}</h4>
          <p className="mt-2 text-brand-cream/90">{clientConfig.tagline}</p>
        </div>
        <div className="text-sm md:text-right">
          <p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-gold hover:underline"
            >
              {clientConfig.address}
            </a>
          </p>
          {whatsappNumber && (
            <p className="mt-1">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-gold hover:underline"
              >
                WhatsApp: +{whatsappNumber}
              </a>
            </p>
          )}
          {phoneNumber && (
            <p className="mt-1">
              <a href={`tel:+${phoneNumber}`} className="hover:text-brand-gold hover:underline">
                Phone: +{phoneNumber}
              </a>
            </p>
          )}
          {instagramUrl && (
            <p className="mt-1">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-gold hover:underline"
              >
                Instagram
              </a>
            </p>
          )}
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-brand-gold/80">
            Crafted for premium saree boutiques
          </p>
        </div>
      </div>

      <div className="border-t border-brand-gold/20 px-4 py-4 text-center text-xs md:px-8">
        <p className="text-brand-cream/80">© {currentYear} {clientConfig.brandName}. All rights reserved.</p>
        <p className="mt-1 text-brand-cream/90">
          Made by{' '}
          <a
            href="https://www.instagram.com/sai_chandhan/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-gold hover:underline"
          >
            sai_chandhan
          </a>
        </p>
      </div>
    </footer>
  )
}
