import prisma from "../../libs/prismadb";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const res=await req.json()
    const {chatId}=res
    const archiveChat=await prisma.chat.update({
        where:{
            id: chatId
        },
        data:{
            archieve: true
        }
    })
    return NextResponse.json({})
}