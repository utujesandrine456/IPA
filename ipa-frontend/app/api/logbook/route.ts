import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get("studentId");
        const supervisorId = searchParams.get("supervisorId");

        let where = {};
        if (studentId) {
            where = { studentId: Number(studentId) };
        } else if (supervisorId) {
            where = {
                student: {
                    supervisorId: Number(supervisorId)
                }
            };
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: true
                    }
                },
                comments: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ tasks });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, title, description } = body;

        const task = await prisma.task.create({
            data: {
                studentId: Number(studentId),
                title,
                description
            }
        });

        return NextResponse.json({ task });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { taskId, status, feedback, supervisorId, submissionContent } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (body.date) updateData.date = new Date(body.date);
        if (submissionContent) {
            updateData.submissionContent = submissionContent;
            updateData.submittedAt = new Date();
        }
        if (body.rating) updateData.rating = Number(body.rating);

        const task = await prisma.task.update({
            where: { id: Number(taskId) },
            data: updateData
        });

        if (feedback) {
            await prisma.comment.create({
                data: {
                    taskId: Number(taskId),
                    content: feedback,
                    supervisorId: supervisorId ? Number(supervisorId) : null
                }
            });
        }

        return NextResponse.json({ task });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
