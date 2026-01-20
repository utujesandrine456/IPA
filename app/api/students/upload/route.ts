import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: 0, errors: [{ row: 0, error: "No file uploaded" }] },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

    const extractValue = (
      normalizedRow: Record<string, unknown>,
      aliases: string[]
    ): string | undefined => {
      for (const alias of aliases) {
        const value = normalizedRow[normalizeKey(alias)];
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          return String(value).trim();
        }
      }
      return undefined;
    };

    const errors: { row: number; error: string }[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const normalizedRow = Object.entries(row).reduce(
        (acc, [key, value]) => {
          if (typeof key === "string") {
            acc[normalizeKey(key)] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>
      );

      const studentNumber = extractValue(normalizedRow, [
        "student id",
        "student_id",
        "student number",
        "studentnumber",
        "student_no",
        "studentno",
        "matric",
        "matric no",
      ]);

      const fullName = extractValue(normalizedRow, [
        "name",
        "full name",
        "fullname",
        "student name",
      ]);

      const sex = extractValue(normalizedRow, ["sex", "gender"]) || "";
      const idOrPassport =
        extractValue(normalizedRow, [
          "id_or_passport",
          "id or passport",
          "passport",
          "idpassport",
          "id",
        ]) || "";

      const phone =
        extractValue(normalizedRow, [
          "phone",
          "phone number",
          "phone_number",
          "mobile",
          "mobile number",
        ]) || "";

      const email = extractValue(normalizedRow, [
        "email",
        "email address",
        "email_address",
        "e-mail",
      ]);

      if (!studentNumber || !fullName || !email) {
        errors.push({
          row: i + 2,
          error: "Missing required fields (Student ID, Name or Email)",
        });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ row: i + 2, error: "Invalid email format" });
        continue;
      }

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        const supervisors = await prisma.supervisor.findMany();

        if (supervisors.length === 0) {
          return NextResponse.json(
            { success: 0, errors: [{ row: 0, error: "No supervisors in database" }] },
            { status: 400 }
          );
        }

        const supervisor = supervisors[i % supervisors.length];

        if (existingUser) {
          errors.push({ row: i + 2, error: "Email already exists" });
          continue;
        }

        const existingStudent = await prisma.student.findUnique({
          where: { studentNumber: String(studentNumber) },
        });

        if (existingStudent) {
          errors.push({ row: i + 2, error: `Student ID ${studentNumber} already exists` });
          continue;
        }


        await prisma.user.create({
          data: {
            name: fullName,
            email,
            role: "STUDENT",
            studentProfile: {
              create: {
                studentNumber: String(studentNumber),
                fullName: String(fullName),
                sex: sex ? String(sex) : null,
                idOrPassport: idOrPassport ? String(idOrPassport) : null,
                year: null,
                phone: phone ? String(phone) : null,
                email: String(email),
                profileCompleted: false,
                supervisor: {
                  connect: { id: supervisor.id },
                },
              },
            },
          },
        });


        successCount++;
      } catch (dbErr: any) {
        errors.push({
          row: i + 2,
          error: dbErr.message || "Database error",
        });
      }
    }

    return NextResponse.json(
      {
        success: successCount,
        errors,
        message: `Imported ${successCount} students. ${errors.length} errors.`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      {
        success: 0,
        errors: [{ row: 0, error: err.message || "Failed to process file" }],
      },
      { status: 500 }
    );
  }
}
