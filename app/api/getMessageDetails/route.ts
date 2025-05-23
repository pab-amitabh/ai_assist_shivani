import { NextResponse } from "next/server";
import prisma from '../../libs/prismadb';
import { Questrial } from "next/font/google";

export async function POST(req:Request){
    const res=await req.json();
    const {message_id}=res;
    const response=await prisma.message.findUnique({
        where: {
            id: message_id,
        },
        select:{
            question: {
                select:{
                    content: true,
                    id: true
                }
            },
            questionId: true
        }
    })
    console.log(response)
    return NextResponse.json({response: response})
}