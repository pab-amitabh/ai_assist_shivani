'use client'

import { useEffect } from 'react'

export default function ConvaiPage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://elevenlabs.io/convai-widget/index.js'
    script.async = true
    script.type = 'text/javascript'
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden">
      <img
        src="/Training_final.png"
        alt="Background"
        className="w-full h-full object-cover object-top" 
      />

      {/* Convai widget container */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <elevenlabs-convai agent-id="R6zR7e4gUnXg9YYlurEG" />
      </div>
    </div>
  )
}
