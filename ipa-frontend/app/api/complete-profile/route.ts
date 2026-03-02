import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            token,
            password,
            phone,
            address,
            companyName,
            companyAddress,
            companyPhone,
            companyEmail,
            supervisorName,
            supervisorEmail,
            internshipStart,
            internshipEnd,
            supervisorId,
        } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Find student by token
        const student = await prisma.student.findUnique({
            where: { profileToken: token },
            include: { user: true },
        });

        if (!student) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 404 }
            );
        }

        if (student.profileCompleted) {
            return NextResponse.json(
                { error: 'Profile already completed' },
                { status: 400 }
            );
        }

        // Hash password if provided
        let hashedPassword = student.user.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Update user password
        await prisma.user.update({
            where: { id: student.userId },
            data: { password: hashedPassword },
        });

        // Update student profile
        const updatedStudent = await prisma.student.update({
            where: { id: student.id },
            data: {
                phone: phone || student.phone,
                address,
                companyName,
                companyAddress,
                companyPhone,
                companyEmail,
                supervisorName,
                supervisorEmail,
                internshipStart: internshipStart ? new Date(internshipStart) : null,
                internshipEnd: internshipEnd ? new Date(internshipEnd) : null,
                supervisorId: supervisorId || student.supervisorId,
                profileCompleted: true,
                profileToken: null, // Clear token after completion
            },
            include: {
                user: true,
                supervisor: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                message: 'Profile completed successfully',
                student: updatedStudent,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error completing profile:', error);
        return NextResponse.json(
            { error: 'Failed to complete profile', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        const student = await prisma.student.findUnique({
            where: { profileToken: token },
            include: {
                user: true,
                supervisor: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!student) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 404 }
            );
        }

        if (student.profileCompleted) {
            return NextResponse.json(
                { error: 'Profile already completed' },
                { status: 400 }
            );
        }

        return NextResponse.json({ student }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profile', details: error.message },
            { status: 500 }
        );
    }
}
