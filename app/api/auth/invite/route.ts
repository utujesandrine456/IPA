import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { studentId, email } = await request.json();

        if (!studentId || !email) {
            return NextResponse.json(
                { error: "Student ID and Email are required" },
                { status: 400 }
            );
        }


        const token = `invite_${studentId}_${Date.now()}`;

        await prisma.student.update({
            where: { id: Number(studentId) },
            data: { profileToken: token }
        });

        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/complete-profile?token=${token}`;

        console.log(`[MOCK EMAIL SERVICE] Sending invite to ${email}`);
        console.log(`[MOCK EMAIL SERVICE] Link: ${inviteLink}`);

        return NextResponse.json({
            message: "Invite sent successfully",
            link: inviteLink
        });
    } catch (error: any) {
        console.error("Invite error:", error);
        return NextResponse.json(
            { error: "Failed to send invite" },
            { status: 500 }
        );
    }
}
