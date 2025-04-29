'use client'
import React from 'react'

export const HeaderClient = ({ children }: { children: React.ReactNode }) => {
  return <header className="container relative z-20">{children}</header>
}
