import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const supervisorId = searchParams.get('supervisorId');

    if (studentId) {
      const ratings = await prisma.rating.findMany({
        where: { studentId: Number(studentId) },
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
        where: { supervisorId: Number(supervisorId) },
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
    const {
      studentId,
      supervisorId,
      rating,
      comment,
      knowledgeWirelessOps,
      knowledgeWirelessEst,
      knowledgeWirelessMaint,
      knowledgeApplication,
      responsibility,
      cooperativeness,
      complianceEtiquette,
      safetyAwareness,
      safetyCompliance,
      safetyArrangement,
      evaluatorPosition,
      evaluatorName
    } = body;

    if (!studentId || !supervisorId || rating === undefined) {
      return NextResponse.json(
        { error: 'studentId, supervisorId, and rating are required' },
        { status: 400 }
      );
    }

    const ratingData = {
      studentId: Number(studentId),
      supervisorId: Number(supervisorId),
      rating: Number(rating),
      comment,
      knowledgeWirelessOps: Number(knowledgeWirelessOps || 0),
      knowledgeWirelessEst: Number(knowledgeWirelessEst || 0),
      knowledgeWirelessMaint: Number(knowledgeWirelessMaint || 0),
      knowledgeApplication: Number(knowledgeApplication || 0),
      responsibility: Number(responsibility || 0),
      cooperativeness: Number(cooperativeness || 0),
      complianceEtiquette: Number(complianceEtiquette || 0),
      safetyAwareness: Number(safetyAwareness || 0),
      safetyCompliance: Number(safetyCompliance || 0),
      safetyArrangement: Number(safetyArrangement || 0),
      evaluatorPosition: evaluatorPosition || "",
      evaluatorName: evaluatorName || ""
    };

    const result = await prisma.rating.upsert({
      where: {
        studentId: Number(studentId),
      },
      update: ratingData,
      create: ratingData,
    });

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



