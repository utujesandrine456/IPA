"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Upload, Users, FileText, PieChart, TrendingUp, Download, Plus, Edit, Trash2, Mail, CheckCircle2, XCircle, Loader2, Activity, Clock, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

interface Student {
    id: string;
    studentId: string;
    profileCompleted: boolean;
    user: {
        name: string;
        email: string;
    };
    supervisor?: {
        id: number;
        user: {
            name: string;
        }
    };
}

interface ActivityItem {
    type: 'TASK_SUBMISSION' | 'RATING';
    id: number;
    title: string;
    description: string;
    user: string;
    target?: string;
    date: string;
    status?: string;
}

interface Supervisor {
    id: number;
    user: {
        name: string;
        email: string;
    };
}

export default function AdminDashboard() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [sendingInvites, setSendingInvites] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [uploadResult, setUploadResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [creatingUser, setCreatingUser] = useState(false);
    const [createMessage, setCreateMessage] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [assigningSupervisor, setAssigningSupervisor] = useState<string | null>(null);

    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        role: "SUPERVISOR" as "SUPERVISOR",
        phone: "",
        department: "",
        password: "",
    });

    useEffect(() => {
        fetchStudents();
        fetchActivities();
        fetchSupervisors();
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await fetch("/api/admin/activity");
            const data = await res.json();
            setActivities(data.activities || []);
        } catch (error) {
            console.error("Error fetching activities:", error);
        }
    };

    const fetchSupervisors = async () => {
        try {
            const res = await fetch("/api/supervisors");
            const data = await res.json();
            setSupervisors(data.supervisors || []);
        } catch (error) {
            console.error("Error fetching supervisors:", error);
        }
    };

    const handleAssignSupervisor = async (studentId: string, supervisorId: string) => {
        setAssigningSupervisor(studentId);
        try {
            await fetch("/api/students/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, supervisorId }),
            });
            fetchStudents();
        } catch (error) {
            console.error("Error assigning supervisor:", error);
        } finally {
            setAssigningSupervisor(null);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await fetch("/api/students");
            const data = await response.json();
            const normalizedStudents =
                (data.students || []).map((student: any) => ({
                    ...student,
                    studentId: student.studentId ?? student.studentNumber ?? "",
                }));
            setStudents(normalizedStudents);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);
        setCreateMessage(null);
        setCreateError(null);

        try {
            const res = await fetch("/api/superteacher/add-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                setCreateError(data.error || "Failed to create user");
                return;
            }

            setCreateMessage("User created successfully");
            setNewUser({
                name: "",
                email: "",
                role: newUser.role,
                phone: "",
                department: "",
                password: "",
            });
        } catch (err: any) {
            console.error("Error creating user:", err);
            setCreateError(err.message || "Failed to create user");
        } finally {
            setCreatingUser(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/students/upload", {
                method: "POST",
                body: formData,
            });

            let data;
            try {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error("Failed to parse JSON response:", text);
                    throw new Error("Server returned invalid response");
                }
            } catch (error) {
                console.error("Error reading response:", error);
                throw error;
            }

            setUploadResult({
                success: data.success || 0,
                errors: data.errors || [],
            });


            if (data.success > 0) {
                fetchStudents();
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploadResult({ error: "Failed to upload file" });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSendInvites = async (studentIds?: string[]) => {
        const idsToSend = studentIds || Array.from(selectedStudents);
        if (idsToSend.length === 0) return;

        setSendingInvites(true);

        try {
            const response = await fetch("/api/students/send-invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentIds: idsToSend }),
            });

            const data = await response.json();

            if (data.success > 0) {
                alert(`Successfully sent ${data.success} invitation(s)!`);
                setSelectedStudents(new Set());
                fetchStudents();
            } else {
                alert(`Failed to send invitations: ${data.results?.errors?.[0]?.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error sending invites:", error);
            alert("Failed to send invitations");
        } finally {
            setSendingInvites(false);
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        const newSelection = new Set(selectedStudents);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudents(newSelection);
    };

    const toggleSelectAll = () => {
        const incompleteStudents = students.filter(s => !s.profileCompleted);
        if (selectedStudents.size === incompleteStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(incompleteStudents.map(s => s.id)));
        }
    };
    const totalStudents = students.length;
    const completedProfiles = students.filter((s) => s.profileCompleted).length;
    const pendingProfiles = totalStudents - completedProfiles;
    const completionRate =
        totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0;

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm border border-neutral/10"
            >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-success/5 blur-3xl"></div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary mb-2">Welcome back, Admin</h1>
                        <p className="text-primary text-lg">"Build skills & networks for the future leaders."</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-primary">Current Academic Year</p>
                            <p className="text-xl font-bold text-primary">2025 - 2026</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: "Total Students",
                        value: `${completedProfiles}/${totalStudents}`,
                        sub: `${completionRate}% profiles completed`,
                        icon: Users,
                        color: "text-primary",
                    },
                    {
                        label: "Pending Profiles",
                        value: String(pendingProfiles),
                        sub: "Students yet to complete profile",
                        icon: FileText,
                        color: "text-warning",
                    },
                    {
                        label: "Invites Pending",
                        value: String(
                            students.filter((s) => !s.profileCompleted).length
                        ),
                        sub: "Send reminders to students",
                        icon: Mail,
                        color: "text-primary",
                    },
                    {
                        label: "Total Supervisors",
                        value: String(supervisors.length),
                        sub: "Managed from Add User section below",
                        icon: TrendingUp,
                        color: "text-primary",
                    },
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-primary mb-1">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-primary">{stat.value}</h3>
                                    <p className="text-xs text-primary mt-1">{stat.sub}</p>
                                </div>
                                <div className={`p-3 rounded-full bg-neutral/5 ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                            <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-primary mb-2">Upload Student List</h3>
                        <p className="text-primary mb-6 max-w-md">
                            Upload an Excel file (.xlsx, .csv) with student information.
                            Required columns: Email, Name, Student ID
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Select File
                                </>
                            )}
                        </Button>

                        {uploadResult && (
                            <div className={`mt-4 p-4 rounded-lg w-full max-w-md ${uploadResult.error
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-primary/5 border border-primary/10"
                                }`}>
                                {uploadResult.error ? (
                                    <p className="text-primary text-sm">{uploadResult.error}</p>
                                ) : (
                                    <div className="text-primary text-sm">
                                        <p className="font-semibold mb-2">Upload Complete!</p>
                                        <p>✓ {uploadResult.success} students added</p>
                                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                                            <div className="mt-2 text-red-600 text-sm">
                                                <p>⚠ {uploadResult.errors.length} error(s) found:</p>
                                                <ul className="list-disc ml-5">
                                                    {uploadResult.errors.map((err: any, index: number) => (
                                                        <li key={index}>
                                                            Row {err.row?.id || "unknown"}: {err.error}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-primary">Add Supervisor</CardTitle>
                            <CardDescription className="text-primary">
                                Create new supervisor or teacher accounts that can manage students and tasks.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                value={newUser.name}
                                onChange={(e) =>
                                    setNewUser((u) => ({ ...u, name: e.target.value }))
                                }
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) =>
                                    setNewUser((u) => ({ ...u, email: e.target.value }))
                                }
                                required
                            />
                            <div>
                                <label className="text-sm font-medium text-primary mb-2 block">
                                    Role
                                </label>
                                <select
                                    onChange={(e) =>
                                        setNewUser((u) => ({
                                            ...u,
                                            role: e.target.value as "SUPERVISOR",
                                        }))
                                    }
                                >
                                    <option value="SUPERVISOR">Supervisor</option>
                                </select>
                            </div>
                            <Input
                                label="Phone"
                                value={newUser.phone}
                                onChange={(e) =>
                                    setNewUser((u) => ({ ...u, phone: e.target.value }))
                                }
                            />
                            <Input
                                label="Department"
                                value={newUser.department}
                                onChange={(e) =>
                                    setNewUser((u) => ({ ...u, department: e.target.value }))
                                }
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) =>
                                    setNewUser((u) => ({ ...u, password: e.target.value }))
                                }
                                placeholder="Optional – they can reset later"
                            />

                            <div className="md:col-span-2 flex items-center justify-between mt-2">
                                <div className="space-y-1">
                                    {createMessage && (
                                        <p className="text-sm text-primary">{createMessage}</p>
                                    )}
                                    {createError && (
                                        <p className="text-sm text-red-600">{createError}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={creatingUser}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                >
                                    {creatingUser ? "Creating..." : "Create User"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Manage Students Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-primary">Manage Students</CardTitle>
                            <CardDescription className="text-primary">
                                Upload students and send invitation emails
                            </CardDescription>
                        </div>
                        <div className="flex gap-3">
                            {selectedStudents.size > 0 && (
                                <Button
                                    onClick={() => handleSendInvites()}
                                    disabled={sendingInvites}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                >
                                    {sendingInvites ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Send Invites ({selectedStudents.size})
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-primary">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p>Loading students...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-12 text-primary">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No students found. Upload an Excel file to add students.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-primary uppercase bg-primary/5">
                                        <tr>
                                            <th className="px-6 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.size === students.filter(s => !s.profileCompleted).length && students.filter(s => !s.profileCompleted).length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-primary/20"
                                                />
                                            </th>
                                            <th className="px-6 py-3">Name</th>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Student ID</th>
                                            <th className="px-6 py-3">Supervisor</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr
                                                key={student.id}
                                                className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    {!student.profileCompleted && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudents.has(student.id)}
                                                            onChange={() => toggleStudentSelection(student.id)}
                                                            className="rounded border-primary/20"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-primary">{student.user.name}</td>
                                                <td className="px-6 py-4 text-primary">{student.user.email}</td>
                                                <td className="px-6 py-4 text-primary">{student.studentId}</td>
                                                <td className="px-6 py-4">
                                                    <select className="bg-white border border-primary/20 text-primary text-xs rounded p-1 max-w-[150px]" value={student.supervisor?.id ?? ""} onChange={(e) => handleAssignSupervisor(student.id, e.target.value)}>
                                                        <option value="" disabled>
                                                            Select Supervisor
                                                        </option>
                                                        {supervisors.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.user.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {assigningSupervisor === student.id && <Loader2 className="h-3 w-3 inline ml-2 animate-spin text-primary" />}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {student.profileCompleted ? (
                                                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/20">
                                                            <XCircle className="h-3 w-3" />
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {!student.profileCompleted && (
                                                        <Button size="sm" onClick={() => handleSendInvites([student.id])} disabled={sendingInvites} className="bg-primary hover:bg-primary/90 text-white">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            Send Invite
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Real-time updates on student tasks and supervisor ratings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {activities.length === 0 ? (
                                <div className="text-center py-8 text-primary/60">No recent activity</div>
                            ) : (
                                activities.map((activity) => (
                                    <div key={`${activity.type}-${activity.id}`} className="flex gap-4 items-start border-b border-neutral/10 pb-4 last:border-0 last:pb-0">
                                        <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'TASK_SUBMISSION' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {activity.type === 'TASK_SUBMISSION' ? <FileText className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-primary text-sm">
                                                    {activity.type === 'TASK_SUBMISSION' ? (
                                                        <>
                                                            <span className="font-bold">{activity.user}</span> submitted a log: "{activity.title}"
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-bold">{activity.user}</span> rated <span className="font-bold">{activity.target}</span>
                                                        </>
                                                    )}
                                                </p>
                                                <span className="text-xs text-primary/60 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(activity.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-primary/80 mt-1 bg-neutral/5 p-2 rounded-lg">
                                                {activity.description || "No description"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}
