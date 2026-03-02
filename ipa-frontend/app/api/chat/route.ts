import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId"); // Could be Sender or Receiver
        const otherUserId = searchParams.get("otherUserId");

        if (!userId || !otherUserId) {
            return NextResponse.json({ error: "Missing user IDs" }, { status: 400 });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: Number(userId), receiverId: Number(otherUserId) },
                    { senderId: Number(otherUserId), receiverId: Number(userId) },
                ]
            },
            include: {
                sender: true,
                receiver: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json({ messages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { senderId, receiverId, content } = body;

        const message = await prisma.message.create({
            data: {
                senderId: Number(senderId),
                receiverId: Number(receiverId),
                content,
                read: false
            },
            include: {
                sender: true
            }
        });

        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
