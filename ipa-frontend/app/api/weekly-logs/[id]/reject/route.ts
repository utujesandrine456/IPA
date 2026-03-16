// Prisma type re-index
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = Number(idParam);
        const body = await request.json();
        const { note } = body;

        const log = await prisma.weeklyLog.update({
            where: { id },
            data: {
                status: 'REJECTED',
                generalStatement: note ? note : undefined,
            },
        });

        return NextResponse.json({ message: 'Log rejected', log }, { status: 200 });
    } catch (error: any) {
        console.error('Error rejecting weekly log:', error);
        return NextResponse.json(
            { error: 'Failed to reject log', details: error.message },
            { status: 500 }
        );
    }
}

