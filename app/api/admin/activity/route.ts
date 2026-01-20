import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Fetch recent tasks (logs)
        const recentTasks = await prisma.task.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    include: { user: true }
                }
            }
        });

        // Fetch recent ratings
        const recentRatings = await prisma.rating.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    include: { user: true }
                },
                supervisor: {
                    include: { user: true }
                }
            }
        });

        // Combine and sort
        const activities = [
            ...recentTasks.map(task => ({
                type: 'TASK_SUBMISSION',
                id: task.id,
                title: task.title,
                description: task.description,
                user: task.student.user.name,
                date: task.createdAt,
                status: task.status
            })),
            ...recentRatings.map(rating => ({
                type: 'RATING',
                id: rating.id,
                title: `Rated ${rating.rating}/10`,
                description: rating.comment,
                user: rating.supervisor.user.name,
                target: rating.student.user.name,
                date: rating.createdAt
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20);

        return NextResponse.json({ activities }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching admin activity:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activity', details: error.message },
            { status: 500 }
        );
    }
}
