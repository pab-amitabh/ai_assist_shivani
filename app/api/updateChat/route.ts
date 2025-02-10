import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";

export async function POST(req: Request) {
    const res = await req.json();
    const { chatId, message, messageType, sender, questionId, isResolved } = res;

    const messageData: any = {
        content: message,
        sender: sender,
        messageType: messageType,
        isResolved: isResolved,
        chat: {
            connect: { id: chatId }
        }
    };

    if (questionId) {
        messageData.question = { connect: { id: questionId } };
    }

    const newMessage = await prisma.message.create({
        data: messageData,
        select: {
            id: true 
        }
    });

    return NextResponse.json({ question_id: newMessage.id }); 
}
