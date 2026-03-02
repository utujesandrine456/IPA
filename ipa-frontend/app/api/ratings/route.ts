import { NextRequest, NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const supervisorId = searchParams.get('supervisorId');

    if (studentId) {
      const ratings = await prisma.rating.findMany({
        where: { studentId },
        include: {
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

      return NextResponse.json({ ratings }, { status: 200 });
    }

    if (supervisorId) {
      const ratings = await prisma.rating.findMany({
        where: { supervisorId },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ ratings }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'studentId or supervisorId is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, supervisorId, rating, comment } = body;

    if (!studentId || !supervisorId || !rating) {
      return NextResponse.json(
        { error: 'studentId, supervisorId, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if rating already exists for this student-supervisor pair
    const existingRating = await prisma.rating.findFirst({
      where: {
        studentId,
        supervisorId,
      },
    });

    let result;
    if (existingRating) {
      // Update existing rating
      result = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          rating,
          comment,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          supervisor: {
            include: {
              user: true,
            },
          },
        },
      });
    } else {
      // Create new rating
      result = await prisma.rating.create({
        data: {
          studentId,
          supervisorId,
          rating,
          comment,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          supervisor: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    return NextResponse.json(
      { message: 'Rating saved successfully', rating: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: 'Failed to save rating', details: error.message },
      { status: 500 }
    );
  }
}



