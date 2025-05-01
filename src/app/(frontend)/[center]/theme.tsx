'use client'
import { useEffect } from 'react'

export default function ThemeSetter({ theme }: { theme: string }) {
  useEffect(() => {
    const html = document.documentElement
    if (!html.classList.contains(theme)) {
      html.classList.add(theme)
    }
  }, [theme])

  return null
}
