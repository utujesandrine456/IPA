"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {Clock, ChevronDown, ChevronUp, CheckCircle2, Circle, Upload, X, Users, Mail, Phone } from "lucide-react";


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
    const studentId = Number(params.id);

    const [showLogForm, setShowLogForm] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState<string | null>(null);
    const [logEntries, setLogEntries] = useState<Record<string, { description: string; hours: string }>>({
        Monday: { description: "", hours: "" },
        Tuesday: { description: "", hours: "" },
        Wednesday: { description: "", hours: "" },
        Thursday: { description: "", hours: "" },
        Friday: { description: "", hours: "" },
        Saturday: { description: "", hours: "" },
        Sunday: { description: "", hours: "" },
    });
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskSubmission, setTaskSubmission] = useState({ taskId: 0, description: "", attachments: "" });
    const [generalStatement, setGeneralStatement] = useState("");
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({
        phone: "",
        address: "",
        companyName: "",
        companyAddress: "",
        supervisorName: "",
        supervisorEmail: "",
    });
    const [supervisorInfo, setSupervisorInfo] = useState<{ name: string; email: string; phone: string } | null>(null);

    useEffect(() => {
        if (!Number.isNaN(studentId)) {
            fetchStudent();
            fetchTasks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    const fetchStudent = async () => {
        try {
            const response = await fetch(`/api/students?id=${studentId}`);
            const data = await response.json();
            if (data.student) {
                if (data.student.user?.name) {
                    setStudentName(data.student.user.name);
                }
                setProfileData({
                    phone: data.student.phone || "",
                    address: data.student.address || "",
                    companyName: data.student.companyName || "",
                    companyAddress: data.student.companyAddress || "",
                    supervisorName: data.student.supervisorName || "",
                    supervisorEmail: data.student.supervisorEmail || "",
                });
                if (data.student.supervisor) {
                    setSupervisorInfo({
                        name: data.student.supervisor.user.name,
                        email: data.student.supervisor.user.email,
                        phone: data.student.supervisor.phone || "N/A",
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching student:", error);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await fetch("/api/students/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, ...profileData }),
            });
            setShowProfileModal(false);
            fetchStudent();
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch(`/api/tasks?studentId=${studentId}`);
            const data = await response.json();
            setTasks(data.tasks || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitLog = async () => {
        try {
            const tasksToSubmit = Object.entries(logEntries)
                .filter(([_, entry]) => entry.description.trim())
                .map(([day, entry]) => ({
                    studentId,
                    title: `${day} Log Entry`,
                    description: `${entry.description}\nHours: ${entry.hours || 0}`,
                    date: new Date().toISOString(),
                }));

            if (generalStatement.trim()) {
                tasksToSubmit.push({
                    studentId,
                    title: "Weekly Summary",
                    description: generalStatement,
                    date: new Date().toISOString(),
                });
            }

            for (const task of tasksToSubmit) {
                await fetch("/api/tasks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(task),
                });
            }

            setLogEntries({
                Monday: { description: "", hours: "" },
                Tuesday: { description: "", hours: "" },
                Wednesday: { description: "", hours: "" },
                Thursday: { description: "", hours: "" },
                Friday: { description: "", hours: "" },
                Saturday: { description: "", hours: "" },
                Sunday: { description: "", hours: "" },
            });
            setGeneralStatement("");
            setShowLogForm(false);
            fetchTasks();
        } catch (error) {
            console.error("Error submitting log:", error);
        }
    };

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
                        <Button variant="outline" size="sm" onClick={() => setShowProfileModal(true)} className="text-white bg-primary p-3">Update Profile</Button>
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
                    <div className="flex gap-6 h-full min-w-[1000px]">
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
                                tasksByStatus.todo.map((task) => (
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
                                ))
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
                                tasksByStatus.inProgress.map((task) => (
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
                                ))
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
                                tasksByStatus.done.map((task) => (
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
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-primary/20 shadow-sm shrink-0">
                    <button onClick={() => setShowLogForm(!showLogForm)} className="w-full flex items-center justify-between p-4 hover:bg-neutral/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <FileTextIcon className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-primary">Daily Log Entry</h3>
                                <p className="text-xs text-primary">Submit your daily activities for supervisor review.</p>
                            </div>
                        </div>
                        {showLogForm ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronUp className="h-5 w-5 text-primary" />}
                    </button>

                    <AnimatePresence>
                        {showLogForm && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-primary/10"
                            >
                                <div className="p-6 space-y-4 overflow-y-scroll hide-scrollbar">
                                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-primary mb-2 bg-white pb-2 z-10">
                                        <div className="col-span-2">Day</div>
                                        <div className="col-span-8">Description of Activities</div>
                                        <div className="col-span-2">Hours</div>
                                    </div>

                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                                        <div key={day} className="grid grid-cols-12 gap-4 items-start pb-2">
                                            <div className="col-span-2 pt-2 text-sm font-medium text-primary">{day}</div>
                                            <div className="col-span-8">
                                                <textarea
                                                    className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[60px] text-primary"
                                                    placeholder={`What did you do on ${day}?`}
                                                    value={logEntries[day].description}
                                                    onChange={(e) => setLogEntries({
                                                        ...logEntries,
                                                        [day]: { ...logEntries[day], description: e.target.value }
                                                    })}
                                                ></textarea>
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    max="8"
                                                    value={logEntries[day].hours}
                                                    onChange={(e) => setLogEntries({
                                                        ...logEntries,
                                                        [day]: { ...logEntries[day], hours: e.target.value }
                                                    })}
                                                    className="text-primary"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="pt-4 border-t border-primary/20 mt-4">
                                        <label className="text-sm font-medium text-primary mb-2 block">General Statement / Challenges</label>
                                        <textarea
                                            className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] text-primary"
                                            placeholder="Summarize your week and mention any challenges faced..."
                                            value={generalStatement}
                                            onChange={(e) => setGeneralStatement(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setLogEntries({
                                                    Monday: { description: "", hours: "" },
                                                    Tuesday: { description: "", hours: "" },
                                                    Wednesday: { description: "", hours: "" },
                                                    Thursday: { description: "", hours: "" },
                                                    Friday: { description: "", hours: "" },
                                                    Saturday: { description: "", hours: "" },
                                                    Sunday: { description: "", hours: "" },
                                                });
                                                setGeneralStatement("");
                                            }}
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            className="bg-primary hover:bg-primary/90 text-white"
                                            onClick={handleSubmitLog}
                                        >
                                            Submit Weekly Log
                                            <CheckCircle2 className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="w-80 flex flex-col bg-white rounded-xl border border-neutral/10 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral/10">
                    <h3 className="font-semibold text-neutral-dark flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        My Supervisor
                    </h3>
                </div>

                <div className="flex-1 p-6 space-y-6">
                    {supervisorInfo ? (
                        <>
                            <div className="text-center">
                                <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center text-2xl font-bold text-primary mb-3">
                                    {supervisorInfo.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <h4 className="font-bold text-lg text-primary">{supervisorInfo.name}</h4>
                                <p className="text-sm text-primary/60">Academic Supervisor</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-primary">
                                    <Mail className="h-4 w-4 opacity-50" />
                                    <span>{supervisorInfo.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-primary">
                                    <Phone className="h-4 w-4 opacity-50" />
                                    <span>{supervisorInfo.phone}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-neutral/10">
                                <p className="text-xs text-primary/60 text-center mb-4">
                                    Contact your supervisor for task clarifications or urgent issues.
                                </p>
                                <Button className="w-full bg-primary text-white hover:bg-primary/90">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-primary/60">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No supervisor assigned yet.</p>
                        </div>
                    )}
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
                                            await fetch("/api/tasks", {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
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

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
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
