'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { logConsentAction } from '@/app/actions/consent'

type ConsentState = {
  necessary: boolean
  statistics: boolean
  marketing: boolean
}

type ConsentContextType = {
  consent: ConsentState | null
  hasResponded: boolean
  updateConsent: (consent: Omit<ConsentState, 'necessary'>) => void
  openSettings: boolean
  setOpenSettings: (open: boolean) => void
}

const ConsentContext = createContext<ConsentContextType | null>(null)

const COOKIE_NAME = 'cookie_consent'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 12 months in seconds

function getConsentFromCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
    .split('; ')
    .find(c => c.startsWith(`${COOKIE_NAME}=`))
  if (!cookie) return null
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]))
  } catch {
    return null
  }
}

function setConsentCookie(consent: ConsentState) {
  const value = encodeURIComponent(JSON.stringify({
    ...consent,
    timestamp: new Date().toISOString(),
  }))
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [hasResponded, setHasResponded] = useState(true) // true initially to prevent flash
  const [openSettings, setOpenSettings] = useState(false)

  useEffect(() => {
    const stored = getConsentFromCookie()
    if (stored) {
      setConsent(stored)
      setHasResponded(true)
    } else {
      setHasResponded(false)
    }
  }, [])

  const updateConsent = useCallback((newConsent: Omit<ConsentState, 'necessary'>) => {
    const full: ConsentState = { necessary: true, ...newConsent }
    setConsent(full)
    setHasResponded(true)
    setConsentCookie(full)
    setOpenSettings(false)

    // Log to server (non-blocking)
    logConsentAction({
      statistics: full.statistics,
      marketing: full.marketing,
    }).catch(console.error)

    // Reload to activate/deactivate scripts
    window.location.reload()
  }, [])

  return (
    <ConsentContext value={{
      consent,
      hasResponded,
      updateConsent,
      openSettings,
      setOpenSettings,
    }}>
      {children}
    </ConsentContext>
  )
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider')
  return ctx
}
