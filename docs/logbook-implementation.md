# IPA Logbook – Architecture Analysis & Implementation Guide

> Based on the **IAP Student Log Book** document and analysis of the `ipa-backend` (NestJS + Prisma) and `ipa-frontend` (Next.js 14) codebases.

---

## 1. Project Architecture Overview

```
IPA/
├── ipa-backend/           # NestJS REST API
│   ├── prisma/
│   │   └── schema.prisma  # Shared data models
│   └── src/
│       ├── auth/          # JWT authentication (passport-jwt)
│       ├── students/      # Student profile CRUD
│       ├── supervisors/   # Supervisor profile CRUD
│       ├── tasks/         # Task assignment & submission
│       ├── log-entries/   # Daily logbook entries (LogEntry model)
│       ├── notifications/ # In-app notifications
│       ├── chat/          # Messaging (WebSockets)
│       ├── admin/         # Admin management
│       └── prisma/        # PrismaService singleton
│
└── ipa-frontend/          # Next.js 14 (App Router)
    ├── app/
    │   ├── (main)/
    │   │   ├── student/
    │   │   │   ├── logbook/page.tsx   ← Main logbook UI (Tasks + Daily Log tabs)
    │   │   │   └── chat/
    │   │   └── supervisor/
    │   │       ├── [id]/
    │   │       └── students/          ← Supervisor views students
    │   └── api/           # Next.js API routes (proxies to backend)
    ├── components/ui/     # Reusable UI components (Card, Button, etc.)
    └── lib/api.ts         # apiFetch() – authenticated HTTP client
```

### Tech Stack
| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | NestJS, TypeScript, Prisma ORM    |
| Database   | PostgreSQL                        |
| Auth       | JWT (passport-jwt, JwtAuthGuard)  |
| Frontend   | Next.js 14 (App Router), React    |
| Styling    | Tailwind CSS                      |
| API Client | `apiFetch()` in `lib/api.ts`      |

---

## 2. Current State of the Logbook Feature

### 2.1 What Already Exists

#### Prisma Schema – `LogEntry` model (`schema.prisma`)
```prisma
model LogEntry {
  id         Int      @id @default(autoincrement())
  studentId  Int
  content    String          // Plain text only
  date       DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt7

  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@map("log_entries")
}
```

> ⚠️ **Missing fields**: `week`, `supervisorSignoff`, `attachments`, `isApproved`, `weekNumber` — all of which appear in the physical logbook template.

---

#### Backend – `log-entries` Module (3 files)

| File | What it does |
|------|-------------|
| `log-entries.controller.ts` | `GET /daily-log?studentId=`, `POST /daily-log`, `DELETE /daily-log/:id` |
| `log-entries.service.ts` | `findByStudent()`, `create()`, `delete()` – simple Prisma calls |
| `log-entries.module.ts` | Registers the above, imports `PrismaModule` |

All routes are guarded by `@UseGuards(JwtAuthGuard)`.

**Current limitations:**
- No `PATCH` / edit endpoint
- No weekly grouping
- No supervisor sign-off / approval flow
- No file attachment support
- No `weekNumber` field
- No role-based access control (supervisor cannot view or approve a student's log)
- No notifications when a log is submitted for review

---

#### Frontend – `app/(main)/student/logbook/page.tsx`
A tab-based page with two tabs:
1. **Assigned Tasks** – shows tasks from `GET /tasks?studentId=`, allows submitting work
2. **Daily Log** – shows entries from `GET /daily-log?studentId=`, allows creating new entries

**Current limitations:**
- Logs are plain text — no rich text, no date picker for past entries
- No weekly view / weekly summary
- No supervisor sign-off UI
- No edit / update log entry
- Supervisor has **no logbook view** (the `/supervisor/` pages only have `students/`, `ratings/`, `chat/`, `[id]/`)

---

## 3. What the Physical Logbook Requires

Based on the `IAP Student Log Book.docx`, the logbook captures:

| Section              | Description |
|----------------------|-------------|
| **Student Info**     | Name, student number, internship company, dates |
| **Weekly Summary**   | One entry per week (Week 1…N) with: date range, activities, skills learned |
| **Daily Entry**      | Date, tasks performed, what was learned |
| **Supervisor Sign-off** | Supervisor signature/approval per week |
| **Objectives**       | Goals for the internship period |
| **Evaluation**       | Mid-term and final evaluations by supervisor |

---

## 4. Backend Implementation Plan

### 4.1 Prisma Schema Changes

Update `schema.prisma` – extend `LogEntry` and add `WeeklyLog`:

```prisma
model LogEntry {
  id              Int          @id @default(autoincrement())
  studentId       Int
  weeklyLogId     Int?         // Link to the week this belongs to
  content         String       // What was done / learned today
  date            DateTime     @default(now())
  mood            String?      // Optional: GREAT | OKAY | TOUGH
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  student         Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  weeklyLog       WeeklyLog?   @relation(fields: [weeklyLogId], references: [id])

  @@map("log_entries")
}

model WeeklyLog {
  id              Int          @id @default(autoincrement())
  studentId       Int
  weekNumber      Int          // 1, 2, 3…
  weekStart       DateTime
  weekEnd         DateTime
  summary         String?      // Student's weekly summary
  objectives      String?      // Goals for next week
  status          WeeklyLogStatus @default(DRAFT)
  supervisorNote  String?      // Supervisor feedback
  approvedAt      DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  student         Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  dailyEntries    LogEntry[]

  @@unique([studentId, weekNumber])
  @@map("weekly_logs")
}

enum WeeklyLogStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}
```

Also add to the `Student` model:
```prisma
  weeklyLogs  WeeklyLog[]
```

---

### 4.2 New Module: `weekly-logs`

Create `src/weekly-logs/` with the following files:

#### `weekly-logs.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { WeeklyLogsController } from './weekly-logs.controller';
import { WeeklyLogsService } from './weekly-logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WeeklyLogsController],
  providers: [WeeklyLogsService],
})
export class WeeklyLogsModule {}
```

#### `weekly-logs.service.ts` – Key Methods

```typescript
// --- Student actions ---

