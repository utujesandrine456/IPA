"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Loader2, FileText, CheckSquare, MessageSquare, Star } from "lucide-react";

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    date: string;
    submissionContent?: string;
    rating?: number;
    comments?: { id: number; content: string; createdAt: string }[];
}

interface LogEntry {
    id: number;
    content: string;
    date: string;
}

export default function StudentLogbookPage() {
    const [activeTab, setActiveTab] = useState<"tasks" | "logs">("tasks");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // States for Tasks
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [submittingTask, setSubmittingTask] = useState<number | null>(null);
    const [submissionText, setSubmissionText] = useState("");
    const [expandedTask, setExpandedTask] = useState<number | null>(null);

    // States for Daily Logs
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [newLogContent, setNewLogContent] = useState("");
    const [submittingLog, setSubmittingLog] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);

    // Mock ID
    const studentId = "1";

    useEffect(() => {
        fetchTasks();
        fetchLogs();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`/api/logbook?studentId=${studentId}`);
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch(`/api/daily-log?studentId=${studentId}`);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSubmitTaskWork = async (taskId: number) => {
        setSubmittingTask(taskId);
        try {
            await fetch("/api/logbook", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskId,
                    submissionContent: submissionText,
                    status: "SUBMITTED"
                })
            });
            setExpandedTask(null);
            setSubmissionText("");
            fetchTasks();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingTask(null);
        }
    };

    const handleCreateLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingLog(true);
        try {
            await fetch("/api/daily-log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    content: newLogContent
                })
            });
            setNewLogContent("");
            setShowLogForm(false);
            fetchLogs();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmittingLog(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">My Logbook</h1>
                    <p className="text-primary/60">Manage your assigned tasks and daily records</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-neutral/10">
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "tasks" ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-primary"
                        }`}
                >
                    <CheckSquare className="h-4 w-4" /> Assigned Tasks
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === "logs" ? "border-primary text-primary" : "border-transparent text-neutral-500 hover:text-primary"
                        }`}
                >
                    <FileText className="h-4 w-4" /> Daily Log
                </button>
            </div>

            {/* Content */}
            {activeTab === "tasks" ? (
                <div className="space-y-4">
                    {loadingTasks ? (
                        <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No assigned tasks found.</div>
                    ) : (
                        tasks.map((task) => (
                            <Card key={task.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{task.title}</CardTitle>
                                            <CardDescription>{new Date(task.date).toLocaleDateString()}</CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 text-xs rounded-full border ${task.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    task.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        task.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {task.status}
                                            </span>
                                            {task.rating && (
                                                <div className="flex items-center text-yellow-500">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`h-3 w-3 ${i < task.rating! ? "fill-current" : "text-neutral-300"}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm">{task.description}</p>

                                    {/* Submission Display */}
                                    {task.submissionContent && (
                                        <div className="bg-neutral/5 p-3 rounded-lg border border-neutral/10">
                                            <p className="text-xs font-bold text-primary mb-1">Your Submission:</p>
                                            <p className="text-sm text-neutral-700">{task.submissionContent}</p>
                                        </div>
                                    )}

                                    {/* Supervisor Comments */}
                                    {task.comments && task.comments.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-primary flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Supervisor Comments:</p>
                                            {task.comments.map(comment => (
                                                <div key={comment.id} className="bg-blue-50/50 p-2 rounded text-xs text-blue-900 border border-blue-100">
                                                    {comment.content}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Area */}
                                    {(task.status !== 'SUBMITTED' && task.status !== 'APPROVED') && (
                                        <div className="pt-2 border-t border-neutral/10">
                                            {expandedTask === task.id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                                        placeholder={task.status === 'REJECTED' ? "Address the feedback and resubmit..." : "Describe your work..."}
                                                        value={submissionText}
                                                        onChange={(e) => setSubmissionText(e.target.value)}
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button size="sm" variant="ghost" onClick={() => setExpandedTask(null)}>Cancel</Button>
                                                        <Button size="sm" disabled={submittingTask === task.id} onClick={() => handleSubmitTaskWork(task.id)} className="bg-primary text-white">
                                                            {submittingTask === task.id ? <Loader2 className="animate-spin h-4 w-4" /> : (task.status === 'REJECTED' ? "Re-Submit Work" : "Submit Work")}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button size="sm" onClick={() => { setExpandedTask(task.id); setSubmissionText(task.submissionContent || ""); }} className="bg-primary text-white">
                                                    {task.status === 'REJECTED' ? "Update & Re-Submit" : "Submit Work"}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Add Log Button */}
                    {!showLogForm && (
                        <div className="flex justify-end">
                            <Button onClick={() => setShowLogForm(true)} className="bg-primary text-white">
                                <Plus className="h-4 w-4 mr-2" /> New Daily Entry
                            </Button>
                        </div>
                    )}

                    {/* New Log Form */}
                    {showLogForm && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-base">New Daily Entry</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateLog} className="space-y-4">
                                    <textarea
                                        className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                        value={newLogContent}
                                        onChange={(e) => setNewLogContent(e.target.value)}
                                        required
                                        placeholder="What did you learn today?"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={() => setShowLogForm(false)}>Cancel</Button>
                                        <Button type="submit" disabled={submittingLog} className="bg-primary text-white">
                                            {submittingLog ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Entry"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Log List */}
                    {loadingLogs ? (
                        <div className="text-center py-12 text-muted-foreground">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No daily logs yet.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="bg-white p-4 rounded-xl border border-neutral/10 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm font-bold text-primary">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                    <div className="text-xs text-neutral-400">{new Date(log.date).toLocaleTimeString()}</div>
                                </div>
                                <p className="text-neutral-700 whitespace-pre-wrap">{log.content}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
