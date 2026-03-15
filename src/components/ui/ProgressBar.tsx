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

  // Patch history.pushState to detect navigation start
  useEffect(() => {
    const originalPushState = history.pushState.bind(history)
    history.pushState = (...args) => {
      start()
      return originalPushState(...args)
    }
    const onPopState = () => start()
    window.addEventListener('popstate', onPopState)
    return () => {
      history.pushState = originalPushState
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
