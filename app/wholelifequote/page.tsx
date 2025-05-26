'use client'

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../components/header";

export default function WholeLifeQuote() {
  const allowedEmails = [
    "amitabh.bhatia@gmail.com", 
    "jitenpuri@gmail.com", 
    "anushae.hassan@gmail.com"
    // "shivani.lpu71096@gmail.com"
  ];
  const allowedDomain = "@policyadvisor.com";

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const email = session?.user?.email || "";
    const isUnauthorized =
      status === "unauthenticated" ||
      (status === "authenticated" &&
        !(
          allowedEmails.includes(email) ||
          email.endsWith(allowedDomain)
        ));

    if (isUnauthorized) {
      const currentPath = window.location.pathname;
      router.push(`/?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [status, session, router]);

  if (
    status === "loading" ||
    (status === "authenticated" &&
      !(
        allowedEmails.includes(session?.user?.email || "") ||
        (session?.user?.email || "").endsWith(allowedDomain)
      ))
  ) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Whole Life Quote Tools
            </h1>
            <p className="mt-3 text-xl text-gray-500">
              Access our whole life insurance tools and resources
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Whole Life Form Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <Link
                href="https://forms.zoho.com/policyadvisor/form/WholeLifeGrowth/"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 hover:text-gray-700">
                    Whole Life Form
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Access the whole life insurance form to submit new applications
                  </p>
                </div>
              </Link>
            </div>

            {/* Results Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
              <Link
                href="https://cloud.policyadvisor.com/ldlwka1eaa43cca2946fe94839286ffa7cd83/teams/ldlwka1eaa43cca2946fe94839286ffa7cd83/ws/kw9x72e963e4242bc4cac9f58bc03fabeffe2/folders/files"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 hover:text-gray-700">
                    View Data
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Access the results and submissions from the whole life form
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 