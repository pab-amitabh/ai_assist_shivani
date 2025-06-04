import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, UnderlineType, ImageRun } from 'docx';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { content, formData } = await request.json();
    
    // Process content line by line
    const lines = content.split('\n');
    const children: Paragraph[] = [];

    // Add logo and header information first (like the Flask app does)
    try {
      const logoPath = path.join(process.cwd(), 'public', 'policyadvisorlogo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        children.push(new Paragraph({
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: {
                width: 200,
                height: 80,
              },
              type: 'png',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }));
      }
    } catch {
      console.log('Logo not found, adding text header instead');
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: "🏛️ policyadvisor.com",
            size: 24,
            bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }));
    }

    children.push(new Paragraph({
      children: [
        new TextRun({
          text: "Simple, Quick, Online Insurance",
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }, // Add more space after header
    }));

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        // Add empty paragraph for spacing
        children.push(new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 100 },
        }));
        continue;
      }

      // Handle different formatting based on content (matching Flask app logic)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold headers
        const header = trimmedLine.replace(/\*\*/g, '');
        if (header.includes('Explanation of Advantages and Disadvantages')) {
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }));
        } else if (!header.startsWith('Section ') && !['Header Section:', 'Opening:'].includes(header)) {
          // Make subheadings bold and underlined (like Flask app) - LARGER font
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                underline: {
                  type: UnderlineType.SINGLE,
                },
                size: 32, // Much larger for subheadings
              }),
            ],
            spacing: { before: 300, after: 150 }, // More spacing around headers
          }));
        }
        // Skip Section headers like Flask app does
      } else if (trimmedLine.startsWith('Client Name:') || trimmedLine.startsWith('Existing Insurance') || trimmedLine.startsWith('Company Issuing')) {
        // Header info lines - make them bold
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              bold: true,
              size: 26, // Slightly larger for client info
            }),
          ],
          spacing: { after: 150 },
        }));
      } else if (trimmedLine.startsWith('Dear ')) {
        // Greeting - add space before (like Flask app)
        children.push(new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 100 },
        }));
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // Regular body text size
            }),
          ],
          spacing: { after: 200 },
        }));
      } else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
        // List items - use bullet style like Flask app
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // Regular body text size
            }),
          ],
          bullet: {
            level: 0,
          },
          spacing: { after: 120 },
        }));
      } else if (trimmedLine.startsWith('_____')) {
        // Signature line - add space before like Flask app
        children.push(new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 100 },
        }));
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // Regular body text size
            }),
          ],
          spacing: { after: 200 },
        }));
      } else {
        // Regular paragraph - SMALLER font for body text
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // Smaller body text
            }),
          ],
          spacing: { after: 180 }, // Good spacing between paragraphs
        }));
      }
    }

    // Create a new document with single section (fixing page numbering)
    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    // Generate the DOCX buffer
    const buffer = await Packer.toBuffer(doc);
    
    // Set the filename
    const filename = `Policy_Replacement_${formData.client_name?.replace(/\s+/g, '_') || 'Document'}.docx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
} 