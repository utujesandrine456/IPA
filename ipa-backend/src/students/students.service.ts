import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils';
import { sendProfileCompletionEmail } from '../lib/email';


@Injectable()
export class StudentsService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: any) {
        const { id, supervisorId, liaisonId, limit: limitParam, offset: offsetParam } = query;

        if (id) {
            const studentId = Number(id);
            if (Number.isNaN(studentId)) {
                throw new BadRequestException('Invalid student id');
            }

            const student = await this.prisma.student.findUnique({
                where: { id: studentId },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    supervisor: { include: { user: true } },
                    liaison: { include: { user: true } },
                    ratings: {
                        include: {
                            supervisor: { include: { user: { select: { name: true } } } }
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!student) {
                throw new NotFoundException('Student not found');
            }

            return {
                student: {
                    ...student,
                    loAssigned: !!student.liaisonId,
                }
            };
        }

        const limit = parseInt(limitParam || '1000');
        const offset = parseInt(offsetParam || '0');

        let whereClause: any = {};
        if (supervisorId) whereClause.supervisorId = Number(supervisorId);
        if (liaisonId) whereClause.liaisonId = Number(liaisonId);

        const students = await this.prisma.student.findMany({
            where: whereClause,
            take: limit,
            skip: offset,
            include: {
                user: { select: { id: true, name: true, email: true } },
                supervisor: { include: { user: true } },
                liaison: { include: { user: true } },
                ratings: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        const studentsWithLo = students.map((s: any) => ({
            ...s,
            loAssigned: !!s.liaisonId
        }));

        return { students: studentsWithLo };
    }

    async findOne(id: number) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                supervisor: { include: { user: true } },
                liaison: { include: { user: true } },
                ratings: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        return {
            ...student,
            loAssigned: !!student.liaisonId,
        };
    }

    async updateProfile(studentId: number, body: any) {
        if (!studentId) {
            throw new BadRequestException('Student ID is required');
        }

        // Extract all possible fields from the body
        const {
            firstName, lastName, intakeYear, sex, idOrPassport, dateOfBirth, year, graduationYear,
            phone, email, address, companyName, companyAddress,
            companyPhone, companyEmail, companyPOBox,
            supervisorName, supervisorDesignation, supervisorEmail,
            supervisorDepartment, supervisorPhone,
            liaisonOfficerName, liaisonOfficerPhone,
            internshipStart, internshipEnd, supervisorId, liaisonId,
            absentDays
        } = body;

        const updateData: any = {
            firstName, lastName, intakeYear, sex, idOrPassport,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            year, graduationYear, phone, email, address,
            companyName, companyAddress, companyPhone, companyEmail, companyPOBox,
            supervisorName, supervisorDesignation, supervisorEmail,
            supervisorDepartment, supervisorPhone,
            liaisonOfficerName, liaisonOfficerPhone,
            internshipStart: internshipStart ? new Date(internshipStart) : null,
            internshipEnd: internshipEnd ? new Date(internshipEnd) : null,
            profileCompleted: true,
            absentDays: absentDays !== undefined ? Number(absentDays) : undefined,
        };

        if (supervisorId) {
            updateData.supervisorId = Number(supervisorId);
        }

        if (liaisonId) {
            updateData.liaisonId = Number(liaisonId);
        }

        const updatedStudent = await this.prisma.student.update({
            where: { id: Number(studentId) },
            data: updateData,
            include: { user: true, supervisor: { include: { user: true } } }
        });

        // Update the associated user's name if firstName or lastName was provided
        if (firstName || lastName) {
            const student = await this.prisma.student.findUnique({ where: { id: Number(studentId) } });
            const nameToUpdate = `${firstName || student?.firstName || ""} ${lastName || student?.lastName || ""}`.trim();
            await this.prisma.user.update({
                where: { id: updatedStudent.userId },
                data: { name: nameToUpdate }
            });
        }

        return { message: 'Profile updated successfully', student: updatedStudent };
    }

    async findByToken(token: string) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }

        const student = await this.prisma.student.findUnique({
            where: { profileToken: String(token) },
            include: {
                user: true,
                supervisor: { include: { user: true } },
            },
        });

        if (!student) {
            throw new NotFoundException('Invalid or expired token');
        }

        if (student.profileCompleted) {
            throw new BadRequestException('Profile already completed');
        }

        return { student };
    }

    async completeProfile(body: any) {
        const {
            token, password, firstName, lastName, intakeYear, sex, phone, address, companyName, companyAddress,
            companyPhone, companyEmail, supervisorName, supervisorEmail,
            internshipStart, internshipEnd, supervisorId,
        } = body;

        if (!token) {
            throw new BadRequestException('Token is required');
        }

        const student = await this.prisma.student.findUnique({
            where: { profileToken: token },
            include: { user: true },
        });

        if (!student) {
            throw new NotFoundException('Invalid or expired token');
        }

        if (student.profileCompleted) {
            throw new BadRequestException('Profile already completed');
        }

        let targetSupervisorId: number = student.supervisorId || 0;
        if (supervisorId) {
            const supervisorExists = await this.prisma.supervisor.findUnique({
                where: { id: Number(supervisorId) },
            });
            if (!supervisorExists) {
                throw new BadRequestException('Invalid supervisor ID');
            }
            targetSupervisorId = Number(supervisorId);
        }

        let hashedPassword = student.user.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        await this.prisma.user.update({
            where: { id: student.userId },
            data: { password: hashedPassword },
        });

        const updateData: any = {
            firstName, lastName, intakeYear, sex, phone, address, companyName, companyAddress,
            companyPhone, companyEmail, supervisorName, supervisorEmail,
            internshipStart: internshipStart ? new Date(internshipStart) : null,
            internshipEnd: internshipEnd ? new Date(internshipEnd) : null,
            supervisorId: targetSupervisorId, // Use the resolved targetSupervisorId
            profileCompleted: true,
            profileToken: null,
        };

        Object.keys(updateData).forEach(key => (updateData[key] === undefined) && delete updateData[key]);

        const updatedStudent = await this.prisma.student.update({
            where: { id: student.id },
            data: updateData,
            include: {
                user: true,
                supervisor: { include: { user: true } },
            },
        });

        // Update the associated user's name
        const finalName = `${firstName || student.firstName} ${lastName || student.lastName}`.trim();
        await this.prisma.user.update({
            where: { id: student.userId },
            data: { name: finalName }
        });

        return {
            message: 'Profile completed and verified successfully',
            student: updatedStudent,
        };
    }

    async uploadStudents(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

        const extractValue = (normalizedRow: Record<string, unknown>, aliases: string[]): string | undefined => {
            for (const alias of aliases) {
                const value = normalizedRow[normalizeKey(alias)];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    return String(value).trim();
                }
            }
            return undefined;
        };

        const errors: { row: number; error: string }[] = [];
        let successCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const normalizedRow = Object.entries(row).reduce((acc: any, [key, value]: any) => {
                if (typeof key === 'string') acc[normalizeKey(key)] = value;
                return acc;
            }, {} as Record<string, unknown>);

            const studentNumber = extractValue(normalizedRow, ['student id', 'student_id', 'student number', 'studentnumber', 'student_no', 'studentno', 'matric', 'matric no']);
            const firstName = extractValue(normalizedRow, ['first name', 'firstname', 'fname']);
            const lastName = extractValue(normalizedRow, ['last name', 'lastname', 'lname', 'surname']);
            const fullName = extractValue(normalizedRow, ['name', 'full name', 'fullname', 'student name']);
            
            let fName = firstName;
            let lName = lastName;
            
            if (!fName || !lName) {
                if (fullName) {
                    const parts = fullName.split(' ');
                    fName = parts[0];
                    lName = parts.slice(1).join(' ');
                }
            }
            const sex = extractValue(normalizedRow, ['sex', 'gender']) || '';
            const idOrPassport = extractValue(normalizedRow, ['id_or_passport', 'id or passport', 'passport', 'idpassport', 'id']) || '';
            const phone = extractValue(normalizedRow, ['phone', 'phone number', 'phone_number', 'mobile', 'mobile number']) || '';
            const email = extractValue(normalizedRow, ['email', 'email address', 'email_address', 'e-mail']);

            if (!studentNumber || !fName || !lName || !email) {
                errors.push({ row: i + 2, error: 'Missing required fields (Student ID, First Name, Last Name or Email)' });
                continue;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push({ row: i + 2, error: 'Invalid email format' });
                continue;
            }

            try {
                const existingUser = await this.prisma.user.findUnique({ where: { email } });
                const supervisors = await this.prisma.supervisor.findMany();
                if (supervisors.length === 0) {
                    errors.push({ row: i + 2, error: 'No supervisors available. Please add a supervisor first.' });
                    continue;
                }
                const supervisor = supervisors[i % supervisors.length];

                if (existingUser) {
                    errors.push({ row: i + 2, error: 'Email already exists' });
                    continue;
                }

                const existingStudent = await this.prisma.student.findUnique({ where: { studentNumber: String(studentNumber) } });
                if (existingStudent) {
                    errors.push({ row: i + 2, error: `Student ID ${studentNumber} already exists` });
                    continue;
                }

                await this.prisma.user.create({
                    data: {
                        name: `${fName} ${lName}`.trim(),
                        email,
                        role: 'STUDENT',
                        studentProfile: {
                            create: {
                                studentNumber: String(studentNumber),
                                firstName: String(fName),
                                lastName: String(lName),
                                sex: sex ? String(sex) : null,
                                idOrPassport: idOrPassport ? String(idOrPassport) : null,
                                phone: phone ? String(phone) : null,
                                email: String(email),
                                profileCompleted: false,
                                supervisor: { connect: { id: supervisor.id } },
                            },
                        },
                    },
                });
                successCount++;
            } catch (dbErr: any) {
                errors.push({ row: i + 2, error: dbErr.message || 'Database error' });
            }
        }

        return { success: successCount, errors, message: `Imported ${successCount} students. ${errors.length} errors.` };
    }

    async sendInvites(body: any) {
        let { studentIds } = body;
        if (!studentIds || studentIds.length === 0) {
            const students = await this.prisma.student.findMany({
                where: { profileCompleted: false },
                include: { user: true },
            });
            studentIds = students.map((s: any) => s.id);
        }

        const results: { success: any[]; errors: any[] } = { success: [], errors: [] };
        for (const id of studentIds) {
            try {
                const student = await this.prisma.student.findUnique({
                    where: { id: Number(id) },
                    include: { user: true },
                });
                if (!student) {
                    results.errors.push({ row: { id }, error: 'Student not found' });
                    continue;
                }

                let token = student.profileToken;
                if (!token) {
                    token = generateToken();
                    await this.prisma.student.update({ where: { id: student.id }, data: { profileToken: token } });
                }
                await sendProfileCompletionEmail(student.user.email, token);
                results.success.push({ email: student.user.email, name: student.user.name, studentId: student.id });
            } catch (err: any) {
                results.errors.push({ row: { id }, error: err.message });
            }
        }

        return { message: `Processed ${studentIds.length} invitations`, success: results.success.length, errors: results.errors.length, results };
    }
}
