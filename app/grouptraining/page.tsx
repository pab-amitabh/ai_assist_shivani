'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ConvaiPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const allowedEmails = [
    "amitabh.bhatia@gmail.com", "jitenpuri@gmail.com", "anushae.hassan@gmail.com",
    "ulkeshak23@gmail.com", "heenabanka@gmail.com", "shivani.lpu71096@gmail.com",
    "pollardryan525@gmail.com", "amitabh@policyadvisor.com", "jiten@policyadvisor.com",
    "shivani@policyadvisor.com", "anushae@policyadvisor.com", "babita@policyadvisor.com",
    "brandon@policyadvisor.com", "carly@policyadvisor.com", "colep@policyadvisor.com",
    "diarmuid@policyadvisor.com", "harshmeet@policyadvisor.com", "heena@policyadvisor.com",
    "hemin@policyadvisor.com", "jason@policyadvisor.com", "khaleel@policyadvisor.com",
    "matthewc@policyadvisor.com", "merab@policyadvisor.com", "nikal@policyadvisor.com",
    "parmeet@policyadvisor.com", "priyanka@policyadvisor.com", "reidc@policyadvisor.com",
    "ripenjeet@policyadvisor.com", "ruchita@policyadvisor.com", "ryanp@policyadvisor.com",
    "subir@policyadvisor.com", "ulkesha@policyadvisor.com", "vanessa@policyadvisor.com",
    "visnu@policyadvisor.com", "pankaj@policyadvsior.com", "mayank@policyadvisor.com","geetkaur@policyadvisor.com"
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
        src="/group_training.png"
        alt="Background"
        className="w-full h-full object-cover object-top"
      />
      {/* Convai widget container */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <elevenlabs-convai agent-id="agent_01jvd8q756frg9saprfc7rmm2d"/>
      </div>
    </div>
  )
}

