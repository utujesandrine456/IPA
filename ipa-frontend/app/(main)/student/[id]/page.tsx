"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, ChevronUp, CheckCircle2, Circle, Upload, X, Users, Mail, Phone, MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api";


interface Task {
    id: number;
    title: string;
    description: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    date: string;
    category?: string;
    estimatedHours?: number;
}


export default function StudentDashboard() {
    const params = useParams();
    const router = useRouter();
    const studentId = Number(params.id);

    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
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

        setIsAuthChecking(false);
        fetchStudent();
    }, [studentId, router]);

    const fetchStudent = async () => {
        try {
            const data = await apiFetch(`/students?id=${studentId}`);
            // Backend findAll returns { student: {...} } when id is provided
            const s = data.student;
            if (s) {
                // IMPORTANT: Only after we confirm the student exists, 
                // we check if the current user is logged in and has permission.
                const storedUser = localStorage.getItem("user");
                const token = localStorage.getItem("token");

                if (!storedUser || !token) {
                    router.replace("/login");
                    return;
                }

                try {
                    const user = JSON.parse(storedUser);
                    if (user.role === "STUDENT" && user.studentProfile?.id !== studentId) {
                        router.replace(`/student/${user.studentProfile?.id}`);
                        return;
                    }
                } catch (e) {
                    console.error("Error parsing user data", e);
                    router.replace("/login");
                    return;
                }

                // If we reach here, user is logged in and permitted
                fetchTasks();

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
                router.replace('/not-found');
            }
        } catch (error: any) {
            if (error.message !== 'Not Found' && error.message !== 'Student not found') {
                console.error("Error fetching student:", error);
            }
            router.replace('/not-found');
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
            const data = await apiFetch(`/tasks?studentId=${studentId}`);
            setTasks(data.tasks || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };


    if (isAuthChecking) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-primary font-bold text-sm">Verifying access...</p>
                </div>
            </div>
        );
    }

    const tasksByStatus = {
        todo: tasks.filter(t => t.status === "PENDING"),
        inProgress: tasks.filter(t => t.status === "IN_PROGRESS"),
        done: tasks.filter(t => t.status === "COMPLETED"),
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-neutral/10 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">
                            Hi {studentName || "there"}!
                        </h1>
                        <p className="text-primary">Ready to log your progress for today?</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={() => setShowProfileModal(true)} className="text-white bg-primary p-3 hover:bg-primary/80 transition-all duration-300 transform hover:scale-105 border-0 font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-primary/20">Update Profile</Button>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-2 py-2 rounded-full border border-primary/20 bg-white text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    {/* Tasks Columns */}
                    <div className="flex gap-6 h-full min-w-[900px]">
                        <div className="flex-1 flex flex-col gap-4 bg-neutral/5 p-4 rounded-xl border border-neutral/10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <Circle className="h-4 w-4 text-primary" />
                                    To Do
                                </h3>
                                <span className="bg-white px-2 py-1 rounded text-xs font-bold text-primary shadow-sm border border-primary/20">{tasksByStatus.todo.length}</span>
                            </div>

                            {loading ? (
                                <div className="text-center text-primary py-8">Loading...</div>
                            ) : tasksByStatus.todo.length === 0 ? (
                                <div className="text-center text-primary py-8 text-sm">No pending tasks</div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px]">
                                    {tasksByStatus.todo.map((task: any) => (
                                        <Card key={task.id} className="cursor-pointer hover:border-primary/50 transition-colors group">
                                            <CardContent className="p-4">
                                                <h4 className="font-semibold text-primary mb-1">{task.title}</h4>
                                                <p className="text-xs text-primary mb-3">{task.description}</p>
                                                <div className="flex items-center justify-between text-xs text-primary mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{new Date(task.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="w-full text-xs"
                                                    onClick={() => {
                                                        setTaskSubmission({ taskId: task.id, description: "", attachments: "" });
                                                        setShowTaskForm(true);
                                                    }}
                                                >
                                                    <Upload className="h-3 w-3 mr-1" />
                                                    Submit Work
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col gap-4 bg-neutral/5 p-4 rounded-xl border border-neutral/10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    In Progress
                                </h3>
                                <span className="bg-white px-2 py-1 rounded text-xs font-bold text-primary shadow-sm border border-primary/20">{tasksByStatus.inProgress.length}</span>
                            </div>

                            {loading ? (
                                <div className="text-center text-primary py-8">Loading...</div>
                            ) : tasksByStatus.inProgress.length === 0 ? (
                                <div className="text-center text-primary py-8 text-sm">No tasks in progress</div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px]">
                                    {tasksByStatus.inProgress.map((task: any) => (
                                        <Card key={task.id} className="cursor-pointer border-l-4 border-l-primary shadow-md">
                                            <CardContent className="p-4">
                                                <h4 className="font-semibold text-primary mb-1">{task.title}</h4>
                                                <p className="text-xs text-primary mb-3">{task.description}</p>
                                                <div className="flex items-center justify-between text-xs text-primary mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{new Date(task.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full text-xs"
                                                    onClick={() => {
                                                        setTaskSubmission({ taskId: task.id, description: "", attachments: "" });
                                                        setShowTaskForm(true);
                                                    }}
                                                >
                                                    <Upload className="h-3 w-3 mr-1" />
                                                    Update Submission
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col gap-4 bg-neutral/5 p-4 rounded-xl border border-neutral/10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Done
                                </h3>
                                <span className="bg-white px-2 py-1 rounded text-xs font-bold text-primary shadow-sm border border-primary/20">{tasksByStatus.done.length}</span>
                            </div>

                            {loading ? (
                                <div className="text-center text-primary py-8">Loading...</div>
                            ) : tasksByStatus.done.length === 0 ? (
                                <div className="text-center text-primary py-8 text-sm">No completed tasks</div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px]">
                                    {tasksByStatus.done.map((task: any) => (
                                        <Card key={task.id} className="cursor-pointer opacity-75 hover:opacity-100 transition-opacity border-l-4 border-l-primary">
                                            <CardContent className="p-4">
                                                <h4 className="font-semibold text-primary mb-1">{task.title}</h4>
                                                <p className="text-xs text-primary mb-3">{task.description}</p>
                                                <div className="flex items-center justify-between text-xs text-primary">
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                                        <span>Completed</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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
                                                    status: "IN_PROGRESS",
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

