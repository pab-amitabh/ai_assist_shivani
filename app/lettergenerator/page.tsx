"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import PolicyReplacementGenerator from './PolicyReplacementGenerator';
import DocumentPreview from './DocumentPreview';
import Header from '../components/header';

interface FormData {
  policy_category: string;
  client_name: string;
  spouse_name?: string;
  client_age?: number;
  spouse_age?: number;
  line_of_credit?: string;
  date: string;
  existing_company: string;
  existing_policy_type: string;
  existing_coverage: string;
  existing_coverage_primary?: string;
  existing_coverage_spouse?: string;
  existing_premium: string;
  existing_premium_primary?: string;
  existing_premium_spouse?: string;
  new_company: string;
  new_policy_type: string;
  new_coverage: string;
  new_coverage_primary?: string;
  new_coverage_spouse?: string;
  new_premium: string;
  new_premium_total?: string;
  replacement_reason: string;
  benefits_new: string;
  disadvantages_old: string;
  agent_name: string;
  agent_license?: string;
  agent_phone?: string;
}

export default function LetterGeneratorPage() {
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [showDocument, setShowDocument] = useState(false);

  const allowedEmails = [
    "amitabh.bhatia@gmail.com", 
    "jitenpuri@gmail.com", 
    "heenabanka@gmail.com", 
    "shivani.lpu71096@gmail.com",
    "siling@policyadvisor.com",
    "amitabh@policyadvisor.com",
    "jiten@policyadvisor.com",
    "shivani@policyadvisor.com",
    "heena@policyadvisor.com",
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
  }, [status, session, router, allowedEmails, allowedDomain]);

  const handleDocumentGenerated = (content: string, data: FormData) => {
    setGeneratedContent(content);
    setFormData(data);
    setShowDocument(true);
  };

  const handleBackToForm = () => {
    setShowDocument(false);
  };

  const email = session?.user?.email || "";
  if (
    status === "loading" || 
    (status === "authenticated" && 
      !(
        allowedEmails.includes(email) || 
        email.endsWith(allowedDomain)
      ))
  ) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {!showDocument ? (
          <PolicyReplacementGenerator onDocumentGenerated={handleDocumentGenerated} />
        ) : (
          <DocumentPreview 
            content={generatedContent}
            formData={formData}
            onBack={handleBackToForm}
          />
        )}
      </main>
    </>
  );
}
