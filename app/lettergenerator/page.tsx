"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import PolicyReplacementGenerator from './PolicyReplacementGenerator';
import DocumentPreview from './DocumentPreview';
import Header from '../components/header';
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { FileText, User, Briefcase, Plus } from "lucide-react";

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
  existing_policy_number: string;
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

const LetterGeneratorPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);

  const allowedEmails = useMemo(() => [
    "amitabh.bhatia@gmail.com", 
    "jitenpuri@gmail.com", 
    "heenabanka@gmail.com", 
    "shivani.lpu71096@gmail.com",
    "siling@policyadvisor.com",
    "amitabh@policyadvisor.com",
    "jiten@policyadvisor.com",
    "shivani@policyadvisor.com",
    "heena@policyadvisor.com",
  ], []);
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
  }, [status, session, router, allowedEmails]);

  const handleDocumentGenerated = (content: string, data: FormData) => {
    setGeneratedContent(content);
    setSavedFormData(data);
    setCurrentStep('preview');
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  const handleNewForm = () => {
    setSavedFormData(null);
    setGeneratedContent('');
    setCurrentStep('form');
  };

  const getStepIcon = (step: 'form' | 'preview') => {
    switch (step) {
      case 'form':
        return <User className="w-5 h-5" />;
      case 'preview':
        return <FileText className="w-5 h-5" />;
      default:
        return <Briefcase className="w-5 h-5" />;
    }
  };

  const getStepTitle = (step: 'form' | 'preview') => {
    switch (step) {
      case 'form':
        return 'Form Input';
      case 'preview':
        return 'Document Preview';
      default:
        return 'Complete';
    }
  };

  const getStepDescription = (step: 'form' | 'preview') => {
    switch (step) {
      case 'form':
        return 'Enter policy and client information';
      case 'preview':
        return 'Review and edit your document';
      default:
        return 'Download your completed document';
    }
  };

  // Authentication check
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

  if (currentStep === 'preview' && generatedContent && savedFormData) {
    return (
      <>
        <Header />
        <DocumentPreview
          content={generatedContent}
          formData={savedFormData}
          onBack={handleBackToForm}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Progress Indicator */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                {/* Form Step */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    currentStep === 'form' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}>
                    {getStepIcon('form')}
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${
                      currentStep === 'form' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getStepTitle('form')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getStepDescription('form')}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className={`w-8 h-0.5 transition-colors ${
                  currentStep === 'preview' ? 'bg-green-400' : 'bg-gray-300'
                }`} />

                {/* Preview Step */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    currentStep === 'preview' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    {getStepIcon('preview')}
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${
                      currentStep === 'preview' ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {getStepTitle('preview')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getStepDescription('preview')}
                    </div>
                  </div>
                </div>
              </div>

              {/* New Form Button - Show only when there's saved data */}
              {savedFormData && (
                <Button
                  onClick={handleNewForm}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Form
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative">
          <PolicyReplacementGenerator 
            onDocumentGenerated={handleDocumentGenerated}
            initialFormData={savedFormData}
          />
        </div>
      </div>
    </>
  );
};

export default LetterGeneratorPage;
