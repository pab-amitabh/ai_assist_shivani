'use client'

import React, { useState } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { useSearchParams } from 'next/navigation'

const HomePage = () => {
  const { data: session } = useSession()
  const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false)
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get("callbackUrl") || "/eligibilitychecker"

  // Convert relative callback path to full URL
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${rawCallback}`
      : rawCallback

  if (session && session.user) {
    return (
      <div className='flex justify-between items-start'>
        <img
          src={session.user.image ? session.user.image : "/user-icon.webp"}
          alt="Profile Picture"
          width={45}
          height={45}
          className='ml-2 rounded-full'
        />
        <button
          onClick={() => signOut()}
          className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src="/homepage_background1.png"
        className="absolute top-0 left-0 w-full h-full object-cover"
        alt="Background"
      />
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="transition-transform duration-300 hover:translate-x-2 flex absolute bottom-36 ml-16 focus:outline-none justify-center items-center text-white bg-[rgb(216,22,113)] hover:bg-[rgb(216,22,113)]-700 font-medium text-md px-7 py-4 me-2 mb-2"
      >
        Sign In
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="ml-4 size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
          />
        </svg>
      </button>
    </div>
  )
}

export default HomePage
