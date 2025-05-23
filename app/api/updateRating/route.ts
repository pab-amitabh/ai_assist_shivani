import { NextResponse } from "next/server";
import prisma from "../../libs/prismadb";

export async function POST(req: Request){
    const res=await req.json();
    console.log('res',res)
    const {message_id,rating}=res;
    const updateRating=await prisma.message.update({
        where:{
            id: message_id
        },
        data:{
            rating: rating
        },
        select:{
            rating: true
        }
    })
    return NextResponse.json({rating:updateRating.rating});
}

