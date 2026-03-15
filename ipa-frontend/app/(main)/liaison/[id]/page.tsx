"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { Users, LayoutDashboard, FileText, Check, Clock, RefreshCw, X, ShieldCheck, AlertCircle } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Student {
    id: number;
    name: string;
    liaisonId: number;
    user?: { id: number; name: string; email: string };
    phone?: string;
    address?: string;
    companyName?: string;
    companyAddress?: string;
    supervisorName?: string;
    supervisorEmail?: string;
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
    status: 'DRAFT' | 'SUBMITTED' | 'COMPLETED' | 'REJECTED';
    student?: { user: { name: string } };
    liaisonName?: string;
    liaisonDate?: string;
    liaisonSignature?: boolean;
    supervisorSignature?: boolean;
}

export default function LiaisonDashboard() {
    const [activeTab, setActiveTab] = useState<"overview" | "students" | "weekly-logs">("overview");
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedWeeklyLog, setSelectedWeeklyLog] = useState<WeeklyLog | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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

    const params = useParams();
    const searchParams = useSearchParams();
    const liaisonIdParam = params.id as string || searchParams.get("liaisonId");
    const liaisonId = liaisonIdParam ? Number(liaisonIdParam) : undefined;
    const [userName, setUserName] = useState<string>("");

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return; // MainLayout handles login redirect

        try {
            const user = JSON.parse(storedUser);
            setUserName(user.name);
            const userRole = user.role?.toUpperCase();
            const userLiaisonId = Number(user.liaisonId || user.id);

            // Only proceed if authorized for this page, but don't redirect (MainLayout does that)
            if (userRole === "ADMIN" || (userRole === "LIAISON" && userLiaisonId === liaisonId)) {
                setIsAuthorized(true);
            }
        } catch (e) {
            console.error("LiaisonDashboard: Auth parse failed", e);
        }
    }, [liaisonId, router]);

    const fetchStudents = async () => {
        try {
            const result = await apiFetch(`/students?liaisonId=${liaisonId}`);
            if (result.ok) {
                setStudents(result.data.students || []);
            } else {
                console.error("Error fetching students:", result.error);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchWeeklyLogs = async () => {
        try {
            const result = await apiFetch(`/weekly-logs?liaisonId=${liaisonId}`);
            if (result.ok) {
                setWeeklyLogs(result.data.logs || []);
            } else {
                console.error("Error fetching weekly logs:", result.error);
            }
        } catch (error) {
            console.error("Error fetching weekly logs:", error);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchStudents(),
                fetchWeeklyLogs(),
            ]);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized && liaisonId) {
            fetchAllData();
        }
    }, [isAuthorized, liaisonId]);

    const handleVerifyWeeklyLog = async (logId: number) => {
        setIsSaving(true);
        try {
            await apiFetch(`/weekly-logs/${logId}/verify-liaison`, {
                method: "PATCH",
                body: JSON.stringify({
                    liaisonName: userName
                }),
            });
            toast.success("Logbook week verified successfully");
            setShowReviewModal(false);
            fetchWeeklyLogs();
        } catch (error) {
            console.error("Error verifying log:", error);
            toast.error("Failed to verify weekly log");
        } finally {
            setIsSaving(false);
        }
    };

    if (isAuthorized === null) {
        return <div className="min-h-screen bg-slate-50" />;
    }

    const completedLogs = weeklyLogs.filter(w => w.liaisonSignature).length;
    const pendingLogs = weeklyLogs.filter(w => !w.liaisonSignature && (w.status === 'SUBMITTED' || w.status === 'COMPLETED')).length;

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col max-w-7xl mx-auto w-full">
            <Toaster position="top-right" />

            {/* Header section fixed */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Liaison Officer Portal</h1>
                    <p className="text-slate-500 mt-1">Review and verify student logbooks securely</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchAllData} className="gap-2 cursor-pointer shadow-sm rounded-xl border-slate-200">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 p-1 bg-white border border-slate-200 rounded-xl mb-6 shadow-sm w-fit shrink-0">
                {[
                    { id: "overview", label: "Overview", icon: LayoutDashboard },
                    { id: "students", label: "My Students", icon: Users },
                    { id: "weekly-logs", label: "Verify Logs", icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer",
                            activeTab === tab.id
                                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-slate-300" : "text-slate-400")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden">

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="h-full overflow-y-auto scrollbar-hide pb-10">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-3xl border border-slate-200" />)}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Assigned Students</CardTitle>
                                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-blue-600" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-4xl font-black text-slate-900">{students.length}</div>
                                            <p className="text-sm font-semibold text-blue-600 mt-1 flex items-center gap-1">
                                                Active placements
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Verification</CardTitle>
                                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                                <Clock className="h-5 w-5 text-amber-600" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-4xl font-black text-slate-900">{pendingLogs}</div>
                                            <p className="text-sm font-semibold text-amber-600 mt-1 flex items-center gap-1">
                                                Logs waiting for your signature
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Verified Logs</CardTitle>
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-4xl font-black text-slate-900">{completedLogs}</div>
                                            <p className="text-sm font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                                Logbooks successfully reviewed
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                        <ShieldCheck className="w-64 h-64 text-white" />
                                    </div>
                                    <div className="max-w-2xl relative z-10 space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-semibold text-xs tracking-wide uppercase">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            Officer Instructions
                                        </div>
                                        <h2 className="text-3xl font-black leading-tight">Secure Assessment Vault Access</h2>
                                        <p className="text-slate-300 text-lg font-medium leading-relaxed">
                                            As a Liaison Officer, your primary responsibility is to review the students' weekly logs and add your official digital signature. This verification authenticates the student's logbook for their final graduation assessment.
                                        </p>
                                        <div className="pt-4">
                                            <Button onClick={() => setActiveTab('weekly-logs')} className="bg-white text-slate-900 hover:bg-slate-100 px-6 rounded-xl font-bold border border-slate-200">
                                                Start Verifying Logs
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === "students" && (
                    <div className="h-full overflow-y-auto scrollbar-hide pb-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {students.map((student) => (
                                <Card key={student.id} className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
                                    <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-xl text-primary shrink-0">
                                                {student.user?.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">{student.user?.name}</h3>
                                                <p className="text-slate-500 font-medium text-sm">{student.user?.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white flex-1 flex flex-col gap-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Company</span>
                                                <span className="text-sm font-semibold text-slate-900">{student.companyName || "Not assigned"}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Supervisor</span>
                                                <span className="text-sm font-semibold text-slate-900">{student.supervisorName || "Not assigned"}</span>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-6 border-t border-slate-100">
                                            <Button
                                                onClick={() => setActiveTab("weekly-logs")}
                                                variant="outline"
                                                className="w-full justify-center shadow-sm"
                                            >
                                                <FileText className="h-4 w-4 mr-2 text-slate-400" />
                                                View Student Logs
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {students.length === 0 && !loading && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                    <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900">No Students Assigned</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mt-2">You haven't been assigned any students to evaluate yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Weekly Logs Tab */}
                {activeTab === "weekly-logs" && (
                    <div className="h-full overflow-y-auto scrollbar-hide pb-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {weeklyLogs.map((log) => (
                                <Card key={log.id} className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-colors">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">WK</span>
                                                <span className="font-black text-lg text-slate-900 leading-none">{log.weekNumber}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{log.student?.user?.name || "Unknown Student"}</h3>
                                                <p className="text-xs font-medium text-slate-500 mt-1">
                                                    {new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {log.liaisonSignature ? (
                                                <span className="px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                    Verified
                                                </span>
                                            ) : log.status === 'COMPLETED' ? (
                                                <span className="px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Needs Verification
                                                </span>
                                            ) : log.status === 'SUBMITTED' ? (
                                                <span className="px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Submitted
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white flex-1 flex flex-col">
                                        {log.generalStatement && (
                                            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <span className="text-xs font-bold uppercase text-slate-400 mb-2 block">Student Summary</span>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                                                    {log.generalStatement}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col justify-center">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Hours</span>
                                                <span className="font-black text-2xl text-slate-900">{log.totalHours || 0}</span>
                                            </div>
                                            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col justify-center">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Supervisor Signature</span>
                                                <span className={cn("font-bold text-sm flex items-center gap-2 mt-1", log.supervisorSignature ? "text-emerald-600" : "text-amber-500")}>
                                                    {log.supervisorSignature ? <><Check className="h-4 w-4" /> Signed</> : <><Clock className="h-4 w-4" /> Pending</>}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex justify-between gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="font-bold shadow-sm"
                                                onClick={() => {
                                                    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2009/api";
                                                    window.open(`${base}/weekly-logs/${log.id}/pdf`, "_blank");
                                                }}
                                            >
                                                Download PDF
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="flex-1 font-bold shadow-sm"
                                                onClick={() => {
                                                    setSelectedWeeklyLog(log);
                                                    setShowReviewModal(true);
                                                }}
                                            >
                                                {log.liaisonSignature ? "View Logbook Details" : "Review & Verify"}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {weeklyLogs.length === 0 && !loading && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900">No Weekly Logs Available</h3>
                                    <p className="text-slate-500 mt-2">Your students have not generated any weekly logs yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Modify / Verify Log Modal */}
            <AnimatePresence>
                {showReviewModal && selectedWeeklyLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl shadow-sm text-center flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">WK</span>
                                        <span className="text-xl font-black text-slate-900 leading-none">{selectedWeeklyLog.weekNumber}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedWeeklyLog.student?.user?.name}'s Log</h2>
                                        <p className="text-sm font-medium text-slate-500">
                                            {new Date(selectedWeeklyLog.startDate).toLocaleDateString()} - {new Date(selectedWeeklyLog.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReviewModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

                                <div className="grid grid-cols-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    {[
                                        { day: 'Mon', task: selectedWeeklyLog.mondayTask, hrs: selectedWeeklyLog.mondayHours },
                                        { day: 'Tue', task: selectedWeeklyLog.tuesdayTask, hrs: selectedWeeklyLog.tuesdayHours },
                                        { day: 'Wed', task: selectedWeeklyLog.wednesdayTask, hrs: selectedWeeklyLog.wednesdayHours },
                                        { day: 'Thu', task: selectedWeeklyLog.thursdayTask, hrs: selectedWeeklyLog.thursdayHours },
                                        { day: 'Fri', task: selectedWeeklyLog.fridayTask, hrs: selectedWeeklyLog.fridayHours },
                                    ].map((d, i) => (
                                        <div key={d.day} className={cn("flex flex-col border-slate-100", i !== 0 && "border-l")}>
                                            <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                                                <span className="font-bold text-slate-600 text-xs uppercase">{d.day}</span>
                                                <span className="font-bold text-primary text-xs bg-primary/10 px-2 rounded-md">{d.hrs || 0}h</span>
                                            </div>
                                            <div className="p-3 text-sm text-slate-700 min-h-[100px] whitespace-pre-wrap">
                                                {d.task || <span className="text-slate-400 italic">No entry</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-slate-400" />
                                        General Summary
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap min-h-[80px]">
                                        {selectedWeeklyLog.generalStatement || <span className="text-slate-400 italic">Student has not provided a general summary yet.</span>}
                                    </div>
                                </div>

                            </div>

                            <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {!selectedWeeklyLog.liaisonSignature ? (
                                        <div className="text-sm font-semibold text-amber-600 flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                                            <AlertCircle className="h-4 w-4" /> This logbook requires your verification
                                        </div>
                                    ) : (
                                        <div className="text-sm font-semibold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                            <ShieldCheck className="h-4 w-4" /> Authenticated by {selectedWeeklyLog.liaisonName} on {new Date(selectedWeeklyLog.liaisonDate!).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                {!selectedWeeklyLog.liaisonSignature && (
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setShowReviewModal(false)}>Close</Button>
                                        <Button
                                            onClick={() => handleVerifyWeeklyLog(selectedWeeklyLog.id)}
                                            disabled={isSaving}
                                            className="gap-2 font-bold shadow-sm cursor-pointer"
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            {isSaving ? "Verifying..." : "Verify & Sign Logbook"}
                                        </Button>
                                    </div>
                                )}
                                {selectedWeeklyLog.liaisonSignature && (
                                    <Button variant="outline" onClick={() => setShowReviewModal(false)}>Close Window</Button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
