import { NextResponse } from "next/server"
import prisma from "../../libs/prismadb"


export async function POST(req: Request) {
	const res = await req.json()
	const { email,mode } = res
    
	// let userChats = await prisma.user.findUnique({
	// 	where: {
	// 		email: email
	// 	},
	// 	include: {
	// 		chats: {
    //             include: {
    //                 messages: true
    //             }
    //         }
	// 	}
	// })

    let userChats = await prisma.user.findUnique({
		where: { email },
		include: {
			chats: {
				where: {
					archieve: false,
					chatType: mode,
				},
				include: { messages: true },
			},
		},
	});


    const defaultChat = await prisma.chat.create({
		data: {
			user: {
				connect: {
					email: email
				}
			},
            messages: {
                create: {
                    content: "Hello, I am PolicyAdvisor AI Assistant. What can I help you with?",
                    sender: "AI",
                    messageType: "ANSWER",
                    isResolved: false,
                    questionId: null
                }
            },
            chatType: mode
		}
	})

	userChats = userChats.chats
	return NextResponse.json({userChats})
}

