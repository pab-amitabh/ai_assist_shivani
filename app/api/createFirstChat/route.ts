import { NextResponse } from "next/server"
import prisma from "../../libs/prismadb"


export async function POST(req: Request) {
	const res = await req.json()
	const { email,mode } = res
	const userChats = await prisma.user.findUnique({
		where: { email },
		include: {
			chats: {
				where: {
					chatType: mode
				}
			}
		}
	})
	if (!userChats || userChats.chats.length === 0) {
		const defaultChat = await prisma.chat.create({
			data: {
				user: {
					connect: {
						email: email
					}
				},
                messages: {
                    create:{
                        content: "Hello, I am PolicyAdvisor AI Assistant. What can I help you with?",
                        sender: "AI",
                        messageType: "ANSWER",
                        isResolved: false
                    }
                },
                chatType: mode
			}
		})
	}
	return NextResponse.json({})
}
