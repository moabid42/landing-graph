import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function MediaDialog({ label, children, onClose }) {
  const dialogRef = useRef(null)
  const viewerRef = useRef(null)
  const mediaRef = useRef(null)
  const [zoomWidth, setZoomWidth] = useState(null)
  const zoomed = zoomWidth !== null

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.documentElement.style.overflow = previous
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (!zoomed) viewerRef.current?.scrollTo(0, 0)
  }, [zoomed])

  const dismissBackdrop = (event) => {
    if (event.target === event.currentTarget) onClose()
  }

  const toggleZoom = () => {
    const media = mediaRef.current.querySelector('img, svg') || mediaRef.current
    setZoomWidth(zoomed ? null : media.getBoundingClientRect().width * 2)
  }

  return createPortal(
    <dialog
      className="media-dialog"
      ref={dialogRef}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onPointerDown={dismissBackdrop}
    >
      <button
        type="button"
        className="media-dialog-close"
        onClick={onClose}
        aria-label="Close expanded view"
      >
        <span aria-hidden="true">×</span>
      </button>
      {/* Keyboard users need to focus the scrolling canvas to pan zoomed media. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
      <div
        className={`media-viewer ${zoomed ? 'media-zoomed' : ''}`}
        ref={viewerRef}
        tabIndex={0}
        role="region"
        aria-label="Expanded media"
        onPointerDown={dismissBackdrop}
      >
        <button
          type="button"
          className="media-zoom-toggle"
          ref={mediaRef}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          aria-pressed={zoomed}
          style={
            zoomed ? { '--media-zoom-width': `${zoomWidth}px` } : undefined
          }
          onClick={toggleZoom}
        >
          {children}
        </button>
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
    </dialog>,
    document.body
  )
}
