'use client'

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';

interface ParsedResult {
  company: string
  product: string
  eligibility: string
  violatedRules: string[]
  followUpQuestions: string[]
  coverage?: string
}

export default function Home() {
  const allowedEmails = [
    "amitabh@policyadvisor.com",
    "jiten@policyadvisor.com",
    "shivani@policyadvisor.com"
  ]

  const { data: session, status } = useSession()
  const router = useRouter()

  const [input, setInput] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [smokerStatus, setSmokerStatus] = useState<'Non-Smoker' | 'Smoker'>('Non-Smoker')
  const [results, setResults] = useState<ParsedResult[]>([])
  const [factors, setFactors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [weight, setWeight] = useState<number | ''>('') 
  const [heightFeet, setHeightFeet] = useState<number | ''>('')
  const [heightInches, setHeightInches] = useState<number | ''>('') 
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('')


  useEffect(() => {
    const isUnauthorized =
      status === "unauthenticated" ||
      (status === "authenticated" && session && !allowedEmails.includes(session.user?.email || ""))

    if (isUnauthorized) {
      const currentPath = window.location.pathname
      router.push(`/?callbackUrl=${encodeURIComponent(currentPath)}`)
    }
  }, [status, session, router])

  if (
    status === "loading" ||
    (status === "authenticated" && !allowedEmails.includes(session?.user?.email || ""))
  ) {
    return null // Or show a loading spinner if you'd like
  }

  const handleSubmit = async () => {
    setLoading(true)
    setResults([])
    setFactors([])
  
    const user_input = `Age: ${age}\nSmoker: ${smokerStatus}\n${input}`
    const formattedHeight =
      heightFeet !== '' && heightInches !== '' ? `${heightFeet}'${heightInches}"` : ''
  
    const res = await fetch('/api/eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_input, height: formattedHeight, weight, gender })
    })
  
    const data = await res.json()
    const updatedFactors = formattedHeight && weight !== ''
    ? [
        ...(gender ? [`Gender: ${gender}`] : []),
        `Height: ${formattedHeight}`,
        `Weight: ${weight} lb`,
        ...data.clientFactors
      ]
    : [...data.clientFactors]
    setFactors(updatedFactors)
    setResults(parseResults(data.results))
    setLoading(false)
  }
  

  const parseResults = (rawResults: string[]): ParsedResult[] => {
    return rawResults.map(result => {
      const lines = result.split('\n')
      const productLine = lines.find(l => l.startsWith('Product:')) || ''
      const eligibilityLine = lines.find(l => l.startsWith('Eligibility:')) || ''
      const coverageLine = lines.find(l => l.startsWith('Coverage: ')) || ''
      const violatedIndex = lines.findIndex(l => l.startsWith('Violated Rules:'))
      const followUpIndex = lines.findIndex(l => l.startsWith('Follow-Up Questions:'))
      const coverageIndex = lines.findIndex(l => l.startsWith('Coverage:'))

      const product = productLine.replace('Product: ', '').trim()
      const eligibility = eligibilityLine.replace('Eligibility: ', '').trim()
      const coverage = coverageLine.replace('Coverage: ', '').trim()
      const company = product.split(' - ')[0]

      const violatedRules = lines
        .slice(violatedIndex + 1, followUpIndex)
        .filter(l => l.trim() !== '' && l.trim() !== 'N/A')

      const followUpQuestions = lines
        .slice(followUpIndex + 1, coverageIndex > -1 ? coverageIndex : undefined)
        .filter(l => l.trim() !== '' && l.trim() !== 'Unknown')

      return {
        company,
        product,
        eligibility,
        coverage,
        violatedRules,
        followUpQuestions
      }
    })
  }

  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(company)) newSet.delete(company)
      else newSet.add(company)
      return newSet
    })
  }

  const groupedByCompany = results.reduce<Record<string, ParsedResult[]>>((acc, r) => {
    if (!acc[r.company]) acc[r.company] = []
    acc[r.company].push(r)
    return acc
  }, {})

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-800">Insurance Eligibility Checker</h1>

      <div className="bg-white shadow-md rounded-md p-4 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            placeholder="Enter age"
            min={18}
            max={80}
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Smoking Status</label>
          <select
            value={smokerStatus}
            onChange={(e) => setSmokerStatus(e.target.value as 'Smoker' | 'Non-Smoker')}
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="Non-Smoker">Non-Smoker</option>
            <option value="Smoker">Smoker</option>
          </select>
        </div>
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
            <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800"
            >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
        </div>
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (lbs)</label>
            <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                placeholder="Enter weight in lbs"
                min={50}
                max={500}
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
            </div>

            <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Height</label>
            <div className="flex gap-2">
                <select
                value={heightFeet}
                onChange={(e) => setHeightFeet(Number(e.target.value))}
                className="w-1/2 border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-800"
                >
                <option value="">Feet</option>
                {[...Array(8)].map((_, i) => (
                    <option key={i} value={i + 4}>{i + 4}'</option>
                ))}
                </select>
                <select
                value={heightInches}
                onChange={(e) => setHeightInches(Number(e.target.value))}
                className="w-1/2 border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <option value="">Inches</option>
                {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>{i}"</option>
                ))}
                </select>
            </div>
            </div>

        <textarea
          className="w-full border border-gray-300 rounded p-3 mb-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter client info (e.g., 'Client is 50, diabetic, had stroke 3 years ago...')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="w-full bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading || !input.trim() || !age }
        >
          {loading ? 'Checking...' : 'Check Eligibility'}
        </button>
      </div>

      {factors.length > 0 && (
        <div className="bg-white shadow-sm rounded-md p-4 mb-6">
          <h2 className="font-semibold mb-2 text-blue-800">Extracted Factors:</h2>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {factors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(groupedByCompany).length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">Product Evaluation Results by Company:</h2>
          {Object.entries(groupedByCompany).map(([company, products]) => (
            <div key={company} className="mb-4 border border-gray-200 rounded-md shadow-sm">
              <button
                className="text-left w-full bg-gray-100 px-4 py-3 font-semibold flex justify-between items-center rounded-t-md"
                onClick={() => toggleCompany(company)}
              >
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-lg text-gray-800">{company}</span>
                  {products.map((p, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${p.eligibility === 'Eligible'
                        ? 'bg-green-200 text-green-800'
                        : p.eligibility === 'Check follow-Up Questions'
                          ? 'bg-yellow-200 text-yellow-900'
                          : 'bg-red-200 text-red-800'}`}
                    >
                      {p.product.split(' - ')[1]}
                    </span>
                  ))}
                </div>
                <span className="text-xl text-gray-600">{expandedCompanies.has(company) ? '-' : '+'}</span>
              </button>

              {expandedCompanies.has(company) && (
                <div className="overflow-x-auto bg-white">
                  <table className="table-auto w-full text-sm">
                    <thead className="bg-blue-100 text-gray-800">
                      <tr>
                        <th className="p-3 border font-semibold">Product</th>
                        <th className="p-3 border font-semibold">Eligibility</th>
                        <th className="p-3 border font-semibold">Coverage</th>
                        <th className="p-3 border font-semibold">Violated Rules</th>
                        <th className="p-3 border font-semibold">Follow-Up Questions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={i} className="even:bg-gray-50 border-t">
                          <td className="p-3 border font-medium text-gray-800">{p.product}</td>
                          <td className={`p-3 border font-bold text-center ${p.eligibility === 'Eligible'
                            ? 'text-green-600'
                            : p.eligibility === 'Not Eligible'
                              ? 'text-red-600'
                              : 'text-yellow-600'}`}>{p.eligibility}</td>
                          <td className="p-3 border text-gray-700">{p.coverage || 'Unknown'}</td>
                          <td className="p-3 border whitespace-pre-wrap text-gray-700">{p.violatedRules.join('\n')}</td>
                          <td className="p-3 border whitespace-pre-wrap text-gray-700">{p.followUpQuestions.join('\n')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
