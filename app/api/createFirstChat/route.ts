import { NextResponse } from "next/server"
import prisma from "../../libs/prismadb"


export async function POST(req: Request) {
	const res = await req.json()
	const { email } = res

	const userChats = await prisma.user.findUnique({
		where: {
			email: email
		},
		include: {
			chats: true,
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
                        content: "Hello, I am PolicyAdvisor AI Assitant. What can I help you with?",
                        sender: "AI",
                        messageType: "ANSWER",
                        isResolved: false
                    }
                }
			}
		})

        
	}
	return NextResponse.json({})

	
}
