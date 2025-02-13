import prisma from "../../libs/prismadb";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const res = await req.json();
    const {chatId} = res
    console.log(chatId);

    // await prisma.message.deleteMany({
    //     where:{
    //         questionId:{
    //             not: null
    //         },
    //         chatId: chatId
    //     }
    // })

    // await prisma.message.deleteMany({
    //     where:{
    //         chatId: chatId
    //     }
    // })

    // const deletedChat=await prisma.chat.delete({
    //     where:{
    //         id: chatId
    //     }
    // })
    return NextResponse.json({success:true, message: "deleted successfully!"})
}