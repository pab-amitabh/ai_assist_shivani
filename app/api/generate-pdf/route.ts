import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const { content, formData } = await request.json();
    
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set font
    doc.setFont('times', 'normal');
    
    // Header
    doc.setFontSize(10);
    doc.text('policyadvisor.com', 105, 20, { align: 'center' });
    doc.text('Simple, Quick, Online Insurance', 105, 25, { align: 'center' });
    
    // Draw line under header
    doc.line(20, 30, 190, 30);
    
    // Process content
    const lines = content.split('\n');
    let yPosition = 45;
    const pageHeight = 280;
    const lineHeight = 6;
    const marginLeft = 20;
    const marginRight = 190;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        yPosition += lineHeight / 2;
        continue;
      }
      
      // Check if we need a new page
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Handle different formatting
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Headers
        const header = trimmedLine.replace(/\*\*/g, '');
        if (header.includes('Explanation of Advantages and Disadvantages')) {
          doc.setFontSize(16);
          doc.setFont('times', 'bold');
          const splitTitle = doc.splitTextToSize(header, marginRight - marginLeft);
          splitTitle.forEach((titleLine: string, index: number) => {
            doc.text(titleLine, 105, yPosition + (index * lineHeight), { align: 'center' });
          });
          yPosition += splitTitle.length * lineHeight + 10;
        } else if (!header.startsWith('Section ') && !['Header Section:', 'Opening:'].includes(header)) {
          doc.setFontSize(16);
          doc.setFont('times', 'bold');
          const splitHeader = doc.splitTextToSize(header, marginRight - marginLeft);
          splitHeader.forEach((headerLine: string, index: number) => {
            doc.text(headerLine, marginLeft, yPosition + (index * lineHeight));
          });
          yPosition += splitHeader.length * lineHeight + 8;
        }
      } else if (trimmedLine.startsWith('Client Name:') || trimmedLine.startsWith('Existing Insurance') || trimmedLine.startsWith('Company Issuing')) {
        // Client info headers
        doc.setFontSize(13);
        doc.setFont('times', 'bold');
        const splitInfo = doc.splitTextToSize(trimmedLine, marginRight - marginLeft);
        splitInfo.forEach((infoLine: string, index: number) => {
          doc.text(infoLine, marginLeft, yPosition + (index * lineHeight));
        });
        yPosition += splitInfo.length * lineHeight + 4;
      } else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
        // List items
        doc.setFontSize(11);
        doc.setFont('times', 'normal');
        const splitList = doc.splitTextToSize(trimmedLine, marginRight - marginLeft - 10);
        splitList.forEach((listLine: string, index: number) => {
          doc.text(listLine, marginLeft + 5, yPosition + (index * lineHeight));
        });
        yPosition += splitList.length * lineHeight + 2;
      } else if (trimmedLine.startsWith('_____')) {
        // Signature lines
        doc.setFontSize(11);
        doc.setFont('times', 'normal');
        doc.text(trimmedLine, marginLeft, yPosition);
        yPosition += lineHeight + 5;
      } else {
        // Regular paragraphs
        doc.setFontSize(11);
        doc.setFont('times', 'normal');
        const splitText = doc.splitTextToSize(trimmedLine, marginRight - marginLeft);
        splitText.forEach((textLine: string, index: number) => {
          doc.text(textLine, marginLeft, yPosition + (index * lineHeight));
        });
        yPosition += splitText.length * lineHeight + 4;
      }
    }
    
    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    // Set filename
    const filename = `Policy_Replacement_${formData.client_name?.replace(/\s+/g, '_') || 'Document'}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
} 