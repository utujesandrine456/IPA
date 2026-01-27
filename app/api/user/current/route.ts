import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get('userId');

        if (!userIdParam) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        const userId = Number(userIdParam);
        if (Number.isNaN(userId)) {
            return NextResponse.json(
                { error: 'Invalid userId' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                studentProfile: {
                    select: {
                        id: true,
                        studentNumber: true,
                        fullName: true,
                        supervisor: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
                supervisorProfile: {
                    select: {
                        id: true,
                        department: true,
                        phone: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { user },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error fetching current user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user', details: error.message },
            { status: 500 }
        );
    }
}
