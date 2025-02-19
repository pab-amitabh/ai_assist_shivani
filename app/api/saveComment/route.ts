import prisma from "../../libs/prismadb";
import { NextResponse } from "next/server";

export async function POST(req:Request){
    const res=await req.json()
    const {message_value,message_id} = res;
    const saveComment=await prisma.message.update({
        where:{
            id: message_id
        },
        data:{
            reviewComments: message_value,
            commentAddedAt: new Date()
        }
    })
    return NextResponse.json({'commentMessage': saveComment.reviewComments})
}