// Get all weekly logs for a student (with daily entries)
async findByStudent(studentId: number): Promise<WeeklyLog[]>

// Get a single weekly log with all daily entries
async findOne(weeklyLogId: number): Promise<WeeklyLog>

// Create or auto-initialize a week (called when student adds a daily entry)
async findOrCreateWeek(studentId: number, weekNumber: number): Promise<WeeklyLog>

// Submit a week's log for supervisor review
async submitWeek(weeklyLogId: number, summary: string, objectives: string): Promise<WeeklyLog>
  // → changes status to SUBMITTED
  // → creates a Notification for the supervisor

// --- Supervisor actions ---

// View all weekly logs for a student under this supervisor
async findByStudentForSupervisor(studentId: number, supervisorId: number): Promise<WeeklyLog[]>

// Approve a weekly log
async approveWeek(weeklyLogId: number, supervisorId: number, note?: string): Promise<WeeklyLog>
  // → changes status to APPROVED, sets approvedAt
  // → creates a Notification for the student

// Reject / request revision
async rejectWeek(weeklyLogId: number, supervisorId: number, note: string): Promise<WeeklyLog>
  // → changes status to REJECTED (back to DRAFT)
  // → creates a Notification for the student
```

#### `weekly-logs.controller.ts` – Endpoints

| Method | Route | Role | Description |
|--------|-------|------|-------------|
| `GET` | `/weekly-logs?studentId=` | Student / Supervisor | Get all weeks for a student |
| `GET` | `/weekly-logs/:id` | Student / Supervisor | Get a single week with daily entries |
| `POST` | `/weekly-logs` | Student | Create a new week |
| `PATCH` | `/weekly-logs/:id/submit` | Student | Submit week for review |
| `PATCH` | `/weekly-logs/:id/approve` | Supervisor | Approve week |
| `PATCH` | `/weekly-logs/:id/reject` | Supervisor | Reject / request revision |

---

### 4.3 Extend `log-entries` Module

Add a `PATCH` endpoint and link daily entries to a week:

```typescript
// log-entries.controller.ts – add:
@Patch(':id')
async update(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: { content?: string; mood?: string }
) {
  return this.logEntriesService.update(id, body);
}
```

```typescript
// log-entries.service.ts – update create():
async create(data: {
  studentId: number | string;
  content: string;
  weeklyLogId?: number;
  mood?: string;
  date?: string;
}) {
  const studentId = Number(data.studentId);
  const log = await this.prisma.logEntry.create({
    data: {
      studentId,
      content: data.content,
      weeklyLogId: data.weeklyLogId ?? null,
      mood: data.mood ?? null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
  return { message: 'Log entry created', log };
}

async update(id: number, data: { content?: string; mood?: string }) {
  return this.prisma.logEntry.update({
    where: { id },
    data,
  });
}
```

---

### 4.4 Add Role Guard for Supervisor Access

Create a reusable `RolesGuard` (if not already existing):

```typescript
// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!roles.includes(user.role)) throw new ForbiddenException();
    return true;
  }
}

// src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

Usage in controller:
```typescript
@Patch(':id/approve')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERVISOR')
async approve(@Param('id', ParseIntPipe) id: number, @Body() body: any) { ... }
```

---

### 4.5 Register in `AppModule`

```typescript
// src/app.module.ts – add import
import { WeeklyLogsModule } from './weekly-logs/weekly-logs.module';

@Module({
  imports: [
    PrismaModule, AuthModule, StudentsModule, SupervisorsModule,
    TasksModule, AdminModule, NotificationsModule,
    LogEntriesModule,
    WeeklyLogsModule,   // ← ADD THIS
    ChatModule,
  ],
})
export class AppModule {}
```

---

### 4.6 Database Migration

After updating `schema.prisma`, run:

```bash
# In /ipa-backend
npx prisma migrate dev --name add_weekly_logs_and_logentry_fields
npx prisma generate
```

---

## 5. Frontend Implementation Plan

### 5.1 Restructure the Student Logbook Page

Split `app/(main)/student/logbook/page.tsx` into three tabs:

| Tab | Path/Component | Description |
|-----|---------------|-------------|
| **Assigned Tasks** | `<TasksTab>` | Existing task list (no change) |
| **Daily Log** | `<DailyLogTab>` | Entries grouped inside a week card |
| **Weekly Summary** | `<WeeklyTab>` | Submit week, view status, see supervisor feedback |

### 5.2 Supervisor Logbook View

Add a new page: `app/(main)/supervisor/logbook/page.tsx`

- List all students under supervisor
- Click a student → view their weekly logs
- Approve or reject each week with optional notes

### 5.3 API Calls to Add

```typescript
// In lib/api.ts or directly in components:

// Get all weekly logs for a student
GET /weekly-logs?studentId={id}

// Get a single week with daily entries
GET /weekly-logs/{weeklyLogId}

// Create a new week
POST /weekly-logs  { studentId, weekNumber, weekStart, weekEnd }

// Submit a week
PATCH /weekly-logs/{id}/submit  { summary, objectives }

// Supervisor: approve
PATCH /weekly-logs/{id}/approve  { supervisorNote }

// Supervisor: reject
PATCH /weekly-logs/{id}/reject  { supervisorNote }
```

---

## 6. Gap Analysis – What Needs to Be Done

| # | Area | Gap | Priority |
|---|------|-----|----------|
| 1 | **Prisma Schema** | Add `WeeklyLog` model, extend `LogEntry` with `weeklyLogId`, `mood`, optional `date` override | 🔴 High |
| 2 | **Backend: WeeklyLogs module** | Create `weekly-logs/` module with CRUD + submit/approve/reject flow | 🔴 High |
| 3 | **Backend: log-entries** | Add `PATCH` (edit) endpoint; support `weeklyLogId` and `mood` on create | 🟡 Medium |
| 4 | **Backend: Role guard** | Add `RolesGuard` + `@Roles()` decorator to restrict supervisor-only routes | 🟡 Medium |
| 5 | **Backend: Notifications** | Trigger notifications on weekly log submission and supervisor sign-off | 🟡 Medium |
| 6 | **Frontend: Student logbook** | Add Weekly Summary tab; group daily entries by week; edit entries | 🔴 High |
| 7 | **Frontend: Supervisor logbook view** | New page for supervisors to browse and approve student logs | 🔴 High |
| 8 | **Frontend: File attachments** | Allow attaching photos/PDFs to daily entries (requires multer on backend) | 🟢 Low |
| 9 | **Migration** | Run `prisma migrate dev` after schema changes | 🔴 Prerequisite |

---

## 7. Recommended Implementation Order

```
1. Update schema.prisma (add WeeklyLog model + extend LogEntry)
2. Run prisma migrate dev
3. Create src/weekly-logs/ module (service + controller + module)
4. Add PATCH to log-entries module
5. Create RolesGuard + Roles decorator
6. Register WeeklyLogsModule in AppModule
7. Update student logbook page (add Weekly Summary tab)
8. Create supervisor logbook page
9. Wire up notifications for submission & sign-off
10. (Optional) Add file attachment support via Multer
```

---

## 8. API Reference Summary

### Log Entries (existing – `/daily-log`)
| Method | Route | Body / Query | Auth |
|--------|-------|-------------|------|
| `GET` | `/daily-log?studentId=N` | – | JWT |
| `POST` | `/daily-log` | `{ studentId, content, weeklyLogId?, mood?, date? }` | JWT |
| `PATCH` | `/daily-log/:id` | `{ content?, mood? }` | JWT *(add)* |
| `DELETE` | `/daily-log/:id` | – | JWT |

### Weekly Logs (new – `/weekly-logs`)
| Method | Route | Body | Auth |
|--------|-------|------|------|
| `GET` | `/weekly-logs?studentId=N` | – | JWT |
| `GET` | `/weekly-logs/:id` | – | JWT |
| `POST` | `/weekly-logs` | `{ studentId, weekNumber, weekStart, weekEnd }` | JWT (Student) |
| `PATCH` | `/weekly-logs/:id/submit` | `{ summary, objectives }` | JWT (Student) |
| `PATCH` | `/weekly-logs/:id/approve` | `{ supervisorNote? }` | JWT (Supervisor) |
| `PATCH` | `/weekly-logs/:id/reject` | `{ supervisorNote }` | JWT (Supervisor) |
