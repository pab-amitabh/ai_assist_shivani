import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    try {
        const info = await req.json();
        const { text } = info;

        const openai = new OpenAI();
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });
        
        const buffer = Buffer.from(await mp3.arrayBuffer());
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
        
    } 
    catch (e) {
        console.log(e);
        return NextResponse.json({error: e})
    }
  
}
