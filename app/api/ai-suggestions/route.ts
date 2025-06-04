import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for API key
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBLgmaZD3pedhpMiTNhQxj7cjcMpFBf2ns';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestion = response.text();

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('AI Suggest API Error:', error);
    
    // Handle rate limiting
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again in a few moments.' 
      }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate suggestion' 
    }, { status: 500 });
  }
}