const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let razorpayScriptPromise = null

export function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve(false)
  }

  if (window.Razorpay) {
    return Promise.resolve(true)
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

export async function createRazorpayOrder({ amount, currency = 'INR', receipt }) {
  const endpoint = import.meta.env.VITE_RAZORPAY_CREATE_ORDER_URL || '/api/razorpay/create-order'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency, receipt }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Unable to create Razorpay order.')
  }

  return response.json()
}
