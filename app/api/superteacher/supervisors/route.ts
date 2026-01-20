import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const supervisors = await prisma.supervisor.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ supervisors });
    } catch (error: any) {
        console.error("Error fetching supervisors:", error);
        return NextResponse.json(
            { error: "Failed to fetch supervisors" },
            { status: 500 }
        );
    }
}
