import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentIdParam = searchParams.get('studentId');

        if (!studentIdParam || isNaN(Number(studentIdParam))) {
            return NextResponse.json({ error: 'Valid studentId is required' }, { status: 400 });
        }

        const logs = await prisma.logEntry.findMany({
            where: { studentId: Number(studentIdParam) },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, content, date } = body;

        if (!studentId || !content) {
            return NextResponse.json({ error: 'studentId and content are required' }, { status: 400 });
        }
        
        const log = await prisma.logEntry.create({
            data: {
                studentId: Number(studentId),
                content,
                date: date ? new Date(date) : new Date(),
            },
        });

        return NextResponse.json({ log }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
