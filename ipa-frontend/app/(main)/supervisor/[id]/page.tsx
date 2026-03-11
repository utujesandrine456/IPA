"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  LayoutDashboard,
  FileText,
  X,
  Check,
  Plus,
  Trophy,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { apiFetch } from "@/lib/api";

const formatDate = (date: string | null | undefined) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

interface Student {
  id: number;
  name: string;
  supervisorId: number;
  user?: { id: number; name: string; email: string };
  phone?: string;
  address?: string;
  companyName?: string;
  companyAddress?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  liaisonOfficerName?: string;
  absentDays?: number;
  ratings?: Rating[];
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SUBMITTED" | "APPROVED" | "REJECTED";
  date: string;
  studentId: number;
  student?: { user: { name: string } };
}

interface NewTask {
  studentId: number | "";
  title: string;
  description: string;
  dueDate: string;
}

interface WeeklyLog {
  id: number;
  weekNumber: number;
  studentId: number;
  startDate: string;
  endDate: string;
  mondayTask?: string;
  mondayHours?: number;
  tuesdayTask?: string;
  tuesdayHours?: number;
  wednesdayTask?: string;
  wednesdayHours?: number;
  thursdayTask?: string;
  thursdayHours?: number;
  fridayTask?: string;
  fridayHours?: number;
  totalHours?: number;
  generalStatement?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  student?: { user: { name: string } };
  grade?: string;
  supervisorName?: string;
  supervisorDate?: string;
  supervisorSignature?: boolean;
}

interface Rating {
  id: number;
  rating: number;
  comment?: string;
  knowledgeWirelessOps?: number;
  knowledgeWirelessEst?: number;
  knowledgeWirelessMaint?: number;
  knowledgeApplication?: number;
  responsibility?: number;
  cooperativeness?: number;
  complianceEtiquette?: number;
  safetyAwareness?: number;
  safetyCompliance?: number;
  safetyArrangement?: number;
  createdAt: string;
}

interface AssessmentData {
  knowledgeWirelessOps: number;
  knowledgeWirelessEst: number;
  knowledgeWirelessMaint: number;
  knowledgeApplication: number;
  responsibility: number;
  cooperativeness: number;
  complianceEtiquette: number;
  safetyAwareness: number;
  safetyCompliance: number;
  safetyArrangement: number;
  absentDays: number;
  comment: string;
  isUseful?: string;
  improvedUnderstanding?: string;
  providedExperiences?: string;
  loVisitCount?: number;
  programmeTypes?: string[];
  otherProgrammeDetails?: string;
  satisfactionIndustry?: string;
  satisfactionMajor?: string;
  satisfactionPractical?: string;
  satisfactionInstructors?: string;
  notableAchievements?: string;
  futureCareerPlan?: string;
  suggestions?: string;
}

