import React from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from 'react';
import Image from "next/image"

const Login = () => {
	const { data: session } = useSession();
	const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false);

	// useEffect(() => {
	// 	if (session && session.user && !createdFirstChat) {
	// 		setCreatedFirstChat(true);
    //         console.log("Creating first chat in Login.tsx")
	// 		fetch("/api/createFirstChat", {
	// 			method: "POST",
	// 			body: JSON.stringify({
	// 				email: session.user.email,
	// 			})
	// 		})
	// 	}
	// 	// console.log(session)
	// }, [session])

	if (session && session.user) {
		return (
			<div className='flex justify-between items-start'>
				<img src={session.user.image ? session.user.image : "../../public/bot-icon.png"} alt="Profile Picture" width={45} height={45} className='ml-2'/>
				<button onClick={() => signOut()} className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Sign out</button>
				
			</div>
		)
	}
	return (
	<div>
		<button type="button" onClick={() => signIn()} className="ml-5 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Sign In</button>
	</div>
	)
}

export default Login
