import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendProfileCompletionEmail } from "@/lib/email";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { studentIds } = body;

    if (!studentIds || studentIds.length === 0) {
      const students = await prisma.student.findMany({
        where: { profileCompleted: false },
        include: { user: true },
      });
      studentIds = students.map((s) => s.id);
    }

    const results: {success: { email: string; name: string; studentId: string }[]; errors: { row: any; error: string }[];} = {success: [], errors: [],};

    for (const id of studentIds) {
      try {
        const student = await prisma.student.findUnique({
          where: { id },
          include: { user: true },
        });

        if (!student) {
          results.errors.push({ row: { id }, error: "Student not found" });
          continue;
        }

        let token = student.profileToken;
        if (!token) {
          token = generateToken();
          await prisma.student.update({ where: { id }, data: { profileToken: token } });
        }

        await sendProfileCompletionEmail(student.user.email, token);

        results.success.push({
          email: student.user.email,
          name: student.user.name,
          studentId: student.studentId,
        });
      } catch (err: any) {
        results.errors.push({ row: { id }, error: err.message });
      }
    }

    return NextResponse.json({
      message: `Processed ${studentIds.length} invitations`,
      success: results.success.length,
      errors: results.errors.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
