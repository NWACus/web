'use client'
import { Globe } from 'lucide-react'
import './index.scss'

export const ViewDocumentButton = (props: { url: string }) => {
  const { url } = props
  const openNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return (
    <button
      aria-label="View Page Button"
      className="view-page-btn"
      id="preview-button"
      onClick={openNewTab}
      title="View Page Button"
      type="button"
    >
      <Globe width={16} height={16} className="icon" />
    </button>
  )
}
