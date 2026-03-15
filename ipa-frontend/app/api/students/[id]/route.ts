import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id);
        if (Number.isNaN(id)) {
            return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                supervisor: {
                    include: {
                        user: true
                    }
                },
                ratings: true,
                iapReport: true
            },
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json({ student }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching student:', error);
        return NextResponse.json({ error: 'Failed to fetch student', details: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id);
        const body = await request.json();
        const { absentDays, ...otherData } = body;

        const student = await prisma.student.update({
            where: { id },
            data: {
                absentDays: absentDays !== undefined ? Number(absentDays) : undefined,
                ...otherData
            },
        });

        return NextResponse.json({ message: 'Student updated successfully', student }, { status: 200 });
    } catch (error: any) {
        console.error('Error updating student:', error);
        return NextResponse.json({ error: 'Failed to update student', details: error.message }, { status: 500 });
    }
}
