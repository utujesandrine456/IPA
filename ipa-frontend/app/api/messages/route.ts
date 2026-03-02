import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');
    const supervisorIdParam = searchParams.get('supervisorId');

    const supervisorId = supervisorIdParam ? Number(supervisorIdParam) : undefined;
    const studentId = studentIdParam ? Number(studentIdParam) : undefined;

    if (supervisorId && isNaN(supervisorId)) {
      return NextResponse.json(
        { error: 'Invalid supervisorId' },
        { status: 400 }
      );
    }

    if (studentId && isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid studentId' },
        { status: 400 }
      );
    }

    if (supervisorId !== undefined) {
      const students = await prisma.student.findMany({
        where: { supervisorId },
        select: { id: true },
      });

      const studentIds = students.map((s) => s.id);

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: { in: studentIds } },
            { receiverId: { in: studentIds } },
          ],
        },
        include: {
          sender: {
            include: {
              user: true,
            },
          },
          receiver: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ messages }, { status: 200 });
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId or supervisorId is required' },
        { status: 400 }
      );
    }

    // Get student's supervisor
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { supervisorId: true },
    });

    if (!student?.supervisorId) {
      return NextResponse.json(
        { error: 'Student has no supervisor assigned' },
        { status: 400 }
      );
    }

    // Get all students with the same supervisor
    const peers = await prisma.student.findMany({
      where: {
        supervisorId: student.supervisorId,
        id: { not: studentId },
      },
      include: {
        user: true,
      },
    });

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: studentId },
          { receiverId: studentId },
        ],
      },
      include: {
        sender: {
          include: {
            user: true,
          },
        },
        receiver: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { messages, peers },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    const senderIdNum = Number(senderId);
    const receiverIdNum = Number(receiverId);

    if (isNaN(senderIdNum) || isNaN(receiverIdNum) || !content) {
      return NextResponse.json(
        { error: 'Valid senderId, receiverId, and content are required' },
        { status: 400 }
      );
    }

    // Verify both students have the same supervisor
    const sender = await prisma.student.findUnique({
      where: { id: senderIdNum },
      select: { supervisorId: true },
    });

    const receiver = await prisma.student.findUnique({
      where: { id: receiverIdNum },
      select: { supervisorId: true },
    });

    if (!sender || !receiver) {
      return NextResponse.json(
        { error: 'Invalid sender or receiver' },
        { status: 400 }
      );
    }

    if (sender.supervisorId !== receiver.supervisorId) {
      return NextResponse.json(
        { error: 'Students must have the same supervisor to communicate' },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: senderIdNum,
        receiverId: receiverIdNum,
        content,
      },
      include: {
        sender: {
          include: {
            user: true,
          },
        },
        receiver: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Message sent successfully', data: message },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body;

    const messageIdNum = Number(messageId);

    if (isNaN(messageIdNum)) {
      return NextResponse.json(
        { error: 'Valid messageId is required' },
        { status: 400 }
      );
    }

    const message = await prisma.message.update({
      where: { id: messageIdNum },
      data: { read: true },
    });

    return NextResponse.json(
      { message: 'Message marked as read', data: message },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message', details: error.message },
      { status: 500 }
    );
  }
}