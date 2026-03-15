"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    FileText,
    X,
    Check,
    Plus,
    Clock,
    RefreshCw,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { apiFetch } from "@/lib/api";

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
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    studentId: number;
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
    grade?: string;
    supervisorName?: string;
    supervisorDate?: string;
    supervisorSignature?: boolean;
}

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

export default function SupervisorLogbookPage() {
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedWeeklyLog, setSelectedWeeklyLog] = useState<WeeklyLog | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [logFilter, setLogFilter] = useState<'SUBMITTED' | 'ALL'>('SUBMITTED');
    const [studentSearch, setStudentSearch] = useState("");

    const params = useParams();
    const supervisorId = params.id ? Number(params.id) : undefined;

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

    const fetchStudents = async () => {
        try {
            const result = await apiFetch(`/students?supervisorId=${supervisorId}`);
            if (result.ok) {
                setStudents(result.data.students || []);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    useEffect(() => {
        if (supervisorId) {
            setLoading(true);
            Promise.all([fetchWeeklyLogs(), fetchStudents()]).finally(() => setLoading(false));
        }
    }, [supervisorId]);

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

    if (loading) return <div className="p-8 animate-pulse space-y-4 shadow-sm bg-white rounded-3xl h-full" />;

    return (
        <div className="h-full flex flex-col space-y-8 pr-2 pb-10">
            {/* modern professional header */}
            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FileText className="h-48 w-48 rotate-12 text-white" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-white">
                        Institutional Logbook Archive
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed">
                        Systematic oversight of student technical progress. Track daily industrial activities, verify work hours, and provide professional feedback through institutional grade assignments.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white p-4 md:p-5 rounded-3xl border-2 border-slate-50 shadow-sm">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full md:w-auto">
                    <button
                        onClick={() => setLogFilter('SUBMITTED')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[15px] font-semibold transition-all cursor-pointer ",
                            logFilter === 'SUBMITTED' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Pending review ({weeklyLogs.filter(l => l.status === 'SUBMITTED').length})
                    </button>
                    <button
                        onClick={() => setLogFilter('ALL')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[15px] font-semibold transition-all cursor-pointer ",
                            logFilter === 'ALL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        History archive
                    </button>
                </div>
                <div className="relative w-full md:w-80">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        className="pl-11 pr-10 h-12 rounded-2xl border-2 border-slate-50 bg-slate-50/50 text-sm font-medium text-slate-700 focus:bg-white focus:ring-primary/20 transition-all placeholder:lowercase"
                        placeholder="search student identity..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    {studentSearch && (
                        <button
                            onClick={() => setStudentSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
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
                        <div className="col-span-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4">
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
                                                    <div>
                                                        <CardTitle className="text-sm font-semibold text-slate-900 ">{log.student?.user.name}</CardTitle>
                                                        <CardDescription className="text-[14px] font-medium text-slate-400 italic">
                                                            week {log.weekNumber} • {log.status.toLowerCase()}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "text-[12px] font-medium px-3 py-1 rounded-md border ",
                                                    log.status === 'SUBMITTED' ? "bg-amber-100 text-amber-700 border-amber-200 animate-pulse" :
                                                    log.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                            "bg-red-100 text-red-700 border-red-200"
                                                )}>
                                                    {log.status === 'SUBMITTED' ? 'review needed' : log.status.toLowerCase()}
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
                                                    <span className="font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg">{(log as any).totalHours || 0} Hours</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 italic border-l-2 border-slate-200 pl-3 py-1 mt-2">
                                                    "{(log as any).generalStatement || "No summary provided."}"
                                                </p>
                                                <div className="pt-4 flex justify-end items-center gap-2">
                                                    <Button size="sm" variant="outline" className="h-9 text-[11px] font-black border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all cursor-pointer rounded-xl lowercase">view details</Button>
                                                    {log.status === 'SUBMITTED' && (
                                                        <Button size="sm" className="h-9 text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all cursor-pointer rounded-xl lowercase border-none">review now</Button>
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
            </div>

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
                                <button onClick={() => setShowReviewModal(false)} className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm flex items-center justify-center transition-all group cursor-pointer">
                                    <X className="h-5 w-5 text-slate-400 group-hover:text-slate-900" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 h-full">
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
                                            <p className="text-sm text-slate-700 leading-relaxed italic">&quot;{(selectedWeeklyLog as any).generalStatement || "No summary provided."}&quot;</p>
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
                                                        disabled={selectedWeeklyLog.status === 'COMPLETED' || isSaving}
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
                                                        disabled={selectedWeeklyLog.status === 'COMPLETED' || isSaving}
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
                                                        disabled={selectedWeeklyLog.status === 'COMPLETED' || isSaving}
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <label className="text-xs font-bold text-slate-500">Feedback / Note (Optional)</label>
                                                    <textarea
                                                        id="review-note"
                                                        className="w-full h-24 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none resize-none disabled:bg-slate-50 disabled:text-slate-400"
                                                        placeholder="Add comments for the student..."
                                                        disabled={selectedWeeklyLog.status === 'COMPLETED' || isSaving}
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
                                    {selectedWeeklyLog.status !== 'COMPLETED' ? (
                                        <>
                                            <Button
                                                variant="ghost"
                                                className="flex-1 md:flex-none h-12 px-8 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 cursor-pointer"
                                                disabled={isSaving}
                                                onClick={() => {
                                                    const note = (document.getElementById('review-note') as HTMLTextAreaElement).value;
                                                    handleRejectWeeklyLog(selectedWeeklyLog.id, note);
                                                }}
                                            >
                                                Reject Log
                                            </Button>
                                            <Button
                                                className="flex-1 md:flex-none h-12 px-10 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
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
        </div>
    );
}
