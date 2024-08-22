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
				messages: ["Hello, I am an AI Assitant designed to help you with all things related to Policy Advisor and Insurance"],
				user: {
					connect: {
						email: email
					}
				}
			}
		})
	}
	return NextResponse.json({})

	
}
