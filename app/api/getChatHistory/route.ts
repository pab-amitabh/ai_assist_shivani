import { NextResponse } from 'next/server'
import prisma from '../../libs/prismadb'

export async function POST(req:Request) {
	const res = await req.json()
	const { email, mode } = res

	let userChats = await prisma.user.findUnique({
		where: {
			email: email
		},
		include: {
			chats: {
                where: {
                    archieve: false,
                    chatType: mode 
                },
                include: {
                    messages: true
                }
            }
		}
	})

	userChats = userChats.chats
	return NextResponse.json({userChats})
}
