'use client'

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import HomePage from "./components/HomePage";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  return (
    <div className="w-full h-screen">
      {status === "loading" ? (
        <div className="text-center mt-20 text-blue-800 text-xl">Loading...</div>
      ) : (
        <HomePage />
      )}
    </div>
  );
}
