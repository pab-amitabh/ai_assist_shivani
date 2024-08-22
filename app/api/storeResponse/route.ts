import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";



export async function POST(req: Request) {
    const res = await req.json();
    const { question, answer } = res;

    let unresolvedQuery = await prisma.unresolvedQuestion.create({
        data: {
            question: question,
            answer: answer
        }
    })

    return NextResponse.json({})
}
