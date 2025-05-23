import prisma from '../../libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(req:Request){
    const res=await req.json();
    const {message_id,reviewer_action} = res;
    console.log(reviewer_action)
    const action=await prisma.message.update({
        where:{
            id:message_id
        },
        data:{
            reviewerAction: reviewer_action
        }
    })
    console.log(action)
    return NextResponse.json({'status':'action_updated'})
}