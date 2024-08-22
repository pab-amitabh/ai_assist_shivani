import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";

export async function POST(req: Request) {
	const res = await req.json();
	const { chatId, message } = res;
	// console.log("This is typeof chatID", typeof chatId)
	// console.log("chatID from API", chatId)

	let chat = await prisma.chat.update({
		where: {
			id: chatId,
		},
		data: {
			messages: {
				push: message,
			}
		}

	})
	return NextResponse.json({})




}
