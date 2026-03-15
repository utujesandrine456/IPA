"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    CheckCircle2,
    Circle,
    Upload,
    Plus,
    Search,
    Filter,
    Calendar,
    ArrowRight,
    AlertCircle,
    X,
    Check,
    MessageSquare
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Task {
    id: number;
    title: string;
    description: string;
    status: "PENDING" | "SUBMITTED" | "COMPLETED" | "IN_PROGRESS" | "REJECTED";
    date: string;
    submittedAt?: string;
    completedAt?: string;
    comments?: Array<{ content: string; createdAt: string }>;
}

export default function StudentTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<number | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [submission, setSubmission] = useState({ description: "", attachments: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const sId = user.studentProfile?.id || user.studentId;
                if (sId) {
                    setStudentId(sId);
                }
            } catch (e) {
                console.error("StudentTasksPage: Auth parse failed", e);
            }
        }
    }, [router]);

    useEffect(() => {
        if (studentId) {
            fetchTasks();
        }
    }, [studentId]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const result = await apiFetch(`/tasks?studentId=${studentId}`);
            if (result.ok) {
                setTasks(result.data?.tasks || []);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitTask = async () => {
        if (!selectedTask) return;
        try {
            await apiFetch("/tasks", {
                method: "PATCH",
                body: JSON.stringify({
                    taskId: selectedTask.id,
                    status: "SUBMITTED",
                    description: submission.description,
                    attachments: submission.attachments
                }),
            });
            toast.success("Task submitted successfully!");
            setShowSubmitModal(false);
            setSubmission({ description: "", attachments: "" });
            fetchTasks();
        } catch (error) {
            console.error("Error submitting task:", error);
            toast.error("Submission failed");
        }
    };

    const filteredTasks = tasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || t.status.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "SUBMITTED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
            case "IN_PROGRESS": return "bg-amber-100 text-amber-700 border-amber-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assignment Board</h1>
                    <p className="text-slate-500 mt-1">Manage, track, and submit internship tasks assigned by your supervisor.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-10 h-11 w-[260px] rounded-xl border-slate-200 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Quick Status Filters */}
            <div className="flex gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200">
                {["All", "Pending", "Submitted", "Completed"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status === "All" ? "all" : status.toUpperCase())}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                            (filterStatus === status.toUpperCase() || (status === "All" && filterStatus === "all"))
                                ? "bg-white text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="h-[200px] animate-pulse bg-slate-50 border-none" />
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <Card className="py-24 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-white rounded-2xl shadow-sm">
                            <AlertCircle className="h-10 w-10 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">No tasks found</h3>
                            <p className="text-sm text-slate-500 max-w-[300px] mx-auto mt-1">
                                {filterStatus === "all"
                                    ? "Your supervisor hasn't assigned any tasks to you yet."
                                    : `You don't have any tasks with status "${filterStatus.toLowerCase()}".`}
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map((task) => (
                        <Card key={task.id} className="group hover:shadow-xl transition-all border-none bg-white shadow-sm ring-1 ring-slate-200 rounded-3xl overflow-hidden flex flex-col">
                            <CardHeader className="p-6 pb-4">
                                <div className="flex justify-between items-start">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border", getStatusColor(task.status))}>
                                        {task.status}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-medium">{new Date(task.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <CardTitle className="text-xl mt-4 font-bold text-slate-900 line-clamp-1">{task.title}</CardTitle>
                                <CardDescription className="text-sm text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                                    {task.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 mt-auto">
                                {task.status === "REJECTED" && task.comments && task.comments.length > 0 && (
                                    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 space-y-2">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Supervisor Feedback</span>
                                        </div>
                                        <p className="text-xs text-red-700 font-medium leading-relaxed italic line-clamp-3">
                                            &quot;{task.comments[0].content.split('Feedback: ')[1] || task.comments[0].content}&quot;
                                        </p>
                                    </div>
                                )}
                                <div className="h-px bg-slate-100 w-full mb-6" />
                                {task.status === "COMPLETED" ? (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100">
                                        <Check className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-wide">Task Approved</span>
                                    </div>
                                ) : task.status === "SUBMITTED" ? (
                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-3 rounded-2xl border border-blue-100">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-wide">Awaiting Review</span>
                                    </div>
                                ) : (
                                    <Button
                                        className={cn(
                                            "w-full h-12 rounded-2xl text-white shadow-lg transition-all font-bold gap-2",
                                            task.status === 'REJECTED' ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                                        )}
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setShowSubmitModal(true);
                                        }}
                                    >
                                        <Upload className="h-4 w-4" />
                                        {task.status === 'REJECTED' ? "Repeat Task" : "Submit Work"}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showSubmitModal && selectedTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 shadow-2xl backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Plus className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Task Submission</h3>
                                        <p className="text-sm text-slate-500">{selectedTask.title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center justify-between">
                                        Completion Summary
                                        <span className="text-[10px] normal-case font-medium text-slate-400">Required</span>
                                    </label>
                                    <textarea
                                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/30 px-5 py-4 text-sm focus:border-primary/30 focus:bg-white focus:outline-none transition-all min-h-[180px] leading-relaxed"
                                        placeholder="Detail your work, challenges faced, and results achieved..."
                                        value={submission.description}
                                        onChange={(e) => setSubmission({ ...submission, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        Links & Resources
                                    </label>
                                    <Input
                                        className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:border-primary/30 focus:bg-white text-sm"
                                        placeholder="GitHub repo, Google Drive, or document links..."
                                        value={submission.attachments}
                                        onChange={(e) => setSubmission({ ...submission, attachments: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-4">
                                <Button
                                    variant="ghost"
                                    className="h-12 px-8 rounded-xl font-bold text-slate-500 hover:bg-white"
                                    onClick={() => setShowSubmitModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitTask}
                                    disabled={!submission.description.trim()}
                                    className="h-12 px-10 rounded-xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold disabled:opacity-50"
                                >
                                    Submit Final Work
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <Toaster position="top-right" />
        </div>
    );
}
