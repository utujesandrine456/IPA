import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
        const offset = parseInt(searchParams.get('offset') || '0');

        const supervisors = await prisma.supervisor.findMany({
            take: limit,
            skip: offset,
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

        return NextResponse.json({ supervisors }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching supervisors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch supervisors', details: error.message },
            { status: 500 }
        );
    }
}
