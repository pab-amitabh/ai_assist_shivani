import { NextRequest, NextResponse } from 'next/server';

const ADOBE_CLIENT_ID = process.env.ADOBE_CLIENT_ID;
const ADOBE_CLIENT_SECRET = process.env.ADOBE_CLIENT_SECRET;
const ADOBE_ORG_ID = process.env.ADOBE_ORG_ID;

interface AdobeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface UploadAssetResponse {
  assetID: string;
  uploadUri: string;
}

interface CreateJobResponse {
  headers: {
    location: string;
  };
}

interface JobStatusResponse {
  status: 'in progress' | 'done' | 'failed';
  asset?: {
    downloadUri: string;
    assetID: string;
  };
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch('https://pdf-services.adobe.io/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data: AdobeTokenResponse = await response.json();
  return data.access_token;
}

async function uploadAsset(accessToken: string, fileBuffer: Buffer, clientId: string): Promise<UploadAssetResponse> {
  // Step 1: Get upload pre-signed URI
  const uploadUriResponse = await fetch('https://pdf-services.adobe.io/assets', {
    method: 'POST',
    headers: {
      'X-API-Key': clientId,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }),
  });

  if (!uploadUriResponse.ok) {
    throw new Error(`Failed to get upload URI: ${uploadUriResponse.statusText}`);
  }

  const uploadData: UploadAssetResponse = await uploadUriResponse.json();

  // Step 2: Upload file to the pre-signed URI
  const uploadResponse = await fetch(uploadData.uploadUri, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
  }

  return uploadData;
}

async function createConversionJob(accessToken: string, assetID: string, clientId: string): Promise<string> {
  const response = await fetch('https://pdf-services.adobe.io/operation/createpdf', {
    method: 'POST',
    headers: {
      'X-API-Key': clientId,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assetID: assetID
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversion job: ${response.statusText}`);
  }

  const location = response.headers.get('location');
  if (!location) {
    throw new Error('No location header in job creation response');
  }

  return location;
}

async function pollJobStatus(accessToken: string, jobLocation: string, clientId: string): Promise<JobStatusResponse> {
  let attempts = 0;
  const maxAttempts = 30; // 30 attempts with 2-second intervals = 1 minute max
  
  while (attempts < maxAttempts) {
    const response = await fetch(jobLocation, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check job status: ${response.statusText}`);
    }

    const status: JobStatusResponse = await response.json();
    
    if (status.status === 'done' || status.status === 'failed') {
      return status;
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Job polling timeout - conversion took too long');
}

async function downloadPDF(downloadUri: string): Promise<Buffer> {
  const response = await fetch(downloadUri);
  
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!ADOBE_CLIENT_ID || !ADOBE_CLIENT_SECRET || !ADOBE_ORG_ID) {
      console.error('Missing Adobe PDF Services API credentials in environment variables');
      return NextResponse.json({
        error: 'Adobe PDF Services API not configured. Please contact support.'
      }, { status: 500 });
    }

    // Type assertion after validation
    const clientId = ADOBE_CLIENT_ID as string;
    const clientSecret = ADOBE_CLIENT_SECRET as string;
    const orgId = ADOBE_ORG_ID as string;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 });
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    console.log('Starting PDF conversion process...');

    // Step 1: Get access token
    console.log('Getting access token...');
    const accessToken = await getAccessToken(clientId, clientSecret);

    // Step 2: Upload asset
    console.log('Uploading document...');
    const uploadResult = await uploadAsset(accessToken, fileBuffer, clientId);

    // Step 3: Create conversion job
    console.log('Creating conversion job...');
    const jobLocation = await createConversionJob(accessToken, uploadResult.assetID, clientId);

    // Step 4: Poll for job completion
    console.log('Waiting for conversion to complete...');
    const jobResult = await pollJobStatus(accessToken, jobLocation, clientId);

    if (jobResult.status === 'failed') {
      throw new Error('PDF conversion failed');
    }

    if (!jobResult.asset?.downloadUri) {
      throw new Error('No download URI in job result');
    }

    // Step 5: Download the converted PDF
    console.log('Downloading converted PDF...');
    const pdfBuffer = await downloadPDF(jobResult.asset.downloadUri);

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="converted-document.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF conversion error:', error);
    return NextResponse.json({
      error: 'Failed to convert document to PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 