import { useMemo, useState } from 'react'
import clientConfig from '../config/clientConfig'
import { getPrimaryImageUrl } from '../utils/imageHelpers'
import { createOrder } from '../services/orderService'
import { openWhatsApp } from '../services/whatsappService'
import { useToast } from '../hooks/useToast'

const STORAGE_KEY = 'saree_store_customer_details'

const defaultCustomer = {
  name: '',
  phone: '',
  doorNo: '',
  streetName: '',
  city: '',
  pincode: '',
  state: '',
}

function normalizeCustomer(raw) {
  if (!raw || typeof raw !== 'object') return defaultCustomer

  return {
    ...defaultCustomer,
    ...raw,
    // Backward compatibility with previous single address field.
    streetName: raw.streetName || raw.address || '',
  }
}

export default function QuickShopModal({ product, isOpen, onClose }) {
  const [customer, setCustomer] = useState(() => {
    const fromStorage = localStorage.getItem(STORAGE_KEY)
    if (!fromStorage) return defaultCustomer

    try {
      return normalizeCustomer(JSON.parse(fromStorage))
    } catch {
      return defaultCustomer
    }
  })
  const [validationError, setValidationError] = useState('')
  const [submittingWhatsApp, setSubmittingWhatsApp] = useState(false)
  const { error, success } = useToast()

  const addressText = useMemo(() => {
    return [customer.doorNo, customer.streetName, customer.city, customer.pincode, customer.state]
      .filter((value) => String(value || '').trim())
      .join(', ')
  }, [customer])

  const whatsappMessage = useMemo(() => {
    if (!product) return ''
    const productUrl = `${window.location.origin}/products/${product.id}`
    const { name, price, category, fabric } = product
    const {
      name: customerName,
      phone,
      doorNo,
      streetName,
      city,
      pincode,
      state,
    } = customer

    return (paymentStatusLabel) => `View product: ${productUrl}

Hi, I want to order:

🛍 Product: ${name}
📂 Category: ${category || 'N/A'}
🧵 Fabric: ${fabric || 'N/A'}
💰 Price: ₹${price}
💳 Payment Status: ${paymentStatusLabel}

Customer Details:
👤 Name: ${customerName}
📞 Phone: ${phone}

📍 Address:
Door No: ${doorNo}
Street: ${streetName}
City: ${city}
Pincode: ${pincode}
State: ${state}`
  }, [product, customer])


  if (!isOpen || !product) return null
  const outOfStock = product.inStock === false

  const handleFieldChange = (field, value) => {
    if (validationError) setValidationError('')
    setCustomer((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = Object.values(customer).every((value) => String(value).trim())

  const buildOrderPayload = ({ paymentMethod, paymentStatus, orderStatus }) => ({
    productName: product?.name || '',
    price: Number(product?.price) || 0,
    image: getPrimaryImageUrl(product?.images, ''),
    selectedSize: product?.sizeLength || '',
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: addressText,
    },
    paymentMethod,
    paymentStatus,
    orderStatus,
  })

  const handleEnquire = async () => {
    if (product.inStock === false) {
      alert('This product is out of stock');
      return;
    }
    if (!isFormValid) {
      setValidationError('Please fill all fields before sending enquiry.')
      error('Please fill all fields before sending enquiry.')
      return
    }

    try {
      setSubmittingWhatsApp(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer))

      await createOrder(
        buildOrderPayload({
          paymentMethod: 'whatsapp',
          paymentStatus: 'pending',
          orderStatus: 'initiated',
        }),
      )

      const whatsappPhone = String(clientConfig.whatsapp || '').replace(/\D/g, '')
      const message = whatsappMessage('Pending')
      success('Opening WhatsApp...')
      
      await openWhatsApp(whatsappPhone, message)
      onClose()
    } catch (err) {
      error(err?.message || 'Unable to create WhatsApp order.')
    } finally {
      setSubmittingWhatsApp(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-brand-gold/30 bg-brand-cream p-6 shadow-royal">
        <h3 className="font-display text-3xl text-brand-maroon">Enquire on WhatsApp</h3>
        <p className="mt-1 text-sm text-brand-maroon/80">Product: {product.name}</p>

        {outOfStock && (
          <p className="mt-3 text-red-600 font-semibold">This product is currently out of stock</p>
        )}

        <div className="mt-5 space-y-3">
          <input
            className="input-field"
            placeholder="Name"
            value={customer.name}
            onChange={(event) => handleFieldChange('name', event.target.value)}
            required
            disabled={outOfStock}
          />
          <input
            className="input-field"
            placeholder="Phone"
            value={customer.phone}
            onChange={(event) => handleFieldChange('phone', event.target.value)}
            required
            disabled={outOfStock}
          />
          <input
            className="input-field"
            placeholder="Door No"
            value={customer.doorNo}
            onChange={(event) => handleFieldChange('doorNo', event.target.value)}
            required
            disabled={outOfStock}
          />
          <input
            className="input-field"
            placeholder="Street Name"
            value={customer.streetName}
            onChange={(event) => handleFieldChange('streetName', event.target.value)}
            required
            disabled={outOfStock}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input-field"
              placeholder="City"
              value={customer.city}
              onChange={(event) => handleFieldChange('city', event.target.value)}
              required
              disabled={outOfStock}
            />
            <input
              className="input-field"
              placeholder="Pincode"
              value={customer.pincode}
              onChange={(event) => handleFieldChange('pincode', event.target.value)}
              required
              disabled={outOfStock}
            />
          </div>
          <input
            className="input-field"
            placeholder="State"
            value={customer.state}
            onChange={(event) => handleFieldChange('state', event.target.value)}
            required
            disabled={outOfStock}
          />
        </div>

        {validationError && <p className="mt-3 text-sm text-red-700">{validationError}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-outline flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`flex-1 ${outOfStock ? 'bg-gray-400 cursor-not-allowed' : 'btn-gold'} disabled:cursor-not-allowed disabled:opacity-60`}
            onClick={handleEnquire}
            disabled={!isFormValid || submittingWhatsApp || outOfStock}
          >
            {outOfStock ? 'Out of Stock' : submittingWhatsApp ? 'Sending...' : 'Send Enquiry'}
          </button>
        </div>
      </div>
    </div>
  )
}
