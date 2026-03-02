import { NextRequest, NextResponse } from 'next/server';
import prisma  from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');

    if (role === 'SUPERTEACHER') {
      const [
        totalStudents,
        totalSupervisors,
        totalTeachers,
        completedProfiles,
        totalTasks,
        completedTasks,
        totalRatings,
      ] = await Promise.all([
        prisma.student.count(),
        prisma.supervisor.count(),
        prisma.teacher.count(),
        prisma.student.count({ where: { profileCompleted: true } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.rating.count(),
      ]);

      const avgRating = await prisma.rating.aggregate({
        _avg: {
          rating: true,
        },
      });

      return NextResponse.json({
        totalStudents,
        totalSupervisors,
        totalTeachers,
        completedProfiles,
        pendingProfiles: totalStudents - completedProfiles,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        totalRatings,
        averageRating: avgRating._avg.rating || 0,
      });
    }

    if (role === 'SUPERVISOR' && userId) {
      const supervisor = await prisma.supervisor.findUnique({
        where: { userId },
        include: {
          students: true,
        },
      });

      if (!supervisor) {
        return NextResponse.json(
          { error: 'Supervisor not found' },
          { status: 404 }
        );
      }

      const studentIds = supervisor.students.map((s) => s.id);

      const [
        totalStudents,
        completedProfiles,
        totalTasks,
        completedTasks,
        totalRatings,
      ] = await Promise.all([
        prisma.student.count({ where: { supervisorId: supervisor.id } }),
        prisma.student.count({
          where: {
            supervisorId: supervisor.id,
            profileCompleted: true,
          },
        }),
        prisma.task.count({
          where: { studentId: { in: studentIds } },
        }),
        prisma.task.count({
          where: {
            studentId: { in: studentIds },
            status: 'COMPLETED',
          },
        }),
        prisma.rating.count({
          where: { supervisorId: supervisor.id },
        }),
      ]);

      const avgRating = await prisma.rating.aggregate({
        where: { supervisorId: supervisor.id },
        _avg: {
          rating: true,
        },
      });

      return NextResponse.json({
        totalStudents,
        completedProfiles,
        pendingProfiles: totalStudents - completedProfiles,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        totalRatings,
        averageRating: avgRating._avg.rating || 0,
      });
    }

    if (role === 'STUDENT' && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
        },
      });

      if (!user?.studentProfile) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }

      const [
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalRatings,
      ] = await Promise.all([
        prisma.task.count({
          where: { studentId: user.studentProfile.id },
        }),
        prisma.task.count({
          where: {
            studentId: user.studentProfile.id,
            status: 'COMPLETED',
          },
        }),
        prisma.task.count({
          where: {
            studentId: user.studentProfile.id,
            status: 'PENDING',
          },
        }),
        prisma.task.count({
          where: {
            studentId: user.studentProfile.id,
            status: 'IN_PROGRESS',
          },
        }),
        prisma.rating.count({
          where: { studentId: user.studentProfile.id },
        }),
      ]);

      const avgRating = await prisma.rating.aggregate({
        where: { studentId: user.studentProfile.id },
        _avg: {
          rating: true,
        },
      });

      return NextResponse.json({
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalRatings,
        averageRating: avgRating._avg.rating || 0,
        profileCompleted: user.studentProfile.profileCompleted,
      });
    }

    return NextResponse.json(
      { error: 'Invalid role or userId' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}



