"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { 
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Highlighter,
  List,
  ListOrdered,
  Undo,
  Redo,
  Wand2,
  Check,
  Loader2
} from "lucide-react";

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

interface DocumentEditorProps {
  content: string;
  formData: FormData;
  onContentChange: (content: string) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ content, formData, onContentChange }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [htmlContent, setHtmlContent] = useState('');
  const [fontSize, setFontSize] = useState('12');
  const [fontFamily, setFontFamily] = useState('Garamond');
  const editorRef = useRef<HTMLDivElement>(null);

  const convertToHTML = useCallback((text: string) => {
    return text
      .split('\n')
      .map((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return '<div><br></div>';
        
        // Format headers
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          const header = trimmedLine.replace(/\*\*/g, '');
          if (header.includes('Explanation of Advantages and Disadvantages')) {
            return `<h1 style="text-align: center; margin: 24px 0; color: #1f2937; font-weight: bold; font-size: 18px; font-family: ${fontFamily}, serif;">${header}</h1>`;
          } else {
            return `<h2 style="margin: 20px 0 12px 0; color: #374151; font-weight: 600; font-size: 16px; font-family: ${fontFamily}, serif;">${header}</h2>`;
          }
        }
        // Format client info headers
        else if (
          trimmedLine.startsWith('Client Name:') || 
          trimmedLine.startsWith('Current Policy Number:') || 
          trimmedLine.startsWith('Existing Insurance') || 
          trimmedLine.startsWith('Company Issuing')
        ) {
          return `<div style="margin: 8px 0; color: #1f2937; background-color: #f3f4f6; padding: 8px; border-radius: 4px; font-weight: bold; font-size: ${fontSize}pt; font-family: ${fontFamily}, serif;">${trimmedLine}</div>`;
        }
        // Format lists
        else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          const bulletText = trimmedLine.startsWith('* ') ? trimmedLine.replace(/^\* /, '') : trimmedLine.replace(/^[•\-*]\s*/, '');
          return `<div style="margin-left: 20px; margin-bottom: 8px; color: #374151; font-size: ${fontSize}pt; font-family: ${fontFamily}, serif; display: flex;"><span style="margin-right: 8px;">•</span><span>${bulletText}</span></div>`;
        }
        // Format signature lines
        else if (trimmedLine.startsWith('_____')) {
          return `<div style="margin: 16px 0; color: #374151; font-size: ${fontSize}pt; font-family: ${fontFamily}, serif;">${trimmedLine}</div>`;
        }
        // Regular paragraphs
        else {
          return `<p style="margin-bottom: 8px; color: #374151; line-height: 1.6; font-size: ${fontSize}pt; font-family: ${fontFamily}, serif;">${trimmedLine}</p>`;
        }
      })
      .join('');
  }, [fontFamily, fontSize]);

  useEffect(() => {
    setEditedContent(content);
    setHtmlContent(convertToHTML(content));
  }, [content, fontFamily, fontSize, convertToHTML]);

  const convertFromHTML = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Better HTML to text conversion that preserves structure
    let text = '';
    const walkNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        
        if (tagName === 'h1' || tagName === 'h2') {
          text += `**${element.textContent?.trim()}**\n\n`;
        } else if (tagName === 'p') {
          if (element.textContent?.trim()) {
            text += `${element.textContent.trim()}\n`;
          }
        } else if (tagName === 'div') {
          const content = element.textContent?.trim();
          if (content) {
            if (content.startsWith('•')) {
              text += `• ${content.replace(/^•\s*/, '')}\n`;
            } else {
              text += `${content}\n`;
            }
          }
        } else if (tagName === 'br') {
          text += '\n';
        } else {
          // For other elements, walk their children
          for (const child of Array.from(element.childNodes)) {
            walkNodes(child);
          }
        }
      }
    };
    
    for (const child of Array.from(tempDiv.childNodes)) {
      walkNodes(child);
    }
    
    return text.trim();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = convertFromHTML(html);
      setEditedContent(text);
      onContentChange(text);
    }
  };

  const execCommand = (command: string, value?: string) => {
    try {
      document.execCommand(command, false, value);
    } catch (error) {
      console.error('Command failed:', command, error);
    }
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        execCommand('fontSize', '7');
        // Apply custom styling
        setTimeout(() => {
          const selectedElements = editorRef.current?.querySelectorAll('font[size="7"]');
          selectedElements?.forEach(el => {
            const span = document.createElement('span');
            span.style.fontSize = size + 'pt';
            span.innerHTML = el.innerHTML;
            el.parentNode?.replaceChild(span, el);
          });
        }, 10);
      } else {
        // Update global font size by regenerating HTML content
        setTimeout(() => {
          setHtmlContent(convertToHTML(editedContent));
        }, 10);
      }
    }
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        execCommand('fontName', family);
      } else {
        // Update global font family by regenerating HTML content
        setTimeout(() => {
          setHtmlContent(convertToHTML(editedContent));
        }, 10);
      }
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="flex flex-col h-full">
        {/* Formatting Toolbar */}
        <div className="bg-white border-b shadow-sm p-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Undo/Redo */}
            <Button variant="ghost" size="sm" onClick={() => execCommand('undo')} className="p-2">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand('redo')} className="p-2">
              <Redo className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Font Family */}
            <select 
              value={fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="border rounded px-2 py-1 text-sm min-w-24"
            >
              <option value="Garamond">Garamond</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>

            {/* Font Size */}
            <div className="flex items-center gap-1">
              <Type className="h-4 w-4 text-gray-600" />
              <select 
                value={fontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="24">24</option>
                <option value="28">28</option>
                <option value="32">32</option>
              </select>
            </div>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Text Formatting */}
            <Button variant="ghost" size="sm" onClick={() => execCommand('bold')} className="p-2">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand('italic')} className="p-2">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand('underline')} className="p-2">
              <Underline className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Text Color */}
            <div className="flex items-center gap-1">
              <Palette className="h-4 w-4 text-gray-600" />
              <input
                type="color"
                onChange={(e) => execCommand('foreColor', e.target.value)}
                className="w-8 h-6 border rounded cursor-pointer"
                title="Text Color"
              />
            </div>

            {/* Highlight Color */}
            <div className="flex items-center gap-1">
              <Highlighter className="h-4 w-4 text-gray-600" />
              <input
                type="color"
                onChange={(e) => execCommand('backColor', e.target.value)}
                className="w-8 h-6 border rounded cursor-pointer"
                title="Highlight Color"
              />
            </div>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Alignment */}
            <Button variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} className="p-2">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} className="p-2">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} className="p-2">
              <AlignRight className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            {/* Lists */}
            <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="p-2">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="p-2">
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6 overflow-auto">
          <Card className="max-w-4xl mx-auto min-h-[600px] relative bg-white">
            <CardContent className="p-8">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={updateContent}
                className="min-h-[500px] focus:outline-none"
                style={{ 
                  fontFamily: `${fontFamily}, serif`,
                  fontSize: `${fontSize}pt`,
                  lineHeight: '1.6',
                  color: '#374151'
                }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor; 