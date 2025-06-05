import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let documentContent: string | undefined;
  let formData: { client_name?: string; [key: string]: unknown } | undefined;

  try {
    const requestData = await request.json();
    documentContent = requestData.content;
    formData = requestData.formData;
    
    // Simply redirect to the existing PDF generation endpoint
    // This avoids issues with the convert-multiple-files library
    const response = await fetch(`${request.nextUrl.origin}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: documentContent, formData }),
    });

    if (response.ok) {
      const pdfBuffer = await response.arrayBuffer();
      
      const filename = `Policy_Replacement_${formData?.client_name?.replace(/\s+/g, '_') || 'Document'}.pdf`;
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      throw new Error('PDF generation failed');
    }

  } catch (error) {
    console.error('PDF conversion error:', error);
    
    // Fallback to DOCX if PDF fails and we have the data
    if (documentContent && formData) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/generate-docx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: documentContent, formData }),
        });

        if (response.ok) {
          const docxBuffer = await response.arrayBuffer();
          
          const filename = `Policy_Replacement_${formData?.client_name?.replace(/\s+/g, '_') || 'Document'}.docx`;
          
          return new NextResponse(docxBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          });
        }
      } catch (fallbackError) {
        console.error('DOCX fallback failed:', fallbackError);
      }
    }
    
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
} 