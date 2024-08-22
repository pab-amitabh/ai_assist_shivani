import fs from "fs";
import { OpenAIFiles } from "langchain/experimental/openai_files";
import { NextResponse } from "next/server";
import OpenAI from 'openai';


export const POST = async (req: Request) => {

    
    try {
        console.log("Working....")
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
        })

        console.log(transcription.text);
        return NextResponse.json({transcription: transcription.text})
    }
    catch (e) {
        console.log(e);
        return NextResponse.json({error: e})
    }
}
