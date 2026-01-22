import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: Number(userId) },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ notifications });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, read, userId } = body;

        if (id) {
            await prisma.notification.update({
                where: { id: Number(id) },
                data: { read: !!read },
            });
        } else if (userId) {
            await prisma.notification.updateMany({
                where: { userId: Number(userId), read: false },
                data: { read: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const userId = searchParams.get("userId");

        if (id) {
            await prisma.notification.delete({
                where: { id: Number(id) },
            });
        } else if (userId) {
            await prisma.notification.deleteMany({
                where: { userId: Number(userId) },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
