'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

function ProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstMount = useRef(true)

  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setVisible(true)
    setWidth(10)
    intervalRef.current = setInterval(() => {
      setWidth(w => Math.min(85, w + Math.random() * 8))
    }, 250)
  }

  const finish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setWidth(100)
    setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 350)
  }

  // Finish bar when route change completes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Start bar immediately on anchor click (before navigation begins)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      // Skip hash links, external URLs, mailto/tel
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      // Skip modified clicks (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (anchor.target === '_blank') return
      start()
    }
    const onPopState = () => start()
    document.addEventListener('click', handleClick)
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('popstate', onPopState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  )
}
