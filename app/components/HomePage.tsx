import React from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from 'react';
import Image from "next/image"

const HomePage = () => {
    const { data: session } = useSession();
    const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false);

    if (session && session.user) {
        return (
            <div className='flex justify-between items-start'>
                <img src={session.user.image ? session.user.image : "/user-icon.webp"} alt="Profile Picture" width={45} height={45} className='ml-2 rounded-full'/>
                <button onClick={() => signOut()} className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Sign out</button>
            </div>
        )
    }

    return (
        <div className="flex items-center h-screen bg-[rgb(208,238,246)]">
            <div className="relative w-3/5 ml-10 mr-10  h-[400px] shadow-2xl transform translate-y-[-30px]  bg-white">
                <div className="antialiased ml-10 mt-3 mb-3 pt-10 font-sans text-3xl font-bold text-justify">Most Efficient AI for Insurance Industry</div>
                <p className="antialiased ml-10 text-md text-justify mr-10 font-sans text-gray-600">
                At PolicyAdvisor, our AI Assistant empowers advisors and clients by streamlining real-life insurance scenarios, offering data-driven insights, resolving queries, and simplifying decision-making—ensuring seamless, informed, and hassle-free protection planning.
                </p>
                <button onClick={() => signIn()} className="transition-transform duration-300  hover:translate-x-2 flex absolute bottom-24 ml-10 focus:outline-none text-white bg-[rgb(216,22,113)] hover:bg-[rgb(216,22,113)]-700  font-medium text-md px-7 py-4 me-2 mb-2">Sign In 
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="ml-4 size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default HomePage;