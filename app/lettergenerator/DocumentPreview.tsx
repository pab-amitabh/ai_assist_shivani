"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FileText, Download, ArrowLeft, Edit3, Eye } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [editedContent, setEditedContent] = useState(content);

  const handleDownloadPDF = async () => {
    try {
      // First generate the DOCX file
      const docxResponse = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent, formData }),
      });
      
      if (!docxResponse.ok) {
        throw new Error('Failed to generate DOCX');
      }

      const docxBlob = await docxResponse.blob();
      
      // Create FormData for Adobe PDF Services
      const uploadFormData = new FormData();
      uploadFormData.append('file', docxBlob, 'document.docx');
      
      // Convert DOCX to PDF using Adobe PDF Services
      const pdfResponse = await fetch('/api/convert-to-pdf', {
        method: 'POST',
        body: uploadFormData,
      });
      
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
      } else {
        throw new Error('Failed to convert to PDF');
      }
    } catch (error) {
      console.error('PDF download failed:', error);
      // Fallback to DOCX if PDF conversion fails
      handleDownloadDOCX();
    }
  };

  const handleDownloadDOCX = async () => {
    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent, formData }),
      });
      
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
      }
    } catch (error) {
      console.error('DOCX download failed:', error);
    }
  };

  const renderPreviewContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <div key={index} className="h-1" />;
        
        // Format headers with proper hierarchy - using Garamond font and correct sizes
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          const header = trimmedLine.replace(/\*\*/g, '');
          if (header.includes('Explanation of Advantages and Disadvantages')) {
            return (
              <h1 key={index} className="text-center mb-4 mt-4 text-gray-900" style={{ fontFamily: 'Garamond, serif', fontSize: '14pt', fontWeight: 'bold' }}>
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
              <h2 key={index} className="mb-2 mt-4 text-gray-800" style={{ fontFamily: 'Garamond, serif', fontSize: '14pt', fontWeight: 'bold' }}>
                {header}
              </h2>
            );
          }
        }
        // Format client info headers - 11pt bold with tight spacing
        else if (trimmedLine.startsWith('Client Name:') || trimmedLine.startsWith('Current Policy Number:') || trimmedLine.startsWith('Existing Insurance') || trimmedLine.startsWith('Company Issuing')) {
          return (
            <div key={index} className="mb-1 text-gray-900" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt', fontWeight: 'bold' }}>
              {trimmedLine}
            </div>
          );
        }
        // Format lists - 11pt with tight spacing, convert asterisks to proper bullets
        else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          const bulletText = trimmedLine.startsWith('* ') ? trimmedLine.replace(/^\* /, '• ') : trimmedLine;
          return (
            <div key={index} className="ml-8 mb-1 text-gray-700" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt', lineHeight: '1.2' }}>
              {bulletText}
            </div>
          );
        }
        // Format signature lines - 11pt
        else if (trimmedLine.startsWith('_____')) {
          return (
            <div key={index} className="my-2 text-gray-700" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt' }}>
              {trimmedLine}
            </div>
          );
        }
        // Separator line - 11pt
        else if (trimmedLine.includes('________________________________________________________________________________________')) {
          return (
            <div key={index} className="my-3 text-gray-700" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt' }}>
              {trimmedLine}
            </div>
          );
        }
        // Regular paragraphs - 11pt body text with tighter spacing
        else {
          return (
            <p key={index} className="mb-0.5 text-gray-700 text-justify" style={{ fontFamily: 'Garamond, serif', fontSize: '11pt', lineHeight: '1.2' }}>
              {trimmedLine}
            </p>
          );
        }
        return null;
      })
      .filter(Boolean);
  };

  if (activeTab === 'edit') {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Tab Navigation */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('preview')}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Document
                  </Button>
                </div>
                <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Form
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Document Editor */}
          <DocumentEditor
            content={editedContent}
            formData={formData}
            onContentChange={setEditedContent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('edit')}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Document
                </Button>
              </div>
              <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Form
              </Button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">
                Document Generated Successfully
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Preview your document or edit it before downloading
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Document Summary */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold text-foreground mb-4">Document Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Client:</strong> {formData.client_name}
                  {formData.spouse_name && (
                    <span> & {formData.spouse_name}</span>
                  )}
                </div>
                <div>
                  <strong>Date:</strong> {formData.date}
                </div>
                <div>
                  <strong>Policy Type:</strong> {formData.policy_category}
                </div>
                <div>
                  <strong>Agent:</strong> {formData.agent_name}
                </div>
                <div>
                  <strong>Existing Company:</strong> {formData.existing_company}
                </div>
                <div>
                  <strong>New Company:</strong> {formData.new_company}
                </div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-6 py-3"
                variant="default"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button
                onClick={handleDownloadDOCX}
                className="flex items-center gap-2 px-6 py-3"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                Download Word
              </Button>
            </div>

            {/* Document Preview */}
            <div className="border rounded-lg p-8 bg-white space-y-4 max-h-96 overflow-y-auto">
              <div className="prose prose-gray max-w-none">
                {renderPreviewContent(editedContent)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentPreview; 