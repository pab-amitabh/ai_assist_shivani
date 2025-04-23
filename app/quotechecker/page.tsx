'use client'

import { useState } from 'react'
import Header from '../components/header'

export default function QuoteCheckerPage() {
  const [quote, setQuote] = useState('')
  const [extracted, setExtracted] = useState<any>(null)
  const [baseResults, setBaseResults] = useState<any>({})
  const [projectedResults, setProjectedResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const handleSubmit = async () => {
    setLoading(true)
    setExtracted(null)
    setBaseResults({})
    setProjectedResults({})
    setError('')
  
    try {
      const res = await fetch('/api/quoteChecker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: quote }),
      })
  
      if (!res.ok) {
        if (res.status === 500) {
          setError('Please check your input and try again.')
        } else {
          setError(`Request failed with status: ${res.status}`)
        }
        setLoading(false)
        return
      }
  
      const data = await res.json()
  
      if (data.error) {
        setError(data.error)
      } else {
        setExtracted(data.extracted)
        setBaseResults(data.baseAgeResults)
        setProjectedResults(data.projectionResults)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
  
    setLoading(false)
  }
  

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto p-6 text-sm" style={{ fontFamily: 'Lato, sans-serif' }}>
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-800">Quote Checker</h1>

        <div className="bg-white shadow-md rounded-md p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Enter your requirements <span className='text-gray-500 italic'> (Provide details including Age, Gender, Smoker Status, Premium, PLIFE or P20)</span></label>
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
        <div className="mt-6 p-4 border rounded">
            <h2 className="font-bold text-blue-800 mb-2">Extracted Info</h2>
            <ul className="list-disc list-inside text-gray-800 text-sm space-y-1">
                {Object.entries(extracted).map(([key, value]) => (
                <li key={key}>
                    <span>{key}:</span>  {String(value)}
                </li>
                ))}
            </ul>
            {extracted && Object.keys(baseResults).length === 0 && Object.keys(projectedResults).length === 0 && !loading && (
            <p className="italic text-center mt-4 text-gray-600">
                No data found. Please check back later.
            </p>
            )}
        </div>
        )}

        

        {Object.keys(baseResults).length > 0 && (
          <div className="mt-6 space-y-6">
            {(Object.entries(baseResults) as [string, any[]][]).map(([key, baseEntries], i) => {
              const projectedEntries = projectedResults[key] || []
              const [gender, product, smoker, premium] = key.split('-')
              const displayGender = gender === 'M' ? 'Male' : 'Female'
              const displayProduct = product === 'PLIFE' ? 'Life Pay' : '20-Pay'
              const displaySmoker = smoker === 'NT' ? 'Non-Smoker' : 'Smoker'
              const displayPremium = premium.replace('B', '$') + '/month'

              return (
                <div key={i} className="border border-gray-200 rounded p-4 bg-white shadow-sm text-sm" style={{ fontFamily: 'Lato, sans-serif' }}>
                  <h3 className="font-semibold text-blue-700 mb-2">
                    {`${displayGender} - ${displayProduct} - ${displaySmoker} - ${displayPremium}`}
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-sm border border-gray-300">
                      <thead className="bg-blue-100 text-gray-800">
                        <tr>
                          <th className="p-2 border">Age</th>
                          <th className="p-2 border">Cash Value</th>
                          <th className="p-2 border">Death Benefit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {baseEntries.map((entry, idx) => (
                          <tr key={idx} className="bg-gray-50">
                            <td className="p-2 border text-center">{entry.projected_age} <span className='text-gray-300'>(Current Age)</span></td>
                            <td className="p-2 border text-center">{entry.projected_cash_value ?? 'N/A'}</td>
                            <td className="p-2 border text-center">{entry.projected_death_benefit ?? 'N/A'}</td>
                          </tr>
                        ))}
                        {projectedEntries.map((entry:any, idx:any) => (
                          <tr key={`p-${idx}`}>
                            <td className="p-2 border text-center">{entry.projected_age} <span className='text-gray-300'>(Future Age)</span></td>
                            <td className="p-2 border text-center">{entry.projected_cash_value ?? 'N/A'}</td>
                            <td className="p-2 border text-center">{entry.projected_death_benefit ?? 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      {loading && (
  <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
  </div>
)}
    </>
  )
}
