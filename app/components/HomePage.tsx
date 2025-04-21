"use client";

import React, { useState, Suspense } from 'react';
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import LoginButton from './LoginButton'; // Make sure the path is correct

const HomePage = () => {
  const { data: session } = useSession();
  const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false);

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
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src="/homepage_background1.png"
        className="absolute top-0 left-0 w-full h-full object-cover"
        alt="Background"
      />
      <Suspense fallback={null}>
        <LoginButton />
      </Suspense>
    </div>
  );
};

export default HomePage;
