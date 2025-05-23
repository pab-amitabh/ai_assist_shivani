import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";

export async function POST(req: Request) {
    const res = await req.json();
    const { chatId, message, messageType, sender, questionId, isResolved, modelType  } = res;

    const messageData: any = {
        content: message,
        sender: sender,
        messageType: messageType,
        isResolved: isResolved,
        modelType: modelType,
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
