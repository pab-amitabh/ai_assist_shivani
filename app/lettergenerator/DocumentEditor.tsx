"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import Image from 'next/image';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Download, 
  FileText, 
  Undo, 
  Redo,
  Minus,
  Plus
} from "lucide-react";
import { cn } from "../libs/utils";

interface DocumentFormData {
  client_name?: string;
  policy_category?: string;
  spouse_name?: string;
  client_age?: number;
  spouse_age?: number;
  line_of_credit?: string;
  date?: string;
  existing_company?: string;
  existing_policy_type?: string;
  existing_coverage?: string;
  existing_coverage_primary?: string;
  existing_coverage_spouse?: string;
  existing_premium?: string;
  existing_premium_primary?: string;
  existing_premium_spouse?: string;
  new_company?: string;
  new_policy_type?: string;
  new_coverage?: string;
  new_coverage_primary?: string;
  new_coverage_spouse?: string;
  new_premium?: string;
  new_premium_total?: string;
  replacement_reason?: string;
  benefits_new?: string;
  disadvantages_old?: string;
  agent_name?: string;
  agent_license?: string;
  agent_phone?: string;
}

interface DocumentEditorProps {
  content: string;
  formData: DocumentFormData;
  onContentChange: (content: string) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ content, formData, onContentChange }) => {
  const [fontSize, setFontSize] = useState(12);
  const [isDownloading, setIsDownloading] = useState({ pdf: false, docx: false });
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = formatContent(content);
    }
  }, [content]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const textContent = editorRef.current.innerText || editorRef.current.textContent || '';
      onContentChange(textContent);
    }
  };

  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return '<div style="margin: 10px 0;"><br></div>';
        
        // Format headers with proper hierarchy - using relative sizes
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          const header = trimmedLine.replace(/\*\*/g, '');
          if (header.includes('Explanation of Advantages and Disadvantages')) {
            return `<h1 style="text-align: center; font-weight: bold; font-size: 1.8em; margin: 25px 0; color: #1a1a1a;">${header}</h1>`;
          } else if (!header.startsWith('Section ') && !['Header Section:', 'Opening:'].includes(header)) {
            return `<h2 style="font-weight: bold; text-decoration: underline; font-size: 1.4em; margin: 20px 0 12px 0; color: #2c2c2c;">${header}</h2>`;
          }
        }
        // Format client info headers
        else if (trimmedLine.startsWith('Client Name:') || trimmedLine.startsWith('Existing Insurance') || trimmedLine.startsWith('Company Issuing')) {
          return `<div style="font-weight: bold; margin: 15px 0; color: #1a1a1a; font-size: 1.1em;">${trimmedLine}</div>`;
        }
        // Format lists with proper indentation
        else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
          return `<div style="margin-left: 25px; margin: 8px 0 8px 25px; line-height: 1.6; font-size: 1em;">${trimmedLine}</div>`;
        }
        // Format signature lines
        else if (trimmedLine.startsWith('_____')) {
          return `<div style="margin: 25px 0; font-size: 1em;">${trimmedLine}</div>`;
        }
        // Regular paragraphs with better typography
        else {
          return `<div style="margin: 15px 0; line-height: 1.7; text-align: justify; font-size: 1em;">${trimmedLine}</div>`;
        }
        return `<div style="margin: 10px 0; line-height: 1.6; font-size: 1em;">${trimmedLine}</div>`;
      })
      .join('');
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(8, Math.min(72, fontSize + delta));
    setFontSize(newSize);
    if (editorRef.current) {
      editorRef.current.style.fontSize = `${newSize}px`;
    }
  };

  const downloadDocument = async (format: 'pdf' | 'docx') => {
    setIsDownloading(prev => ({ ...prev, [format]: true }));
    
    try {
      const textContent = editorRef.current?.innerText || editorRef.current?.textContent || '';
      const endpoint = format === 'pdf' ? '/api/convert-to-pdf' : '/api/generate-docx';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: textContent, 
          formData 
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Policy_Replacement_${formData.client_name?.replace(/\s+/g, '_') || 'Document'}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Failed to download ${format.toUpperCase()}. Please try again.`);
      }
    } catch (error) {
      console.error(`${format.toUpperCase()} download error:`, error);
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsDownloading(prev => ({ ...prev, [format]: false }));
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-xl">
      <CardHeader className="border-b bg-muted/50">
        <CardTitle className="text-lg font-medium">Document Editor</CardTitle>
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 pt-4">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('undo')}
            className="h-8 w-8 p-0"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('redo')}
            className="h-8 w-8 p-0"
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Font Size */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFontSizeChange(-1)}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm min-w-[2rem] text-center">{fontSize}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFontSizeChange(1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyLeft')}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyCenter')}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyRight')}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyFull')}
            className="h-8 w-8 p-0"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertUnorderedList')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertOrderedList')}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-2" />
          
          {/* Download Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadDocument('pdf')}
            disabled={isDownloading.pdf}
            className="ml-auto"
          >
            {isDownloading.pdf ? (
              <>Processing...</>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadDocument('docx')}
            disabled={isDownloading.docx}
          >
            {isDownloading.docx ? (
              <>Processing...</>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                DOCX
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Document Header with Logo */}
        <div className="text-center py-6 px-8 border-b bg-gray-50">
          <div className="flex items-center justify-center mb-3">
            <Image
              src="/policyadvisorlogo.png"
              alt="PolicyAdvisor"
              width={120}
              height={40}
              className="h-auto"
            />
          </div>
          <div className="text-sm text-gray-600 font-medium">Simple, Quick, Online Insurance</div>
        </div>
        
        {/* Editor Content */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          className={cn(
            "min-h-[600px] p-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
            "prose prose-sm max-w-none text-gray-900 leading-relaxed"
          )}
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: '1.7',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}
        />
      </CardContent>
    </Card>
  );
};

export default DocumentEditor; 