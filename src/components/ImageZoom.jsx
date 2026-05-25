import { useEffect, useRef, useState } from 'react'
import { Search, RotateCcw } from 'lucide-react'

const TOGGLE_SCALE = 2.2
const MIN_SCALE = 1
const MAX_SCALE = 3

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getTouchDistance(touches) {
  const [a, b] = touches
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
}

export default function ImageZoom({ src, alt = 'Product image' }) {
  const containerRef = useRef(null)
  const dragRef = useRef({ startX: 0, startY: 0, baseX: 0, baseY: 0 })
  const pinchRef = useRef({ startDistance: 0, startScale: 1 })
  const movedRef = useRef(false)
  const ignoreClickRef = useRef(false)
  const lastTapRef = useRef(0)

  const [scale, setScale] = useState(MIN_SCALE)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isPinching, setIsPinching] = useState(false)

  const zoomed = scale > MIN_SCALE

  const clampPosition = (nextPosition, nextScale = scale) => {
    const element = containerRef.current
    if (!element) return { x: 0, y: 0 }

    const rect = element.getBoundingClientRect()
    const maxX = (rect.width * (nextScale - 1)) / 2
    const maxY = (rect.height * (nextScale - 1)) / 2

    return {
      x: clamp(nextPosition.x, -maxX, maxX),
      y: clamp(nextPosition.y, -maxY, maxY),
    }
  }

  const resetZoom = () => {
    setScale(MIN_SCALE)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
    setIsPinching(false)
  }

  const toggleZoom = () => {
    if (zoomed) {
      resetZoom()
      return
    }
    setScale(TOGGLE_SCALE)
    setPosition({ x: 0, y: 0 })
  }

  useEffect(() => {
    if (!zoomed) return undefined

    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        resetZoom()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick, { passive: true })

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [zoomed])

  useEffect(() => {
    if (!zoomed) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [zoomed])

  const handleMouseDown = (event) => {
    if (!zoomed) return
    event.preventDefault()
    movedRef.current = false
    setIsDragging(true)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: position.x,
      baseY: position.y,
    }
  }

  const handleMouseMove = (event) => {
    if (!zoomed) return

    if (isDragging) {
      const deltaX = event.clientX - dragRef.current.startX
      const deltaY = event.clientY - dragRef.current.startY

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        movedRef.current = true
      }

      const next = clampPosition({
        x: dragRef.current.baseX + deltaX,
        y: dragRef.current.baseY + deltaY,
      })

      setPosition(next)
      return
    }

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const rx = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const ry = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    const maxX = (rect.width * (scale - 1)) / 2
    const maxY = (rect.height * (scale - 1)) / 2

    const target = {
      x: (0.5 - rx) * 2 * maxX,
      y: (0.5 - ry) * 2 * maxY,
    }

    setPosition(clampPosition(target))
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (movedRef.current) {
      ignoreClickRef.current = true
      setTimeout(() => {
        ignoreClickRef.current = false
      }, 0)
    }
  }

  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      if (!zoomed) {
        setScale(TOGGLE_SCALE)
      }
      setIsPinching(true)
      setIsDragging(false)
      pinchRef.current = {
        startDistance: getTouchDistance(event.touches),
        startScale: zoomed ? scale : TOGGLE_SCALE,
      }
      return
    }

    if (event.touches.length !== 1) return

    const now = Date.now()
    if (now - lastTapRef.current < 280) {
      event.preventDefault()
      toggleZoom()
      ignoreClickRef.current = true
      setTimeout(() => {
        ignoreClickRef.current = false
      }, 0)
      lastTapRef.current = 0
      return
    }

    lastTapRef.current = now

    if (zoomed) {
      const touch = event.touches[0]
      movedRef.current = false
      setIsDragging(true)
      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        baseX: position.x,
        baseY: position.y,
      }
    }
  }

  const handleTouchMove = (event) => {
    if (event.touches.length === 2) {
      event.preventDefault()
      const nextDistance = getTouchDistance(event.touches)
      const ratio = nextDistance / pinchRef.current.startDistance
      const nextScale = clamp(pinchRef.current.startScale * ratio, MIN_SCALE, MAX_SCALE)
      setScale(nextScale)
      setPosition((prev) => clampPosition(prev, nextScale))
      return
    }

    if (!zoomed || !isDragging || event.touches.length !== 1) return

    event.preventDefault()
    const touch = event.touches[0]
    const deltaX = touch.clientX - dragRef.current.startX
    const deltaY = touch.clientY - dragRef.current.startY

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      movedRef.current = true
    }

    setPosition(
      clampPosition({
        x: dragRef.current.baseX + deltaX,
        y: dragRef.current.baseY + deltaY,
      })
    )
  }

  const handleTouchEnd = () => {
    if (isDragging && movedRef.current) {
      ignoreClickRef.current = true
      setTimeout(() => {
        ignoreClickRef.current = false
      }, 0)
    }
    if (isDragging) setIsDragging(false)
    if (isPinching) setIsPinching(false)
  }

  const handleClick = () => {
    if (ignoreClickRef.current || isPinching) return
    toggleZoom()
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggleZoom()
          }
        }}
        className={`relative overflow-hidden rounded-2xl border border-brand-gold/30 bg-white focus:outline-none ${
          zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ touchAction: zoomed ? 'none' : 'manipulation' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="h-[480px] w-full select-none bg-brand-cream/35 p-2 object-contain"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isDragging || isPinching ? 'none' : 'transform 180ms ease-in-out',
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200" />
        {zoomed && <div className="pointer-events-none absolute inset-0 bg-black/10" />}

        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-brand-maroon/80 px-2 py-1 text-xs text-brand-cream">
          <span className="inline-flex items-center gap-1">
            <Search className="h-3.5 w-3.5" />
            {zoomed ? 'Zoomed' : 'Zoom'}
          </span>
        </div>

        {zoomed && (
          <button
            type="button"
            className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-brand-cream px-3 py-1.5 text-xs font-medium text-brand-maroon shadow"
            onClick={(event) => {
              event.stopPropagation()
              resetZoom()
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
