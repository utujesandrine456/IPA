import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (idParam) {
      const id = Number(idParam);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { error: 'Invalid student id' },
          { status: 400 }
        );
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
          }
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { student },
        { status: 200 }
      );
    }

    const supervisorIdParam = searchParams.get('supervisorId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = parseInt(searchParams.get('offset') || '0');
    const whereClause = supervisorIdParam ? { supervisorId: Number(supervisorIdParam) } : {};

    // Default: list all students (used by admin dashboard)
    const students = await prisma.student.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
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
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { students },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students', details: error.message },
      { status: 500 }
    );
  }
}

