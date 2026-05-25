/**
 * Open WhatsApp with fallback support for iOS and Android
 * @param {string} phone - Phone number in format 919XXXXXXXXX (no +, no spaces)
 * @param {string} message - Message to send
 * @returns {Promise<void>}
 */
export const openWhatsApp = (phone, message) => {
  return new Promise((resolve) => {
    const encodedMessage = encodeURIComponent(message)
    
    // Detect iOS Devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    // WhatsApp URLs
    const iosUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`
    const fallbackUrl = `https://wa.me/${phone}?text=${encodedMessage}`
    const webUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`
    
    if (isIOS) {
      // Try to open WhatsApp app directly
      window.location.href = iosUrl
      
      // If app is not installed, fallback to web.whatsapp.com after 2 seconds
      const fallbackTimer = setTimeout(() => {
        window.location.href = webUrl
        resolve()
      }, 2000)
      
      // If user switches to WhatsApp app, clear the timer
      window.addEventListener('pagehide', () => clearTimeout(fallbackTimer), { once: true })
      window.addEventListener('blur', () => clearTimeout(fallbackTimer), { once: true })
    } else {
      // Android: Use wa.me which opens WhatsApp app if installed
      window.location.href = fallbackUrl
    }
    
    // For Android and as final resolve
    setTimeout(() => resolve(), 100)
  })
}
