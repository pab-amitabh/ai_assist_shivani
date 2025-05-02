'use client'

import { useRouter, usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkBaseClasses =
    'block px-3 py-2 rounded-md transition duration-150 ease-in-out text-sm font-medium'

  const isActive = (path: string) =>
    pathname.includes('?') // Do not highlight if there’s a query param
      ? ''
      : pathname === path
      ? 'bg-blue-100 text-blue-800 shadow-sm border border-blue-200'
      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-800'

  const handleLogout = () => {
    setMenuOpen(false)
    signOut()
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <a href="https://www.policyadvisor.com/" target="_blank" rel="noopener noreferrer">
          <img
            src="/policyadvisor-logo.svg"
            alt="PolicyAdvisor"
            className="md:h-10 transition hover:opacity-90"
            height="200px"
            width="200px"
          />
        </a>

        {/* Desktop nav */}
        <div className='text-xs'>
        <nav className="hidden md:flex space-x-2 items-center">
          <a href="/" target="_blank" className={`${linkBaseClasses} ${isActive('/')}`}>Home</a>
          <a href="/assist" target="_blank" className={`${linkBaseClasses} ${isActive('/assist')}`}>AI Assist</a>
          <a href="/eligibilitychecker" target="_blank" className={`${linkBaseClasses} ${isActive('/eligibilitychecker')}`}>Simplified Life AI</a>
          <a href="/traditional" target="_blank" className={`${linkBaseClasses} ${isActive('/traditional')}`}>Traditional Life AI</a>
          <a href="/quotechecker" target="_blank" className={`${linkBaseClasses} ${isActive('/quotechecker')}`}>Quotes Checker (Life) AI</a>
          <a href="/training" target="_blank" className={`${linkBaseClasses} ${isActive('/training')}`}>Product Training (Group) AI</a>
          <a href="/service" target="_blank" className={`${linkBaseClasses} ${isActive('/service')}`}>Policy Servicing AI</a>

          {session && (
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition"
            >
              Logout
            </button>
          )}
        </nav>
        </div>

        {/* Mobile menu icon */}
        <button
          className="md:hidden text-gray-700 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-gray-200 px-4 py-3 space-y-2">
          <a href="/assist" onClick={() => setMenuOpen(false)} className={`${linkBaseClasses} ${isActive('/assist')}`}>AI Assist</a>
          <a href="/eligibilitychecker" onClick={() => setMenuOpen(false)} className={`${linkBaseClasses} ${isActive('/eligibilitychecker')}`}>Eligibility checker (Simplified Life) AI</a>
          <a href="/traditional" onClick={() => setMenuOpen(false)} className={`${linkBaseClasses} ${isActive('/traditional')}`}>Eligibility Checker (Traditional Life)  AI</a>
          <a href="/quotechecker" onClick={() => setMenuOpen(false)} className={`${linkBaseClasses} ${isActive('/quotechecker')}`}>Quotes Checker (Life) AI</a>
          {session && (
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  )
}
