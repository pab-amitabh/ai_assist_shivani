'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '../components/header'
import dynamic from 'next/dynamic'


export default function QuoteCheckerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const allowedEmails = [
    "amitabh@policyadvisor.com",
    "jiten@policyadvisor.com",
    "shivani@policyadvisor.com",
    "heena@policyadvisor.com",
    "pankaj@policyadvisor.com"
  ]

//   const ChartComponent = dynamic(() => import('../components/ChartComponent'), { ssr: false })
  const [quote, setQuote] = useState('')
  const [extracted, setExtracted] = useState<any>(null)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const isUnauthorized =
      status === 'unauthenticated' ||
      (status === 'authenticated' && session && !allowedEmails.includes(session.user?.email || ''))

    if (isUnauthorized) {
      const currentPath = window.location.pathname
      router.push(`/?callbackUrl=${encodeURIComponent(currentPath)}`)
    }
  }, [status, session, router])

  if (
    status === 'loading' ||
    (status === 'authenticated' && !allowedEmails.includes(session?.user?.email || ''))
  ) {
    return null
  }

  const handleSubmit = async () => {
    setLoading(true)
    setExtracted(null)
    setAiMessage(null)
    setGraphData([])
    setError('')

    try {
      const res = await fetch('/api/quoteChecker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: quote }),
      })

      const data = await res.json()

      if (res.ok && data.message) {
        setExtracted(data.extracted)
        setAiMessage(data.message)
        setGraphData(data.graphData || [])
      } else {
        setError(data.error || 'Unable to generate summary.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto p-6 text-sm font-sans">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-800">Quote Checker</h1>

        <div className="bg-white shadow-md rounded-md p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Enter your insurance quote <span className='text-gray-500 font-normal italic'>(e.g., “My daughter is 35-year-old looking to invest $100/month for 20 years”)</span>
          </label>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            className="w-full border border-gray-300 rounded p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-800"
          />

          <button
            onClick={handleSubmit}
            disabled={loading || !quote.trim()}
            className="mt-4 w-full bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Submit Quote'}
          </button>
        </div>

        {error && (
          <div className="mt-4 text-red-600 font-semibold bg-red-50 border border-red-200 p-3 rounded">
            {error}
          </div>
        )}

        {extracted && (
          <div className="mt-6 p-4 border rounded bg-blue-50 text-blue-900">
            <h2 className="font-bold text-blue-800 mb-2">Extracted Info</h2>
            <ul className="list-disc list-inside text-sm space-y-1">
              {Object.entries(extracted).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {String(value)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiMessage && (
          <div className="mt-6 p-6 bg-white border border-gray-200 rounded shadow-sm text-base leading-relaxed">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">AI Summary</h2>
            <p className="text-gray-800 whitespace-pre-line">{aiMessage}</p>
          </div>
        )}

        {/* {graphData.length > 0 && (
        <div className="mt-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Projected Value Overview</h2>
            <ChartComponent graphData={graphData} />
        </div>
        )} */}
        
      </main>

      {loading && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </>
  )
}
