import { useState } from 'react'
import MediaDialog from './MediaDialog.jsx'

export default function ExpandableImage({ src, alt, title, ...props }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="md-image-button"
        aria-label={`Expand image: ${alt || 'Article illustration'}`}
        title="Expand image"
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} title={title} {...props} />
        <span className="image-expand-label" aria-hidden="true">
          Expand ↗
        </span>
      </button>
      {open && (
        <MediaDialog
          label={alt || 'Article illustration'}
          onClose={() => setOpen(false)}
        >
          <img src={src} alt={alt} />
        </MediaDialog>
      )}
    </>
  )
}
