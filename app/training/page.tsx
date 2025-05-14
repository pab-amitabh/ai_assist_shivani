'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ConvaiPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const allowedEmails = [
    "amitabh@policyadvisor.com",
    "jiten@policyadvisor.com",
    "shivani@policyadvisor.com",
    "heena@policyadvisor.com",
    "pankaj@policyadvisor.com",
    "hemin@policyadvisor.com",
    "colep@policyadvisor.com",
    "merab@policyadvisor.com"
  ]

  useEffect(() => {
    const isUnauthorized =
      status === 'unauthenticated' ||
      (status === 'authenticated' && session && !allowedEmails.includes(session.user?.email || ''))

    if (isUnauthorized) {
      const currentPath = window.location.pathname
      router.push(`/?callbackUrl=${encodeURIComponent(currentPath)}`)
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && allowedEmails.includes(session?.user?.email || '')) {
      const script = document.createElement('script')
      script.src = 'https://elevenlabs.io/convai-widget/index.js'
      script.async = true
      script.type = 'text/javascript'
      document.body.appendChild(script)
      return () => {
        document.body.removeChild(script)
      }
    }
  }, [status, session])

  if (
    status === 'loading' ||
    (status === 'authenticated' && !allowedEmails.includes(session?.user?.email || ''))
  ) {
    return null
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <img
        src="/Travel-Trainer.png"
        alt="Background"
        className="w-full h-full object-cover object-top"
      />
      {/* Convai widget container */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <elevenlabs-convai agent-id="rBsmXyARGcGFbVFBpFx9"/>
      </div>
    </div>
  )
}

