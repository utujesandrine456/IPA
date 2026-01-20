import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            studentId,
            phone,
            address,
            companyName,
            companyAddress,
            supervisorName,
            supervisorEmail,
            supervisorId
        } = body;

        if (!studentId) {
            return NextResponse.json(
                { error: 'Student ID is required' },
                { status: 400 }
            );
        }

        const updateData: any = {
            phone,
            address,
            companyName,
            companyAddress,
            supervisorName,
            supervisorEmail,
            profileCompleted: true,
        };

        if (supervisorId) {
            updateData.supervisorId = Number(supervisorId);
        }

        const updatedStudent = await prisma.student.update({
            where: { id: Number(studentId) },
            data: updateData,
        });

        return NextResponse.json(
            { message: 'Profile updated successfully', student: updatedStudent },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error updating student profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile', details: error.message },
            { status: 500 }
        );
    }
}
