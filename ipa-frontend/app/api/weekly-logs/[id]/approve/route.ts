// Prisma type re-index
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id);
        const body = await request.json();
        const { grade, supervisorName, supervisorDate, note } = body;

        const log = await prisma.weeklyLog.update({
            where: { id },
            data: {
                grade,
                supervisorName,
                supervisorDate: supervisorDate ? new Date(supervisorDate) : new Date(),
                supervisorSignature: true,
                status: 'COMPLETED',
                generalStatement: note ? note : undefined, // Using generalStatement as a place for feedback if note is provided
            },
        });

        return NextResponse.json({ message: 'Log approved', log }, { status: 200 });
    } catch (error: any) {
        console.error('Error approving weekly log:', error);
        return NextResponse.json(
            { error: 'Failed to approve log', details: error.message },
            { status: 500 }
        );
    }
}

