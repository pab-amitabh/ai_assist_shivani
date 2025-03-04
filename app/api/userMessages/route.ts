import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";
import { skip } from "node:test";

export async function GET(req:Request){
    const {searchParams}=new URL(req.url);
    const per_page=parseInt(searchParams.get("per_page") || "10")
    const start_from=parseInt(searchParams.get("start_from") || "0")
    const getMessages=await prisma.message.findMany({
        skip:start_from,
        take:per_page,
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
            chatId: true,
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
            },
            chat: {
                select: {
                    user: {
                        select: {
                            name: true
                        }
                    }
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