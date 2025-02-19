import { NextResponse } from 'next/server'
import prisma from '../../libs/prismadb'

export async function POST(req:Request) {
	const res = await req.json()
	const { email } = res

	let userChats = await prisma.user.findUnique({
		where: {
			email: email
		},
		include: {
			chats: {
                where: {
                    archieve: false 
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
