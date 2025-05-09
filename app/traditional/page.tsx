'use client'

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Header from '../components/header';

interface ProductDetails {
    condition: string
    definition: string
    underwriting_focus: string[]
    requirements: string[]
    underwriting_action_life: string | Record<string, string>
  }
  
interface RankedCompany {
company: string
reason: string
products: ProductDetails[]
}
  

export default function Home() {
  const allowedEmails =  [
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
                "visnu@policyadvisor.com", "pankaj@policyadvsior.com", "mayank@policyadvisor.com"
            ]

  const { data: session, status } = useSession()
  const router = useRouter()
  const [results, setResults] = useState<RankedCompany[]>([])
  const [input, setInput] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [smokerStatus, setSmokerStatus] = useState<'Non-Smoker' | 'Smoker'>('Non-Smoker')
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
    const formattedHeight = heightFeet !== '' && heightInches !== '' ? `${heightFeet}'${heightInches}"` : ''
  
    const res = await fetch('/api/traditional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_input, height: formattedHeight, weight, gender })
    })
  
    const data = await res.json()
    console.log(data.results)
    const updatedFactors = formattedHeight && weight !== ''
      ? [
          ...(gender ? [`Gender: ${gender}`] : []),
          `Height: ${formattedHeight}`,
          `Weight: ${weight} lb`,
          ...data.clientFactors
        ]
      : [...data.clientFactors]
  
    setFactors(updatedFactors)
    setResults(data.results)
    setLoading(false)
  }
  

  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(company)) newSet.delete(company)
      else newSet.add(company)
      return newSet
    })
  }

  const flatten = (obj: any): string[] => {
    return Object.values(obj).flatMap(val =>
      typeof val === 'string' ? [val] :
      typeof val === 'object' ? flatten(val) : []
    );
  }

  const hasMultipleConditions = results.some(entry => entry.products.length > 1);
const extractedNote = hasMultipleConditions
  ? "I have found multiple matching conditions based on your request. You may specify a particular condition for a more precise result."
  : "Here is a refined result as per your request.";
  

  return (
    <>
   <Header/>
    <main className="max-w-6xl mx-auto p-6 text-sm" style={{ fontFamily: 'Lato, sans-serif' }}>
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-800">Traditional Underwriting Checker</h1>

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
          {loading ? 'Checking...' : 'Submit'}
        </button>
      </div>

      {factors.length > 0 && (
  <div className="bg-white shadow-sm rounded-md p-4 mb-6">
    <h2 className="font-semibold mb-2 text-blue-800">Extracted Factors:</h2>
    <ul className="list-disc list-inside text-sm text-gray-700">
      {factors.map((f: any, i: number) => (
        <li key={i}>
          {typeof f === 'string' ? f : `${f.label}: ${f.value}`}
        </li>
      ))}
    </ul>
    <p className="text-md text-gray-600 italic mb-2 font-bold p-4">{extractedNote}</p>
  </div>
)}

{results.length > 0 && (
  <div className="mt-6">
    <h2 className="text-2xl font-semibold text-blue-800 mb-4">Ranked Companies & Product Details:</h2>
    {results.map((entry, idx) => (
      <div key={entry.company} className="mb-6 border border-gray-200 rounded-md shadow-sm">
        <button
          className="text-left w-full bg-gray-100 px-4 py-3 font-semibold flex justify-between items-center"
          onClick={() => toggleCompany(entry.company)}
        >
          <span className="text-lg text-gray-800">{entry.company}</span>
          <span className="text-xl text-gray-600">{expandedCompanies.has(entry.company) ? '-' : '+'}</span>
        </button>

        {expandedCompanies.has(entry.company) && (
            <div className="overflow-x-auto bg-white p-4">
            <div className="text-sm text-gray-700 mb-3">
              <span className="font-semibold text-blue-800">AI Summary:</span> {entry.reason}
            </div>
            <table className="min-w-full border-collapse border border-gray-200 text-sm text-left">
              <thead className="bg-blue-100 text-gray-800">
                <tr>
                  <th className="p-3 border font-semibold w-1/5 align-top">Definition</th>
                  <th className="p-3 border font-semibold w-1/5 align-top">Underwriting Focus</th>
                  <th className="p-3 border font-semibold w-1/5 align-top">Requirements</th>
                  <th className="p-3 border font-semibold w-1/5 align-top">Life Underwriting Action</th>
                </tr>
              </thead>
              <tbody>
                {entry.products.map((product, i) => (
                  <tr key={i} className="even:bg-gray-50 align-top">
                    <td className="p-3 border whitespace-pre-wrap text-gray-700"><b>{product.condition}:</b><br/>{product.definition}</td>
                    <td className="p-3 border whitespace-pre-wrap text-gray-700">
                      <ul className="list-disc list-inside space-y-1">
                        {product.underwriting_focus.map((f, j) => <li key={j}>{f}</li>)}
                      </ul>
                    </td>
                    <td className="p-3 border whitespace-pre-wrap text-gray-700">
                      <ul className="list-disc list-inside space-y-1">
                        {product.requirements.map((r, j) => <li key={j}>{r}</li>)}
                      </ul>
                    </td>
                    <td className="p-3 border whitespace-pre-wrap text-gray-700">
                      <ul className="list-disc list-inside space-y-1">
                        {typeof product.underwriting_action_life === 'string' ? (
                          <li>{product.underwriting_action_life || 'Unavailable'}</li>
                        ) : (
                          Object.values(product.underwriting_action_life || {})
                            .flatMap(val =>
                              typeof val === 'string'
                                ? [val]
                                : typeof val === 'object' && val !== null
                                  ? Object.values(val).filter(v => typeof v === 'string')
                                  : []
                            )
                            .map((text, idx) => (
                              <li key={idx}>{text}</li>
                            ))
                        )}
                      </ul>
                    </td>
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
    {loading && (
  <div className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
  </div>
)}
    </main>
    </>
  )
}
