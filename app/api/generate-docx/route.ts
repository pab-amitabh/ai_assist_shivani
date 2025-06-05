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

    // Add logo and header information first
    try {
      // Try to use the SVG logo first, fallback to PNG if available
      const svgLogoPath = path.join(process.cwd(), 'public', 'policyadvisor-logo.svg');
      const pngLogoPath = path.join(process.cwd(), 'public', 'policyadvisorlogo.png');
      
      let logoBuffer = null;
      let logoType = '';
      
      if (fs.existsSync(svgLogoPath)) {
        // For SVG, we need to convert or use PNG fallback
        if (fs.existsSync(pngLogoPath)) {
          logoBuffer = fs.readFileSync(pngLogoPath);
          logoType = 'png';
        }
      } else if (fs.existsSync(pngLogoPath)) {
        logoBuffer = fs.readFileSync(pngLogoPath);
        logoType = 'png';
      }
      
      if (logoBuffer) {
        children.push(new Paragraph({
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: {
                width: 300,
                height: 100,
              },
              type: logoType as any,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }, // Double spacing after logo
        }));
      }
    } catch {
      console.log('Logo not found, adding text header instead');
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: "🏛️ policyadvisor.com",
            size: 28, // 14pt = 28 half-points
            bold: true,
            font: 'Garamond',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
    }

    children.push(new Paragraph({
      children: [
        new TextRun({
          text: "Simple, Quick, Online Insurance",
          size: 22, // 11pt = 22 half-points
          font: 'Garamond',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 }, // Double spacing after header
    }));

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        // Add empty paragraph for spacing
        children.push(new Paragraph({
          children: [new TextRun({ text: "", font: 'Garamond' })],
          spacing: { after: 120 }, // Single spacing
        }));
        continue;
      }

      // Handle different formatting based on content
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold headers
        const header = trimmedLine.replace(/\*\*/g, '');
        if (header.includes('Explanation of Advantages and Disadvantages')) {
          // Main title
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                size: 28, // 14pt bold
                font: 'Garamond',
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 }, // Double spacing
          }));
        } else if (
          header.includes('Summary of policy replacement') ||
          header.includes('Why doesn\'t the existing policy meet your needs?') ||
          header.includes('How does the new policy meet your needs?') ||
          header.includes('What are the risks associated with the proposed replacement?') ||
          header.includes('More Information')
        ) {
          // Subheadings - 14pt bold
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                size: 28, // 14pt = 28 half-points
                font: 'Garamond',
              }),
            ],
            spacing: { before: 480, after: 240 }, // Double spacing before, single after
          }));
        }
        // Skip other section headers
      } else if (trimmedLine.startsWith('Client Name:') || trimmedLine.startsWith('Existing Insurance') || trimmedLine.startsWith('Company Issuing')) {
        // Header info lines - make them bold, 11pt
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              bold: true,
              size: 22, // 11pt = 22 half-points
              font: 'Garamond',
            }),
          ],
          spacing: { after: 120 }, // Single spacing
        }));
      } else if (trimmedLine.startsWith('Dear ')) {
        // Greeting - add double space before
        children.push(new Paragraph({
          children: [new TextRun({ text: "", font: 'Garamond' })],
          spacing: { after: 240 }, // Double spacing
        }));
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: 240 }, // Double spacing after greeting
        }));
      } else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
        // List items - 11pt
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          bullet: {
            level: 0,
          },
          spacing: { after: 120 }, // Single spacing
        }));
      } else if (trimmedLine.startsWith('_____')) {
        // Signature line - add double space before
        children.push(new Paragraph({
          children: [new TextRun({ text: "", font: 'Garamond' })],
          spacing: { after: 240 }, // Double spacing
        }));
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: 240 }, // Double spacing after signature section
        }));
      } else if (trimmedLine.includes('________________________________________________________________________________________')) {
        // Separator line - add double spacing before and after
        children.push(new Paragraph({
          children: [new TextRun({ text: "", font: 'Garamond' })],
          spacing: { after: 240 }, // Double spacing before
        }));
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: 240 }, // Double spacing after
        }));
      } else {
        // Regular paragraph - 11pt body text
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt = 22 half-points
              font: 'Garamond',
            }),
          ],
          spacing: { after: 120 }, // Single spacing between paragraphs
        }));
      }
    }

    // Create a new document with single section and Garamond font
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Garamond',
            },
          },
        },
      },
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