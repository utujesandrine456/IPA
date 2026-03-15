// Prisma type re-index
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const supervisorId = searchParams.get('supervisorId');
        const weekNumber = searchParams.get('weekNumber');

        if (studentId) {
            const where: any = { studentId: Number(studentId) };
            if (weekNumber) where.weekNumber = Number(weekNumber);

            const logs = await prisma.weeklyLog.findMany({
                where,
                orderBy: { weekNumber: 'desc' },
            });

            return NextResponse.json({ logs }, { status: 200 });
        }

        if (supervisorId) {
            const logs = await prisma.weeklyLog.findMany({
                where: {
                    student: {
                        supervisorId: Number(supervisorId)
                    }
                },
                include: {
                    student: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            });

            return NextResponse.json({ logs }, { status: 200 });
        }

        return NextResponse.json(
            { error: 'studentId or supervisorId is required' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error fetching weekly logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weekly logs', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, weekNumber, ...logData } = body;

        if (!studentId || !weekNumber) {
            return NextResponse.json(
                { error: 'studentId and weekNumber are required' },
                { status: 400 }
            );
        }

        // Convert date strings to Date objects if they exist
        const processedData: any = { ...logData };
        if (logData.startDate) processedData.startDate = new Date(logData.startDate);
        if (logData.endDate) processedData.endDate = new Date(logData.endDate);
        if (logData.supervisorDate) processedData.supervisorDate = new Date(logData.supervisorDate);

        const result = await prisma.weeklyLog.upsert({
            where: {
                studentId_weekNumber: {
                    studentId: Number(studentId),
                    weekNumber: Number(weekNumber)
                }
            },
            update: processedData,
            create: {
                studentId: Number(studentId),
                weekNumber: Number(weekNumber),
                ...processedData
            },
        });

        return NextResponse.json(
            { message: 'Weekly log saved successfully', log: result },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error saving weekly log:', error);
        return NextResponse.json(
            { error: 'Failed to save weekly log', details: error.message },
            { status: 500 }
        );
    }
}
