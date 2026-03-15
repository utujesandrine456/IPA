const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Migrating statuses...');
    try {
        // Add COMPLETED to enums if not exists
        await prisma.$executeRawUnsafe(`ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'COMPLETED'`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "WeeklyLogStatus" ADD VALUE IF NOT EXISTS 'COMPLETED'`);

        const tasksCount = await prisma.$executeRawUnsafe(
            `UPDATE tasks SET status = 'COMPLETED' WHERE status = 'APPROVED'`
        );
        console.log(`Updated ${tasksCount} tasks.`);

        const logsCount = await prisma.$executeRawUnsafe(
            `UPDATE weekly_logs SET status = 'COMPLETED' WHERE status = 'APPROVED'`
        );
        console.log(`Updated ${logsCount} weekly logs.`);

        // Note: We won't remove APPROVED via raw SQL here as it's complex to remove enum values in PG
        // Prisma db push will handle the final schema state cleanup later.
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
