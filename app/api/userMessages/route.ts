import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";
import { Messages } from "openai/resources/beta/threads/messages.mjs";

export async function GET(req:Request){
    const getMessages=await prisma.message.findMany({
        where:{
            rating: 0,
            sender: 'AI',
            messageType: 'ANSWER'
        },
        orderBy: {
            createdAt: 'desc'
        },
        select: {
            id: true,
            content: true,
            isResolved: true,
            reviewComments: true,
            createdAt: true,
            reviewAdvisorComments: true,
            reviewerAction: true,
            reviewAdvisorCommentedOn: true,
            question: {
                select: {
                    content: true
                }
            }
        }
    })
    return NextResponse.json({'messages':getMessages})
}

export async function POST(req:Request){
    const res=await req.json();
    const {message_id, reviewer_comments} = res;
    const updateComment = await prisma.message.update({
        where:{
            id: message_id
        },
        data:{
            reviewAdvisorComments: reviewer_comments,
            reviewAdvisorCommentedOn: new Date()
        }
    })
    return NextResponse.json({'status':'Comment updated!!!'})
}