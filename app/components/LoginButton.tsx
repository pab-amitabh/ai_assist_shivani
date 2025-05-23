"use client";

import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginButton() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/";

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${rawCallback}`
      : rawCallback;

  return (
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
  );
}
