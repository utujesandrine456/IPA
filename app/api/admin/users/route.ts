import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const users = await prisma.user.findMany({
            include: {
                studentProfile: true,
                supervisorProfile: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        
        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
