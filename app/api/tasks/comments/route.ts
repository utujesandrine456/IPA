import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, supervisorId, content } = body;

    if (!taskId || !content) {
      return NextResponse.json(
        { error: 'taskId and content are required' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        supervisorId: supervisorId || null,
        content,
      },
      include: {
        task: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Comment added successfully', comment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment', details: error.message },
      { status: 500 }
    );
  }
}



