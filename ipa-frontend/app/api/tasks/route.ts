import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');
    const supervisorIdParam = searchParams.get('supervisorId');

    const supervisorId = supervisorIdParam ? Number(supervisorIdParam) : undefined;
    const studentId = studentIdParam ? Number(studentIdParam) : undefined;

    if (supervisorId) {
      const students = await prisma.student.findMany({
        where: { supervisorId },
        select: { id: true },
      });

      const studentIds = students.map((s) => s.id);

      const tasks = await prisma.task.findMany({
        where: {
          studentId: { in: studentIds },
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          comments: {
            include: {
              task: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      return NextResponse.json({ tasks }, { status: 200 });
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId or supervisorId is required' },
        { status: 400 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { studentId },
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, title, description, date } = body;

    const studentIdNumber = Number(studentId);

    if (!studentIdNumber || !title) {
      return NextResponse.json(
        { error: 'studentId and title are required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        studentId: studentIdNumber,
        title,
        description,
        date: date ? new Date(date) : new Date(),
        status: 'PENDING',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (task.student?.user?.id) {
      await prisma.notification.create({
        data: {
          userId: task.student.user.id,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${title}"`,
          type: 'TASK',
          link: `/student/${studentIdNumber}`
        }
      });
    }

    return NextResponse.json(
      { message: 'Task created successfully', task },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, status, description, attachments, rating, comment } = body;

    const taskIdNumber = Number(taskId);

    if (!taskIdNumber || !status) {
      return NextResponse.json(
        { error: 'taskId and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (description) {
      updateData.description = description + (attachments ? `\n\nAttachments: ${attachments}` : '');
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Add submission timestamp if status changes to IN_PROGRESS (Review Submitted)
    if (status === 'IN_PROGRESS') {
      updateData.submittedAt = new Date();
    }

    const task = await prisma.task.update({
      where: { id: taskIdNumber },
      data: updateData,
      include: {
        student: {
          include: {
            user: true,
            supervisor: {
              include: {
                user: true
              }
            }
          },
        },
        comments: true,
      },
    });

    // Create Notification
    if (status === 'IN_PROGRESS' && task.student?.supervisor?.user?.id) {
      // Notify Supervisor that student submitted work
      await prisma.notification.create({
        data: {
          userId: task.student.supervisor.user.id,
          title: 'Task Submission',
          message: `${task.student.user.name} has submitted work for "${task.title}"`,
          type: 'TASK',
          link: `/supervisor/${task.student.supervisor.id}?tab=tasks`
        }
      });
    } else if ((status === 'COMPLETED' || status === 'PENDING' || status === 'REJECTED') && task.student?.user?.id) {
      const isApproved = status === 'COMPLETED';
      const notifType = isApproved ? 'SUCCESS' : 'WARNING';
      const notifTitle = isApproved ? 'Task Approved' : 'Task Revision Requested';
      const notifMessage = isApproved
        ? `Your work for "${task.title}" has been approved!`
        : `Your work for "${task.title}" needs revision.`;

      await prisma.notification.create({
        data: {
          userId: task.student.user.id,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          link: `/student/${task.student.id}`
        }
      });
    }

    if (rating || comment) {
      await prisma.comment.create({
        data: {
          taskId: taskIdNumber,
          content: `Rating: ${rating}/10${comment ? `\n\nFeedback: ${comment}` : ''}`,
          supervisorId: body.supervisorId || null,
        },
      });
    }

    return NextResponse.json(
      { message: 'Task updated successfully', task },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: error.message },
      { status: 500 }
    );
  }
}



