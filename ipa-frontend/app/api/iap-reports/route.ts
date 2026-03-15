// Prisma type re-index
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
        }

        const report = await prisma.iapReport.findUnique({
            where: { studentId: Number(studentId) },
        });

        return NextResponse.json(report || {}, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching IAP report:', error);
        return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, ...reportData } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
        }

        const result = await prisma.iapReport.upsert({
            where: { studentId: Number(studentId) },
            update: { ...reportData },
            create: {
                studentId: Number(studentId),
                ...reportData
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Error saving IAP report:', error);
        return NextResponse.json({ error: 'Failed to save report', details: error.message }, { status: 500 });
    }
}

