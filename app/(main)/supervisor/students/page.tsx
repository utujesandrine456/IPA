"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, User, CheckCircle, XCircle, FileText, CheckSquare, Star } from "lucide-react";

// Mock interface
interface Student {
    id: number;
    user: { name: string; email: string };
    studentId: string;
    profileCompleted: boolean;
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    date: string;
    submissionContent?: string;
    submittedAt?: string;
    rating?: number;
    comments?: { id: number; content: string; createdAt: string }[];
}

interface LogEntry {
    id: number;
    content: string;
    date: string;
}

export default function SupervisorStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState<"tasks" | "logs">("tasks");

    const [tasks, setTasks] = useState<Task[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: "", description: "" });

    // Assessment State
    const [assessingTask, setAssessingTask] = useState<number | null>(null);
    const [assessmentComment, setAssessmentComment] = useState("");
    const [assessmentRating, setAssessmentRating] = useState<number>(0);

    const supervisorId = "1"; // Mock Supervisor ID

    useEffect(() => {
        // In a real app, this would filter by the logged-in supervisor's ID
        fetch("/api/students")
            .then(res => res.json())
            .then(data => {
                setStudents(data.students || []); // normalize if needed (admin page did normalization)
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleViewStudent = async (student: Student) => {
        setSelectedStudent(student);
        setActiveTab("tasks"); // default
        fetchTasks(student.id);
        fetchLogs(student.id);
    };

    const fetchTasks = async (studentId: number) => {
        try {
            const res = await fetch(`/api/logbook?studentId=${studentId}`);
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (err) { console.error(err); }
    };

    const fetchLogs = async (studentId: number) => {
        try {
            const res = await fetch(`/api/daily-log?studentId=${studentId}`);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (err) { console.error(err); }
    };

    const handleAssignTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        setAssigning(true);
        try {
            await fetch("/api/logbook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    title: newTask.title,
                    description: newTask.description
                })
            });
            setShowTaskForm(false);
            setNewTask({ title: "", description: "" });
            fetchTasks(selectedStudent.id);
        } catch (error) {
            console.error("Error assigning task:", error);
        } finally {
            setAssigning(false);
        }
    };

    const handleAssessTask = async (taskId: number, status: string) => {
        try {
            const body: any = { taskId, status, supervisorId };
            if (assessmentComment) body.feedback = assessmentComment;
            if (status === 'APPROVED' && assessmentRating > 0) body.rating = assessmentRating;

            await fetch("/api/logbook", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            setAssessingTask(null);
            setAssessmentComment("");
            setAssessmentRating(0);
            if (selectedStudent) fetchTasks(selectedStudent.id);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    if (selectedStudent) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">Student: {selectedStudent.user.name}</h1>
                        <p className="text-primary/60">Reviewing student progress</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedStudent(null)}>Back to Students</Button>
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

                {activeTab === "tasks" ? (
                    <>
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setShowTaskForm(!showTaskForm)}>
                                {showTaskForm ? "Cancel Assignment" : "Assign New Task"}
                            </Button>
                        </div>

                        {showTaskForm && (
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader>
                                    <CardTitle>Assign New Task</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAssignTask} className="space-y-4">
                                        <input
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Task Title"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            required
                                        />
                                        <textarea
                                            className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
                                            placeholder="Task Description"
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                            required
                                        />
                                        <div className="flex justify-end">
                                            <Button type="submit" disabled={assigning} className="bg-primary text-white">
                                                Assign Task
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-4">
                            {tasks.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground">No tasks assigned/submitted yet.</p>
                            ) : (
                                tasks.map((task) => (
                                    <Card key={task.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between">
                                                <CardTitle className="text-lg">{task.title}</CardTitle>
                                                <div className="flex items-center gap-2">
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
                                            <CardDescription>{new Date(task.date).toLocaleDateString()}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm font-medium text-neutral-500 mb-2">Description</p>
                                            <p className="text-sm text-neutral-800 mb-4">{task.description}</p>

                                            {task.submissionContent && (
                                                <div className="bg-neutral/5 p-3 rounded-lg border border-neutral/10 mt-2">
                                                    <p className="text-xs font-bold text-primary mb-1">Student Submission:</p>
                                                    <p className="text-sm text-neutral-700">{task.submissionContent}</p>
                                                    <p className="text-xs text-neutral-400 mt-1">Submitted: {new Date(task.submittedAt!).toLocaleString()}</p>
                                                </div>
                                            )}

                                            {/* Action Area for PENDING/SUBMITTED */}
                                            {(task.status === 'PENDING' || task.status === 'SUBMITTED') && (
                                                <div className="mt-4 pt-4 border-t border-neutral/10">
                                                    {assessingTask === task.id ? (
                                                        <div className="space-y-3 bg-white p-3 rounded-lg border border-neutral/20">
                                                            <p className="font-semibold text-sm">Task Assessment</p>
                                                            <textarea
                                                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                placeholder="Add comment (optional)..."
                                                                value={assessmentComment}
                                                                onChange={(e) => setAssessmentComment(e.target.value)}
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-neutral-600">Rating:</span>
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button key={star} onClick={() => setAssessmentRating(star)} type="button">
                                                                        <Star className={`h-4 w-4 ${star <= assessmentRating ? "fill-yellow-500 text-yellow-500" : "text-neutral-300"}`} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant="ghost" onClick={() => setAssessingTask(null)}>Cancel</Button>
                                                                <Button size="sm" variant="danger" onClick={() => handleAssessTask(task.id, 'REJECTED')}>Reject</Button>
                                                                <Button size="sm" className="bg-green-600 text-white" onClick={() => handleAssessTask(task.id, 'APPROVED')}>Approve</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Button size="sm" onClick={() => setAssessingTask(task.id)} className="w-full bg-primary/10 text-primary hover:bg-primary/20">
                                                            Review Submission
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        {logs.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">No daily logs found.</p>
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">My Students</h1>
                <p className="text-primary/60">Manage your assigned students</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{student.user.name}</CardTitle>
                                <CardDescription>{student.studentId}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full bg-primary text-white" onClick={() => handleViewStudent(student)}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                View Logbook & Tasks
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {students.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No students assigned.
                    </div>
                )}
            </div>
        </div>
    );
}
