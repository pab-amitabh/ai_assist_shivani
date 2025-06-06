import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Header, ImageRun } from 'docx';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { content, formData } = await request.json();
    
    console.log('DOCX Generation - Creating document with uniform spacing...');
    
    // Process content line by line
    const lines = content.split('\n');
    const children: Paragraph[] = [];

    // Standard spacing for everything (0.5 spacing = 30 half-points)
    const standardSpacing = 30;

    // Create header with logo (matching template structure)
    let headerParagraphs: Paragraph[] = [];
    try {
      const pngLogoPath = path.join(process.cwd(), 'public', 'policyadvisorlogo.png');
      
      if (fs.existsSync(pngLogoPath)) {
        const logoBuffer = fs.readFileSync(pngLogoPath);
        headerParagraphs.push(new Paragraph({
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: {
                // Correct dimensions: 1.3cm height = 37 points, 6.95cm width = 197 points
                width: 197,  // 6.95cm in points (28.35 points per cm)
                height: 37,  // 1.3cm in points (28.35 points per cm)
              },
              type: 'png',
            }),
          ],
          alignment: AlignmentType.CENTER,
        }));
      }
    } catch (error) {
      console.log('Logo not found for header');
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty lines with standard spacing
        children.push(new Paragraph({
          children: [new TextRun({ text: "", font: 'Garamond' })],
          spacing: { after: standardSpacing },
        }));
        continue;
      }

      console.log(`Processing line ${i}: "${trimmedLine.substring(0, 50)}..."`);

      // Handle different formatting based on content
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Bold headers
        const header = trimmedLine.replace(/\*\*/g, '');
        console.log(`Found header: "${header}"`);
        
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
            spacing: { before: 120, after: standardSpacing }, // Same spacing as body
          }));
        } else if (
          header.includes('Summary of policy replacement') ||
          header.includes('Why doesn\'t the existing policy meet your needs?') ||
          header.includes('How does the new policy meet your needs?') ||
          header.includes('What are the risks associated with the proposed replacement?') ||
          header.includes('More Information')
        ) {
          // Subheadings - 14pt bold with SAME spacing as body text
          console.log(`Found subheading: "${header}"`);
          children.push(new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                size: 28, // 14pt = 28 half-points
                font: 'Garamond',
              }),
            ],
            spacing: { before: standardSpacing, after: standardSpacing }, // Same as body spacing
          }));
        }
        // Skip other section headers
      } else if (trimmedLine.startsWith('Client Name:') || trimmedLine.startsWith('Existing Insurance') || trimmedLine.startsWith('Company Issuing') || trimmedLine.startsWith('Current Policy Number:')) {
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
          spacing: { after: standardSpacing },
        }));
      } else if (trimmedLine.startsWith('Dear ')) {
        // Greeting - standard spacing
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: standardSpacing },
        }));
      } else if (trimmedLine.match(/^\d+\./) || trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
        // List items - 11pt with standard spacing
        const listText = trimmedLine.replace(/^[\d\.\-•\s]+/, '').trim(); // Remove leading bullets/numbers and spaces
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: listText,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          bullet: {
            level: 0,
          },
          spacing: { after: standardSpacing },
        }));
      } else if (trimmedLine.startsWith('_____') || trimmedLine === '__________________________') {
        // Signature line - exactly 26 underscores with standard spacing
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: '__________________________',  // Exactly 26 underscores
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: standardSpacing },
        }));
      } else if (trimmedLine.includes('________________________________________________________________________________________')) {
        // Skip separator lines - we only want one set of dashes from signature lines above
        continue;
      } else if (trimmedLine.includes('I understand the explanation provided')) {
        // Signature acknowledgment
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: standardSpacing },
        }));
      } else if (trimmedLine === formData.client_name || (formData.spouse_name && trimmedLine === formData.spouse_name)) {
        // Client signature names
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: standardSpacing },
        }));
      } else if (trimmedLine.startsWith('Date:') || trimmedLine === 'Date:') {
        // Date line
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: standardSpacing },
        }));
      } else if (trimmedLine === formData.agent_name || trimmedLine === 'Advisor') {
        // Agent name or title
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt body text
              font: 'Garamond',
            }),
          ],
          spacing: { after: standardSpacing },
        }));
      } else {
        // Regular paragraph - 11pt body text with standard spacing
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22, // 11pt = 22 half-points
              font: 'Garamond',
            }),
          ],
          spacing: { after: standardSpacing },
        }));
      }
    }

    console.log(`Generated ${children.length} paragraphs for DOCX`);

    // Create a new document with header and uniform spacing
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
        headers: {
          default: new Header({
            children: headerParagraphs,
          }),
        },
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