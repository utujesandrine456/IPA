"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Upload, X, Users, ArrowRight, Settings, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";


interface Task {
    id: number;
    title: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SUBMITTED" | "REJECTED";
    date: string;
    category?: string;
    estimatedHours?: number;
}

export default function StudentDashboard() {
    const params = useParams();
    const router = useRouter();
    const studentId = Number(params.id);

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(true);
    const [studentName, setStudentName] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskSubmission, setTaskSubmission] = useState({ taskId: 0, description: "", attachments: "" });
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({
        phone: "",
        address: "",
        companyName: "",
        companyAddress: "",
        supervisorName: "",
        supervisorEmail: "",
        internshipStart: "",
        internshipEnd: "",
    });
    const [supervisorInfo, setSupervisorInfo] = useState<{ name: string; email: string; phone: string } | null>(null);

    useEffect(() => {
        if (Number.isNaN(studentId)) {
            router.replace('/not-found');
            return;
        }

        const storedUser = localStorage.getItem("user");
        if (!storedUser) return; // MainLayout handles login redirect

        try {
            const user = JSON.parse(storedUser);
            const userRole = user.role?.toUpperCase();

            // Only proceed if authorized for this page, but don't redirect (MainLayout does that)
            if (userRole === "ADMIN" || (userRole === "STUDENT" && user.studentProfile?.id === studentId)) {
                setIsAuthorized(true);
                fetchStudent();
            }
        } catch (e) {
            console.error("StudentDashboard: Auth parse failed", e);
        }
    }, [studentId, router]);

    const fetchStudent = async () => {
        try {
            const result = await apiFetch(`/students?id=${studentId}`);
            if (!result.ok) {
                if (result.status === 404) {
                    toast.error("Student not found");
                    router.replace("/login");
                    return;
                }
                toast.error(result.error || "Failed to load profile");
                return;
            }

            const s = result.data.student;
            if (s) {
                fetchTasks();
                fetchWeeklyLogs();

                if (s.user?.name) {
                    setStudentName(s.user.name);
                }
                setProfileData({
                    phone: s.phone || "",
                    address: s.address || "",
                    companyName: s.companyName || "",
                    companyAddress: s.companyAddress || "",
                    supervisorName: s.supervisorName || "",
                    supervisorEmail: s.supervisorEmail || "",
                    internshipStart: s.internshipStart ? s.internshipStart.split('T')[0] : "",
                    internshipEnd: s.internshipEnd ? s.internshipEnd.split('T')[0] : "",
                });
                if (s.supervisor) {
                    setSupervisorInfo({
                        name: s.supervisor.user.name,
                        email: s.supervisor.user.email,
                        phone: s.supervisor.phone || "N/A",
                    });
                }
            } else {
                toast.error("Profile not found");
            }
        } catch (error: any) {
            if (error.message !== 'Not Found' && error.message !== 'Student not found') {
                console.error("Error fetching student:", error);
            }
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await apiFetch(`/students/${studentId}`, {
                method: "PATCH",
                body: JSON.stringify(profileData),
            });
            setShowProfileModal(false);
            fetchStudent();
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const fetchTasks = async () => {
        try {
            const result = await apiFetch(`/tasks?studentId=${studentId}`);
            if (result.ok) {
                setTasks(result.data.tasks || []);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    const fetchWeeklyLogs = async () => {
        try {
            const result = await apiFetch(`/weekly-logs?studentId=${studentId}`);
            if (result.ok) {
                setWeeklyLogs(result.data.logs || []);
            }
        } catch (error) {
            console.error("Error fetching weekly logs:", error);
        }
    };


    if (isAuthorized === null) {
        return <div className="min-h-screen bg-background" />;
    }

    if (isFetching) {
        return (
            <div className="space-y-8 animate-pulse">
                {/* Header skeleton */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="space-y-3">
                            <div className="h-8 w-56 bg-slate-200 rounded-xl" />
                            <div className="h-4 w-80 bg-slate-100 rounded-lg" />
                        </div>
                        <div className="hidden md:flex gap-3">
                            <div className="h-12 w-32 bg-slate-100 rounded-xl" />
                            <div className="h-12 w-40 bg-slate-100 rounded-xl" />
                        </div>
                    </div>
                </div>
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-slate-200 rounded-full" />
                                <div className="h-6 w-12 bg-slate-200 rounded-lg" />
                            </div>
                            <div className="h-14 w-14 bg-slate-100 rounded-2xl" />
                        </div>
                    ))}
                </div>
                {/* Task board skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, col) => (
                        <div key={col} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <div className="h-5 w-28 bg-slate-200 rounded-full" />
                            {Array.from({ length: 3 }).map((_, row) => (
                                <div key={row} className="h-20 w-full bg-slate-100 rounded-2xl" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const tasksByStatus = {
        todo: tasks.filter(t => t.status === "PENDING"),
        inProgress: tasks.filter(t => t.status === "IN_PROGRESS"),
        done: tasks.filter(t => t.status === "COMPLETED"),
    };

    const totalHoursWorked = weeklyLogs.reduce((acc, log) => acc + (log.totalHours || 0), 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                            Hello, {studentName?.split(" ")[0] || "Student"}!
                        </h1>
                        <p className="text-slate-500 font-normal">Here's what's happening with your internship today.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-12 px-6 rounded-xl font-medeium border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => setShowProfileModal(true)}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Active Tasks", value: tasks.filter(t => t.status !== "COMPLETED").length, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Completed", value: tasks.filter(t => t.status === "COMPLETED").length, icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Hours worked", value: `${totalHoursWorked}h`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Supervisor", value: supervisorInfo?.name || "Assigned", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-3xl bg-white transition-all hover:translate-y-[-2px]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-md font-medium text-slate-400">{stat.label}</p>
                                    <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
                                </div>
                                <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm rounded-[32px] bg-white overflow-hidden">
                    <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Recent Assignments</CardTitle>
                            <CardDescription className="text-slate-500">Latest tasks needing your attention</CardDescription>
                        </div>
                        <Button variant="ghost" className="text-primary font-bold" onClick={() => router.push('/student/tasks')}>View All Tasks <ArrowRight className="h-4 w-4 ml-1" /></Button>
                    </CardHeader>
                    <CardContent className="p-8 pt-6">
                        <div className="space-y-4">
                            {tasks.filter(t => t.status !== 'COMPLETED').slice(0, 3).length === 0 ? (
                                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[24px]">No pending tasks</div>
                            ) : (
                                tasks.filter(t => t.status !== 'COMPLETED').slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition-colors group cursor-pointer" onClick={() => router.push('/student/tasks')}>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{task.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "text-[10px] font-bold px-3 py-1 rounded-lg border",
                                                task.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                task.status === 'REJECTED' ? "bg-red-50 text-red-600 border-red-100" :
                                                task.status === 'SUBMITTED' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-slate-50 text-slate-500 border-slate-100"
                                            )}>
                                                {task.status}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden flex flex-col">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-bold text-slate-900">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 flex-1 flex flex-col gap-3">
                        <Button
                            className="w-full h-16 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all justify-start px-6 gap-4"
                            onClick={() => router.push('/student/logbook')}
                        >
                            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <FileText className="h-4 w-4" />
                            </div>
                            Update Logbook
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-white text-slate-700 font-bold text-sm hover:border-primary/20 hover:bg-slate-50 transition-all justify-start px-6 gap-4"
                            onClick={() => router.push('/student/tasks')}
                        >
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-primary">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            Assignment Board
                        </Button>

                        <div className="mt-auto pt-6 border-t border-slate-100">
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                                    {supervisorInfo?.name[0]}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[12px] font-medium text-primary leading-none mb-1">Assigned Supervisor</p>
                                    <p className="text-sm font-bold text-primary truncate">{supervisorInfo?.name || "Field Agent"}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AnimatePresence>
                {showProfileModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-primary">Update Profile</h3>
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="text-primary hover:text-primary/80 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-primary mb-1 block">Phone Number</label>
                                        <Input
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            placeholder="+123..."
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-primary mb-1 block">Current Address</label>
                                        <Input
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            placeholder="City, Country"
                                        />
                                    </div>
                                    <div className="col-span-2 pt-4 border-t border-primary/10">
                                        <h4 className="font-semibold text-primary mb-3">Internship Details</h4>
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-sm font-medium text-primary mb-1 block">Start Date</label>
                                        <Input
                                            type="date"
                                            value={profileData.internshipStart || ""}
                                            onChange={(e) => setProfileData({ ...profileData, internshipStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-sm font-medium text-primary mb-1 block">End Date</label>
                                        <Input
                                            type="date"
                                            value={profileData.internshipEnd || ""}
                                            onChange={(e) => setProfileData({ ...profileData, internshipEnd: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-primary mb-1 block">Company Name</label>
                                        <Input
                                            value={profileData.companyName}
                                            onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                                            placeholder="Tech Corp Inc."
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-primary mb-1 block">Company Address</label>
                                        <Input
                                            value={profileData.companyAddress}
                                            onChange={(e) => setProfileData({ ...profileData, companyAddress: e.target.value })}
                                            placeholder="123 Tech Street"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-primary mb-1 block">Field Supervisor</label>
                                        <Input
                                            value={profileData.supervisorName}
                                            onChange={(e) => setProfileData({ ...profileData, supervisorName: e.target.value })}
                                            placeholder="John Smith"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-primary mb-1 block">Supervisor Email</label>
                                        <Input
                                            value={profileData.supervisorEmail}
                                            onChange={(e) => setProfileData({ ...profileData, supervisorEmail: e.target.value })}
                                            placeholder="john@company.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setShowProfileModal(false)}>Cancel</Button>
                                <Button
                                    onClick={handleUpdateProfile}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showTaskForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-primary">Submit Task Work</h3>
                                <button
                                    onClick={() => setShowTaskForm(false)}
                                    className="text-primary hover:text-primary/80 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-primary mb-2 block">
                                        What did you accomplish?
                                    </label>
                                    <textarea
                                        className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[150px]"
                                        placeholder="Describe what you did, any challenges you faced, and what you learned..."
                                        value={taskSubmission.description}
                                        onChange={(e) => setTaskSubmission({ ...taskSubmission, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-primary mb-2 block">
                                        Attachments / Links (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Paste links to files, GitHub repos, or documents..."
                                        value={taskSubmission.attachments}
                                        onChange={(e) => setTaskSubmission({ ...taskSubmission, attachments: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-primary mb-2 block">
                                        Upload Files (Optional)
                                    </label>
                                    <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
                                        <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                                        <p className="text-sm text-primary">Click to upload or drag and drop</p>
                                        <p className="text-xs text-primary/60 mt-1">PDF, DOCX, Images (Max 10MB)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setShowTaskForm(false)}>Cancel</Button>
                                <Button
                                    onClick={async () => {
                                        try {
                                            await apiFetch("/tasks", {
                                                method: "PATCH",
                                                body: JSON.stringify({
                                                    taskId: taskSubmission.taskId,
                                                    status: "SUBMITTED",
                                                    description: taskSubmission.description,
                                                    attachments: taskSubmission.attachments
                                                }),
                                            });
                                            setShowTaskForm(false);
                                            setTaskSubmission({ taskId: 0, description: "", attachments: "" });
                                            fetchTasks();
                                        } catch (error) {
                                            console.error("Error submitting task:", error);
                                        }
                                    }}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                >
                                    Submit Work
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}


function SendIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