// ----- Component -----
export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "assignments" | "weekly-logs">("overview");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedWeeklyLog, setSelectedWeeklyLog] = useState<WeeklyLog | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logFilter, setLogFilter] = useState<'SUBMITTED' | 'ALL'>('SUBMITTED');
  const [studentSearch, setStudentSearch] = useState("");

  const router = useRouter();
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      const originalOverflow = mainElement.style.overflow;
      mainElement.style.overflow = 'hidden';
      return () => {
        mainElement.style.overflow = originalOverflow;
      };
    }
  }, []);


  const [newTask, setNewTask] = useState<NewTask>({
    studentId: "",
    title: "",
    description: "",
    dueDate: "",
  });
  const [ratingValue, setRatingValue] = useState(7);
  const [ratingComment, setRatingComment] = useState("");
  const [assessment, setAssessment] = useState<AssessmentData>({
    knowledgeWirelessOps: 0,
    knowledgeWirelessEst: 0,
    knowledgeWirelessMaint: 0,
    knowledgeApplication: 0,
    responsibility: 0,
    cooperativeness: 0,
    complianceEtiquette: 0,
    safetyAwareness: 0,
    safetyCompliance: 0,
    safetyArrangement: 0,
    absentDays: 0,
    comment: "",
    isUseful: undefined,
    improvedUnderstanding: undefined,
    providedExperiences: undefined,
    loVisitCount: 0,
    programmeTypes: [],
    otherProgrammeDetails: "",
    satisfactionIndustry: undefined,
    satisfactionMajor: undefined,
    satisfactionPractical: undefined,
    satisfactionInstructors: undefined,
    notableAchievements: "",
    futureCareerPlan: "",
    suggestions: ""
  });

  const params = useParams();
  const searchParams = useSearchParams();
  const supervisorIdParam = params.id as string || searchParams.get("supervisorId");
  const supervisorId = supervisorIdParam ? Number(supervisorIdParam) : undefined;

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser);
      const userRole = user.role?.toUpperCase();

      let effectiveSupervisorId = supervisorId;
      if (!effectiveSupervisorId && user.supervisorProfile?.id) {
        effectiveSupervisorId = user.supervisorProfile.id;
      }
      if (!effectiveSupervisorId && userRole === "SUPERVISOR") {
        effectiveSupervisorId = user.id;
      }


      const userSupervisorId = Number(user.supervisorId || user.supervisorProfile?.id || user.id);

      if (userRole === "ADMIN" || (userRole === "SUPERVISOR" && (userSupervisorId === effectiveSupervisorId || !supervisorId))) {
        setIsAuthorized(true);
      }
    } catch (e) {
      console.error("SupervisorDashboard: Auth parse failed", e);
    }
  }, [supervisorId, router]);

  // ----- Fetch Data -----
  const fetchStudents = async () => {
    try {
      const result = await apiFetch(`/students?supervisorId=${supervisorId}`);
      if (result.ok) {
        setStudents(result.data.students || []);
      } else {
        toast.error(result.error || "Failed to load students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const result = await apiFetch(`/tasks?supervisorId=${supervisorId}`);
      if (result.ok) {
        setTasks(result.data.tasks || []);
      } else {
        toast.error(result.error || "Failed to load tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchWeeklyLogs = async () => {
    try {
      const result = await apiFetch(`/weekly-logs?supervisorId=${supervisorId}`);
      if (result.ok) {
        setWeeklyLogs(result.data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching weekly logs:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStudents(), fetchTasks(), fetchWeeklyLogs()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && supervisorId) {
      fetchAllData();
    }
  }, [isAuthorized, supervisorId]);

  if (isAuthorized === null) {
    return <div className="min-h-screen bg-background" />;
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col overflow-hidden space-y-6 animate-pulse">
        {/* Tab bar skeleton */}
        <div className="flex gap-8 border-b border-slate-100 pb-6 shrink-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-20 bg-slate-200 rounded-full" />
          ))}
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <div className="h-3 w-16 bg-slate-200 rounded-full" />
              <div className="h-7 w-10 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
        {/* Content skeleton */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 flex-1">
          <div className="h-5 w-40 bg-slate-200 rounded-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }


  const stats = {
    totalStudents: students.length,
    pendingLogs: weeklyLogs.filter(l => l.status === 'SUBMITTED').length,
    activeTasks: tasks.filter(t => ['PENDING', 'IN_PROGRESS', 'SUBMITTED'].includes(t.status)).length,
    completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    urgentLogs: weeklyLogs.filter(l => l.status === 'SUBMITTED').length // Placeholder for actual logic
  };

  const handleAssignTask = async () => {
    if (newTask.studentId === "" || !newTask.title) return;
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          studentId: newTask.studentId,
          title: newTask.title,
          description: newTask.description,
          date: newTask.dueDate || new Date().toISOString(),
        }),
      });
      setNewTask({ studentId: "", title: "", description: "", dueDate: "" });
      setShowTaskModal(false);
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRateTask = async () => {
    if (!selectedTask && !selectedStudent) return;

    try {
      let finalSupervisorId = supervisorId;
      if (!finalSupervisorId) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          finalSupervisorId = user.supervisorProfile?.id || user.id;
        }
      }

      if (selectedTask) {
        await apiFetch("/tasks", {
          method: "PATCH",
          body: JSON.stringify({
            taskId: selectedTask.id,
            status: "COMPLETED",
            rating: ratingValue,
            comment: ratingComment,
            supervisorId: finalSupervisorId,
          }),
        });
      } else if (selectedStudent) {
        await apiFetch("/ratings", {
          method: "POST",
          body: JSON.stringify({
            studentId: selectedStudent.id,
            supervisorId: finalSupervisorId,
            rating: ratingValue,
            comment: ratingComment,
          }),
        });
        toast.success(`Student ${selectedStudent.user?.name || selectedStudent.name} rated successfully`);
      }

      fetchAllData();
      toast.success(selectedTask ? "Task rated successfully" : "Student assessment completed");
      setSelectedTask(null);
      setSelectedStudent(null);
      setRatingValue(7);
      setRatingComment("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit rating");
    }
  };

  const handleSaveAssessment = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
      let finalSupervisorId = supervisorId;
      if (!finalSupervisorId) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          finalSupervisorId = user.supervisorProfile?.id || user.id;
        }
      }

      await apiFetch(`/students/${selectedStudent.id}`, {
        method: "PATCH",
        body: JSON.stringify({ absentDays: assessment.absentDays })
      });

      const totalScore =
        assessment.knowledgeWirelessOps + assessment.knowledgeWirelessEst + assessment.knowledgeWirelessMaint + assessment.knowledgeApplication +
        assessment.responsibility + assessment.cooperativeness + assessment.complianceEtiquette +
        assessment.safetyAwareness + assessment.safetyCompliance + assessment.safetyArrangement;

      await apiFetch("/ratings", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudent.id,
          supervisorId: finalSupervisorId,
          rating: totalScore,
          comment: assessment.comment,
          knowledgeWirelessOps: assessment.knowledgeWirelessOps,
          knowledgeWirelessEst: assessment.knowledgeWirelessEst,
          knowledgeWirelessMaint: assessment.knowledgeWirelessMaint,
          knowledgeApplication: assessment.knowledgeApplication,
          responsibility: assessment.responsibility,
          cooperativeness: assessment.cooperativeness,
          complianceEtiquette: assessment.complianceEtiquette,
          safetyAwareness: assessment.safetyAwareness,
          safetyCompliance: assessment.safetyCompliance,
          safetyArrangement: assessment.safetyArrangement,
        }),
      });

      await apiFetch("/iap-reports", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudent.id,
          isUseful: assessment.isUseful === "Yes" ? true : assessment.isUseful === "No" ? false : undefined,
          improvedUnderstanding: assessment.improvedUnderstanding === "Yes" ? true : assessment.improvedUnderstanding === "No" ? false : undefined,
          providedExperiences: assessment.providedExperiences === "Yes" ? true : assessment.providedExperiences === "No" ? false : undefined,
          loVisitCount: assessment.loVisitCount,
          programmeTypes: assessment.programmeTypes,
          otherProgrammeDetails: assessment.otherProgrammeDetails,
          satisfactionIndustry: assessment.satisfactionIndustry,
          satisfactionMajor: assessment.satisfactionMajor,
          satisfactionPractical: assessment.satisfactionPractical,
          satisfactionInstructors: assessment.satisfactionInstructors,
          notableAchievements: assessment.notableAchievements,
          futureCareerPlan: assessment.futureCareerPlan,
          suggestions: assessment.suggestions
        })
      });

      toast.success("Industrial assessment submitted and synced");
      setSelectedStudent(null);
      fetchAllData();
    } catch (error) {
      toast.error("Assessment sync failed");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveWeeklyLog = async (logId: number, data: { grade: string; supervisorName: string; supervisorDate: string; note?: string }) => {
    setIsSaving(true);
    try {
      await apiFetch(`/weekly-logs/${logId}/approve`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      toast.success("Logbook approved and signed");
      setShowReviewModal(false);
      fetchWeeklyLogs();
    } catch (error) {
      toast.error("Approval failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectWeeklyLog = async (logId: number, note: string) => {
    setIsSaving(true);
    try {
      await apiFetch(`/weekly-logs/${logId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ note })
      });
      toast.success("Logbook sent back for corrections");
      setShowReviewModal(false);
      fetchWeeklyLogs();
    } catch (error) {
      toast.error("Rejection failed");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral/10 pb-6 shrink-0 mb-8">
        <div className="flex gap-8 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "students", label: "My Students", icon: Users },
            { id: "assignments", label: "Assignments", icon: Check },
            { id: "weekly-logs", label: "Review Logs", icon: FileText },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex items-center gap-2 pb-2 text-md font-semibold tracking-tight transition-all relative whitespace-nowrap cursor-pointer", activeTab === tab.id ? "text-primary border-b-3 border-primary rounded-lg" : "text-slate-400 hover:text-slate-600")}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'weekly-logs' && stats.pendingLogs > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {stats.pendingLogs}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStudents();
              fetchTasks();
              fetchWeeklyLogs();
              toast.success("Data refreshed");
            }}
            className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto space-y-8 pr-2 hide-scrollbar"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Active Students", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Pending Reviews", value: stats.pendingLogs, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Tasks Oversight", value: stats.activeTasks, icon: Check, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Completed Goals", value: stats.completedTasks, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={cn("p-3 rounded-2xl", stat.bg)}>
                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Actions / Recent Activity */}
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Priority Actions
                  </CardTitle>
                  <CardDescription>Items requiring your immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weeklyLogs.filter(l => l.status === 'SUBMITTED').length === 0 ? (
                      <div className="py-8 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                        No pending actions at the moment.
                      </div>
                    ) : (
                      weeklyLogs.filter(l => l.status === 'SUBMITTED').map(log => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-primary shadow-sm">
                              {log.student?.user.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{log.student?.user.name}</p>
                              <p className="text-xs text-slate-500">Submitted Week {log.weekNumber} Logbook</p>
                            </div>
                          </div>
                          <Button size="sm" className="cursor-pointer" onClick={() => { setSelectedWeeklyLog(log); setShowReviewModal(true); setActiveTab('weekly-logs'); }}>Review</Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Student Summary */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Quick Student View</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {students.slice(0, 5).map(student => (
                      <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-medium text-slate-700">{student.user?.name || student.name}</span>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-primary" onClick={() => setActiveTab('students')}>View Details</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === "students" && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 pb-10 pr-2 hide-scrollbar"
          >
            {students.map((student) => {
              const studentTasks = tasks.filter((t) => t.studentId === student.id);
              const totalTasks = studentTasks.length || 0;
              const completed = studentTasks.filter((t) => t.status === "COMPLETED").length;
              const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
              const initials = student.user?.name
                ? student.user.name.split(" ").map((n: any) => n[0]).join("")
                : "ST";
              const status =
                progress >= 80 ? "Excellent" : progress < 50 && totalTasks > 0 ? "Behind" : "On Track";

              return (
                <Card key={student.id} className="hover:border-primary/50 transition-colors group cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      {/* Progress Ring */}
                      <div className="h-24 w-24 rounded-full border-4 border-neutral/10 flex items-center justify-center relative">
                        <svg
                          className="absolute inset-0 h-full w-full -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-primary"
                            strokeDasharray={`${progress * 2.89} 289`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-xl font-bold text-primary">
                          {initials}
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-white border border-neutral/10 flex items-center justify-center shadow-sm">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            status === "Excellent"
                              ? "bg-green-500"
                              : status === "Behind"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          )}
                        ></span>
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-primary mb-1">
                      {student.user?.name || student.name}
                    </h3>
                    <p className="text-sm text-primary mb-1">{progress}% Tasks Completed</p>
                    <p className="text-xs text-muted-foreground mb-4">{completed}/{totalTasks} tasks done</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Work Logs</span>
                        <span className="text-sm font-bold text-slate-700">{weeklyLogs.filter(l => l.studentId === student.id).length} Total</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">To Review</span>
                        <span className="text-sm font-bold text-amber-600">{weeklyLogs.filter(l => l.studentId === student.id && l.status === 'SUBMITTED').length} Pending</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full pt-4">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[13px] font-md h-10 cursor-pointer border-2 hover:bg-primary hover:text-white transition-all border-slate-900"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowProfileModal(true);
                          }}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[13px] font-md h-10 cursor-pointer border-2 hover:bg-primary hover:text-white transition-all border-slate-900"
                          onClick={() => {
                            router.push(`/supervisor/${supervisorId}/ratings/${student.id}`);
                          }}
                        >
                          Rate Student
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        className="w-full text-xs h-10 bg-slate-900 text-white hover:bg-black shadow-md transition-all active:scale-95 cursor-pointer"
                        onClick={() => {
                          setActiveTab('weekly-logs');
                          setLogFilter('ALL');
                          setStudentSearch(student.user?.name || student.name || "");
                        }}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Review Logbooks
                      </Button>
                      <Button
                        size="sm"
                        className="w-full text-xs h-10 bg-primary text-white hover:bg-primary/90 shadow-md transition-all active:scale-95 cursor-pointer"
                        onClick={() => {
                          setNewTask({ ...newTask, studentId: student.id });
                          setShowTaskModal(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Assign New Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {activeTab === "assignments" && (
          <motion.div
            key="assignments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto space-y-8 pr-2 hide-scrollbar pb-10"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-4xl text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Check className="h-40 w-40" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight">Task Command & Control</h2>
                <p className="text-white/50 text-normal font-md mt-1">Manage institutional assignments and monitor student submissions</p>
              </div>
              <Button
                onClick={() => setShowTaskModal(true)}
                className="bg-primary hover:bg-white hover:text-primary text-white px-8 h-12 rounded-2xl font-medium text-md transition-all relative z-10"
              >
                <Plus className="h-4 w-4 mr-2" /> Issue New Assignment
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Reviews */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-amber-100 pb-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                  <h3 className="text-md font-bold text-slate-700">Awaiting Submission Review</h3>
                </div>

                <div className="grid gap-4">
                  {tasks.filter(t => t.status === 'SUBMITTED').length === 0 ? (
                    <div className="py-12 text-center bg-white border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-xs font-bold text-slate-300 ">No pending reviews</p>
                    </div>
                  ) : tasks.filter(t => t.status === 'SUBMITTED').map(task => (
                    <Card key={task.id} className="border-2 border-slate-100 rounded-3xl hover:border-primary/20 transition-all group overflow-hidden bg-white hover:shadow-xl hover:shadow-slate-100">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                              {task.student?.user.name[0]}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 ">Assigned to</p>
                              <p className="text-xs font-black text-slate-900">{task.student?.user.name}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">Pending Review</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{task.title}</h4>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{task.description}</p>
                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 tracking-tighter">Due: {new Date(task.date).toLocaleDateString()}</span>
                          <Button
                            onClick={() => {
                              setSelectedTask(task);
                              router.push(`/supervisor/${supervisorId}/ratings/${task.studentId}`);
                            }}
                            className="h-8 bg-slate-900 hover:bg-black text-white text-[10px] font-black  px-4 rounded-xl"
                          >
                            Review Submission
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Active & Completed */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <h3 className="text-md font-bold text-slate-700">Active institutional Tasks</h3>
                </div>

                <div className="grid gap-4">
                  {tasks.filter(t => t.status !== 'SUBMITTED').length === 0 ? (
                    <div className="py-12 text-center bg-white border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-xs font-bold text-slate-300">No active tasks</p>
                    </div>
                  ) : tasks.filter(t => t.status !== 'SUBMITTED').map(task => (
                    <div key={task.id} className="p-5 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                          task.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                        )}>
                          {task.status === 'COMPLETED' ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="text-md font-semibold text-slate-900">{task.title}</h4>
                          <p className="text-xs font-semibold text-slate-400">{task.student?.user.name}</p>
                        </div>
                      </div>
                      <span className={cn("text-[8px] font-black uppercase px-2 py-1 rounded-md",
                        task.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "weekly-logs" && (
          <motion.div
            key="weekly-logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 overflow-y-auto space-y-8 pr-2  pb-10"
          >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button
                  onClick={() => setLogFilter('SUBMITTED')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                    logFilter === 'SUBMITTED' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Pending Review ({weeklyLogs.filter(l => l.status === 'SUBMITTED').length})
                </button>
                <button
                  onClick={() => setLogFilter('ALL')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                    logFilter === 'ALL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  History Archive
                </button>
              </div>
              <div className="relative w-full md:w-64">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-11 pr-10 h-11 rounded-2xl border-slate-100 text-sm focus:ring-primary/20"
                  placeholder="Filter by student..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                {studentSearch && (
                  <button
                    onClick={() => setStudentSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-900" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const filtered = weeklyLogs.filter(l => {
                  const statusMatch = logFilter === 'ALL' ? true : l.status === 'SUBMITTED';
                  const studentMatch = l.student?.user.name.toLowerCase().includes(studentSearch.toLowerCase());
                  return statusMatch && studentMatch;
                });

                if (filtered.length === 0) {
                  return (
                    <Card className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/30 rounded-3xl">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm">
                          <FileText className="h-10 w-10 text-slate-300" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {logFilter === 'SUBMITTED' ? "No pending reviews!" : "No logs found matching criteria"}
                          </h3>
                          <p className="text-sm text-slate-500 max-w-[280px] mx-auto mt-1">
                            {logFilter === 'SUBMITTED'
                              ? "All caught up with submissions."
                              : "Try adjusting your search or filters."}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                }

                return (
                  <div className="col-span-full max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                      {filtered.map(log => (
                        <Card
                          key={log.id}
                          className={cn(
                            "hover:shadow-xl transition-all border shadow-sm cursor-pointer group rounded-2xl overflow-hidden h-full",
                            log.status === 'SUBMITTED' ? "border-amber-200 bg-amber-50/30" : "border-slate-100 bg-white"
                          )}
                          onClick={() => { setSelectedWeeklyLog(log); setShowReviewModal(true); }}
                        >
                          <CardHeader className={cn(
                            "pb-3 border-b bg-white/50",
                            log.status === 'SUBMITTED' ? "border-amber-100" : "border-slate-50"
                          )}>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-sm border border-primary/10">
                                  {log.student?.user.name.split(" ").map(n => n[0]).join("") || "ST"}
                                </div>
                                <div>
                                  <CardTitle className="text-base font-bold text-slate-900">{log.student?.user.name}</CardTitle>
                                  <CardDescription className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                    Week {log.weekNumber} • {log.status}
                                  </CardDescription>
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border",
                                log.status === 'SUBMITTED' ? "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" :
                                  log.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                    "bg-red-100 text-red-700 border-red-200"
                              )}>
                                {log.status === 'SUBMITTED' ? 'Review Needed' : log.status}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-5 bg-white">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Period:</span>
                                <span className="font-bold text-slate-900">{new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Work Hours:</span>
                                <span className="font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{log.totalHours || 0} Hours</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 italic border-l-2 border-slate-200 pl-3 py-1 mt-2">
                                "{log.generalStatement || "No summary provided."}"
                              </p>
                              <div className="pt-4 flex justify-end items-center gap-2">
                                <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">View Details</Button>
                                {log.status === 'SUBMITTED' && (
                                  <Button size="sm" className="h-8 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all">Review Now</Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div >
          </motion.div >
        )}

      </AnimatePresence >

      {/* Task Modal */}
      <AnimatePresence>
        {
          showTaskModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
              <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-primary">Assign New Task</h3>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-primary mb-2 block">Task Title *</label>
                    <Input
                      placeholder="e.g., Design database schema"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary mb-2 block">Description</label>
                    <textarea
                      className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
                      placeholder="Describe task..."
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary mb-2 block">Due Date</label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                  <Button
                    onClick={handleAssignTask}
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={!newTask.title || !newTask.studentId}
                  >
                    <Check className="h-4 w-4 mr-2" /> Assign Task
                  </Button>
                </div>
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Modal removed based on user request to use separate page */}

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-primary">Student Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-primary hover:text-primary/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="text-center">
                  <h4 className="font-black text-2xl text-slate-900 select-all">{selectedStudent.user?.name}</h4>
                  <p className="text-md font-semibold text-primary/60 mt-1">Student Intern Portfolio</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-wide">Digital credentials:</label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Email Address</span>
                        <span className="text-sm font-bold text-slate-900 select-all">{selectedStudent.user?.email}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                        <span className="text-xs font-bold text-slate-500">Contact Number</span>
                        <span className="text-sm font-bold text-slate-900 select-all">{selectedStudent.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-wide">Placement Verification:</label>
                    <div className="p-5 bg-linear-to-br from-primary to-slate-800 rounded-2xl text-white shadow-lg shadow-primary/20">
                      <p className="text-lg font-black">{selectedStudent.companyName || "No Company Assigned"}</p>
                      <p className="text-xs font-medium text-white/70 mt-1">{selectedStudent.companyAddress}</p>
                      <div className="mt-4 flex gap-4 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-[8px] font-black uppercase text-white/50">Supervisor</p>
                          <p className="text-xs font-bold">{selectedStudent.supervisorName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black uppercase text-white/50">LO Assigned</p>
                          <p className="text-xs font-bold">{selectedStudent.liaisonOfficerName || "None"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <Button className="font-semibold px-6 rounded-xl cursor-pointer" onClick={() => setShowProfileModal(false)}>Acknowledge</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && selectedWeeklyLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                    {selectedWeeklyLog.weekNumber}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Review Week {selectedWeeklyLog.weekNumber}</h3>
                    <p className="text-sm text-slate-500">{selectedWeeklyLog.student?.user.name} • {new Date(selectedWeeklyLog.startDate || "").toLocaleDateString()} - {new Date(selectedWeeklyLog.endDate || "").toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center transition-all group">
                  <X className="h-5 w-5 text-slate-400 group-hover:text-slate-900" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Daily Activities
                      </h4>
                      <div className="space-y-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                          const taskKey = `${day.toLowerCase()}Task` as keyof WeeklyLog;
                          const hoursKey = `${day.toLowerCase()}Hours` as keyof WeeklyLog;
                          return (
                            <div key={day} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-400 uppercase">{day}</span>
                                <span className="text-xs font-bold text-primary">{(selectedWeeklyLog[hoursKey] as number) || 0} hrs</span>
                              </div>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{(selectedWeeklyLog[taskKey] as string) || "No activity recorded."}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                      <h4 className="font-bold text-primary text-sm uppercase tracking-wider mb-4">Weekly Summary</h4>
                      <p className="text-sm text-slate-700 leading-relaxed italic">&quot;{selectedWeeklyLog.generalStatement || "No summary provided."}&quot;</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Supervisor Assessment</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">Grade (A-E)</label>
                          <select
                            id="review-grade"
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            defaultValue={selectedWeeklyLog.grade || ""}
                            disabled={selectedWeeklyLog.status === 'APPROVED' || isSaving}
                          >
                            <option value="" disabled>Select...</option>
                            <option value="A">A - Excellent</option>
                            <option value="B">B - Good</option>
                            <option value="C">C - Satisfactory</option>
                            <option value="D">D - Poor</option>
                            <option value="E">E - Unacceptable</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">Date</label>
                          <input
                            type="date"
                            id="review-date"
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            defaultValue={formatDate(selectedWeeklyLog.supervisorDate) || new Date().toISOString().split('T')[0]}
                            disabled={selectedWeeklyLog.status === 'APPROVED' || isSaving}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-xs font-bold text-slate-500">Supervisor Name</label>
                          <input
                            type="text"
                            id="review-name"
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            placeholder="Your Full Name"
                            defaultValue={selectedWeeklyLog.supervisorName || ""}
                            disabled={selectedWeeklyLog.status === 'APPROVED' || isSaving}
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-xs font-bold text-slate-500">Feedback / Note (Optional)</label>
                          <textarea
                            id="review-note"
                            className="w-full h-24 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none resize-none disabled:bg-slate-50 disabled:text-slate-400"
                            placeholder="Add comments for the student..."
                            disabled={selectedWeeklyLog.status === 'APPROVED' || isSaving}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-amber-400 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting Verification</span>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  {selectedWeeklyLog.status !== 'APPROVED' ? (
                    <>
                      <Button
                        variant="ghost"
                        className="flex-1 md:flex-none h-12 px-8 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                        disabled={isSaving}
                        onClick={() => {
                          const note = (document.getElementById('review-note') as HTMLTextAreaElement).value;
                          handleRejectWeeklyLog(selectedWeeklyLog.id, note);
                        }}
                      >
                        Reject Log
                      </Button>
                      <Button
                        className="flex-1 md:flex-none h-12 px-10 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        disabled={isSaving}
                        onClick={() => {
                          const grade = (document.getElementById('review-grade') as HTMLSelectElement).value;
                          const date = (document.getElementById('review-date') as HTMLInputElement).value;
                          const name = (document.getElementById('review-name') as HTMLInputElement).value;
                          const note = (document.getElementById('review-note') as HTMLTextAreaElement).value;
                          if (!grade || !name) {
                            toast.error("Grade and Name are required");
                            return;
                          }

                          handleApproveWeeklyLog(selectedWeeklyLog.id, {
                            grade,
                            supervisorName: name,
                            supervisorDate: date,
                            note
                          });
                        }}
                      >
                        {isSaving ? "Processing..." : "Approve & Sign Log"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-12 px-10 rounded-xl font-bold border-green-500 text-green-600 bg-green-50"
                      onClick={() => setShowReviewModal(false)}
                    >
                      <Check className="h-4 w-4 mr-2" /> Log Approved
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-right" />
    </div >
  );
}
