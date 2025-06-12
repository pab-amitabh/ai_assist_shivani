"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { FileText, Download, ArrowLeft, Edit3, Eye, Save, Clock, CheckCircle, AlertCircle } from "lucide-react";
import DocumentEditor from './DocumentEditor';

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

interface DocumentPreviewProps {
  content: string;
  formData: FormData;
  onBack: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ content, formData, onBack }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [activeTab, setActiveTab] = useState('preview');
  const [downloadProgress, setDownloadProgress] = useState<{ type: 'pdf' | 'docx' | null; progress: number }>({ type: null, progress: 0 });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Update edited content when content prop changes
  useEffect(() => {
    setEditedContent(content);
    setHasUnsavedChanges(false);
  }, [content]);

  const handleContentChange = useCallback((newContent: string) => {
    setEditedContent(newContent);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
  }, []);

  const handleSave = useCallback(() => {
    setSaveStatus('saving');
    
    const timer1 = setTimeout(() => {
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      const timer2 = setTimeout(() => setSaveStatus('idle'), 2000);
      return timer2;
    }, 500);
    
    return () => {
      clearTimeout(timer1);
    };
  }, []);

  const simulateProgress = useCallback((type: 'pdf' | 'docx') => {
    setDownloadProgress({ type, progress: 0 });
    
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev.progress >= 90) {
          clearInterval(interval);
          return prev;
        }
        return { ...prev, progress: prev.progress + 10 };
      });
    }, 200);

    return () => {
      clearInterval(interval);
      setDownloadProgress({ type: null, progress: 0 });
    };
  }, []);

  const handleDownloadDOCX = useCallback(async () => {
    const cleanup = simulateProgress('docx');
    
    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent, formData }),
      });
      
      setDownloadProgress(prev => ({ ...prev, progress: 70 }));
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Policy_Replacement_${formData.client_name.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setDownloadProgress(prev => ({ ...prev, progress: 100 }));
        setTimeout(cleanup, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate DOCX');
      }
    } catch (error) {
      console.error('DOCX download failed:', error);
      cleanup();
      alert(error instanceof Error ? error.message : 'DOCX download failed. Please try again.');
    }
  }, [editedContent, formData, simulateProgress]);

  const handleDownloadPDF = useCallback(async () => {
    const cleanup = simulateProgress('pdf');
    
    try {
      // First generate the DOCX file
      const docxResponse = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent, formData }),
      });
      
      if (!docxResponse.ok) {
        const errorData = await docxResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate DOCX');
      }

      setDownloadProgress(prev => ({ ...prev, progress: 50 }));

      const docxBlob = await docxResponse.blob();
      
      // Create FormData for Adobe PDF Services
      const uploadFormData = new FormData();
      uploadFormData.append('file', docxBlob, 'document.docx');
      
      setDownloadProgress(prev => ({ ...prev, progress: 70 }));
      
      // Convert DOCX to PDF using Adobe PDF Services
      const pdfResponse = await fetch('/api/convert-to-pdf', {
        method: 'POST',
        body: uploadFormData,
      });
      
      setDownloadProgress(prev => ({ ...prev, progress: 90 }));
      
      if (pdfResponse.ok) {
        const pdfBlob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Policy_Replacement_${formData.client_name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setDownloadProgress(prev => ({ ...prev, progress: 100 }));
        setTimeout(cleanup, 1000);
      } else {
        const errorData = await pdfResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to convert to PDF');
      }
    } catch (error) {
      console.error('PDF download failed:', error);
      cleanup();
      // Show error to user
      alert(error instanceof Error ? error.message : 'PDF download failed. Trying DOCX instead.');
      // Fallback to DOCX if PDF conversion fails
      handleDownloadDOCX();
    }
  }, [editedContent, formData, simulateProgress, handleDownloadDOCX]);

  const renderPreviewContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <div key={index} className="h-2" />;
        
        // Format headers with proper hierarchy - using Garamond font and correct sizes
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          const header = trimmedLine.replace(/\*\*/g, '');
          if (header.includes('Explanation of Advantages and Disadvantages')) {
            return (
              <h1 key={index} className="text-center mb-6 mt-8 text-gray-900 border-b pb-4" style={{ fontFamily: 'Garamond, serif', fontSize: '16pt', fontWeight: 'bold' }}>
                {header}
              </h1>
            );
          } else if (
            header.includes('Summary of policy replacement') ||
            header.includes('Why doesn\'t the existing policy meet your needs?') ||
            header.includes('How does the new policy meet your needs?') ||
            header.includes('What are the risks associated with the proposed replacement?') ||
            header.includes('More Information')
          ) {
            // Subheadings - 14pt bold with appropriate spacing
            return (
              <h2 key={index} className="mb-3 mt-6 text-gray-800 border-l-4 border-blue-500 pl-4 bg-blue-50 py-2" style={{ fontFamily: 'Garamond, serif', fontSize: '14pt', fontWeight: 'bold' }}>
                {header}
              </h2>
            );
          }
        }
        // Format client info headers - 11pt bold with tight spacing
        else if (trimmedLine.startsWith('Client Name:') || trimmedLine.startsWith('Current Policy Number:') || trimmedLine.startsWith('Existing Insurance') || trimmedLine.startsWith('Company Issuing')) {
          return (
            <div key={index} className="mb-1 text-gray-900 bg-gray-50 p-2 rounded" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt', fontWeight: 'bold' }}>
              {trimmedLine}
            </div>
          );
        }
        // Format lists - 11pt with tight spacing, convert asterisks to proper bullets
        else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          const bulletText = trimmedLine.startsWith('* ') ? trimmedLine.replace(/^\* /, '• ') : trimmedLine;
          return (
            <div key={index} className="ml-6 mb-2 text-gray-700 flex items-start" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt', lineHeight: '1.4' }}>
              <span className="text-blue-600 mr-2 mt-1">•</span>
              <span>{bulletText.replace(/^[•\-*]\s*/, '')}</span>
            </div>
          );
        }
        // Format signature lines - 11pt
        else if (trimmedLine.startsWith('_____')) {
          return (
            <div key={index} className="my-4 text-gray-700 border-t border-dashed pt-2" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt' }}>
              {trimmedLine}
            </div>
          );
        }
        // Separator line - 11pt
        else if (trimmedLine.includes('________________________________________________________________________________________')) {
          return (
            <div key={index} className="my-6">
              <Separator className="border-gray-300" />
            </div>
          );
        }
        // Regular paragraphs - 11pt body text with tight spacing
        else {
          return (
            <p key={index} className="mb-2 text-gray-700 text-justify leading-relaxed" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt', lineHeight: '1.5' }}>
              {trimmedLine}
            </p>
          );
        }
        return null;
      })
      .filter(Boolean);
  };

  const ProgressIndicator = ({ type, progress }: { type: 'pdf' | 'docx'; progress: number }) => (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="w-4 h-4 animate-spin" />
      <span>Converting to {type.toUpperCase()}...</span>
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{progress}%</span>
    </div>
  );

  const SaveIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Clock className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Saved</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="shadow-lg border-0 mb-6 bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="flex items-center gap-2 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Form
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {formData.policy_category === 'couple' ? 'Couple Policy' : 'Individual Policy'}
                  </Badge>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm font-medium text-gray-700">{formData.client_name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <SaveIndicator />
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Unsaved changes</span>
                  </div>
                )}
                
                {downloadProgress.type && (
                  <ProgressIndicator type={downloadProgress.type} progress={downloadProgress.progress} />
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadDOCX}
                    disabled={downloadProgress.type === 'docx'}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download DOCX
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadPDF}
                    disabled={downloadProgress.type === 'pdf'}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b bg-gray-50/50">
                <div className="flex items-center justify-between px-6 py-4">
                  <TabsList className="grid w-64 grid-cols-2 bg-white shadow-sm">
                    <TabsTrigger 
                      value="preview" 
                      className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="edit"
                      className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </TabsTrigger>
                  </TabsList>
                  
                  {activeTab === 'edit' && hasUnsavedChanges && (
                    <Button
                      onClick={handleSave}
                      disabled={saveStatus === 'saving'}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="preview" className="mt-0 p-0">
                {/* Document Header with Logo */}
                <div className="text-center py-8 px-8 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-center mb-4">
                    <Image
                      src="/policyadvisorlogo.png"
                      alt="PolicyAdvisor"
                      width={200}
                      height={67}
                      className="h-auto"
                    />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-800">Policy Replacement Document</h1>
                  <p className="text-sm text-gray-600 mt-1">Generated on {formData.date}</p>
                </div>
                
                {/* Document Content */}
                <div className="p-8 max-w-4xl mx-auto bg-white min-h-[600px]">
                  <div className="prose prose-sm max-w-none">
                    {renderPreviewContent(editedContent)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0 p-0">
                <DocumentEditor
                  content={editedContent}
                  formData={formData}
                  onContentChange={handleContentChange}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentPreview; 