"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
    Search,
    Trash2,
    UserCog,
    Loader2,
    Shield,
    GraduationCap,
    Briefcase,
    Filter,
    RefreshCw,
    Mail,
    Calendar,
    MoreVertical,
    CheckCircle2,
    XCircle,
    UserCheck,
    UserX
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface User {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "SUPERVISOR" | "STUDENT" | "LIAISON";
    isActive: boolean;
    createdAt: string;
    studentProfile?: { studentNumber: string };
    supervisorProfile?: { department: string };
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const result = await apiFetch("/admin/users") as any;
            if (result.ok) {
                setUsers(result.data.users || []);
            } else {
                console.error("Error fetching users:", result.error);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            const result = await apiFetch(`/admin/users?id=${id}`, { method: "DELETE" });
            if (result.ok) {
                fetchUsers();
            } else {
                alert(result.error || "Error deleting user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const toggleActivation = async (id: number) => {
        try {
            const result = await apiFetch('/admin/toggle-activation', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            if (result.ok) {
                fetchUsers();
            } else {
                alert(result.error || "Error toggling activation");
            }
        } catch (error) {
            console.error("Error toggling activation:", error);
        }
    };

    const filteredUsers = users.filter((u) => {
        const searchLower = search.toLowerCase();
        const matchesSearch =
            u.name.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower) ||
            (u.studentProfile?.studentNumber.toLowerCase().includes(searchLower)) ||
            (u.supervisorProfile?.department.toLowerCase().includes(searchLower));
        const matchesRole = filterRole === "ALL" || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "ADMIN": return <Shield className="h-4 w-4" />;
            case "SUPERVISOR": return <Briefcase className="h-4 w-4" />;
            case "STUDENT": return <GraduationCap className="h-4 w-4" />;
            case "LIAISON": return <UserCheck className="h-4 w-4" />;
            default: return <UserCog className="h-4 w-4" />;
        }
    };

    return (
        <div className="w-full space-y-6 p-4 md:p-8 min-h-screen bg-white">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 ">User Management</h1>
                    <p className="text-slate-500 text-sm font-medium tracking-wide">System Administration & Access Governance </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-1.5 rounded-lg shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl">
                        <UserCog className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Users</p>
                            <p className="text-xl font-black text-primary leading-none">{users.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-12 lg:col-span-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-lg focus:outline-none focus:border-primary/20 transition-all text-slate-700 placeholder:text-slate-300 font-bold"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="md:col-span-6 lg:col-span-2">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                        <select
                            className="w-full pl-10 pr-10 py-4 bg-white border-2 border-slate-100 rounded-lg appearance-none text-slate-600 font-bold text-md focus:ring-0 focus:border-primary/20"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admins</option>
                            <option value="SUPERVISOR">Supervisors</option>
                            <option value="STUDENT">Students</option>
                            <option value="LIAISON">Liaison Officers</option>
                        </select>
                    </div>
                </div>
                <div className="md:col-span-6 lg:col-span-2">
                    <Button
                        onClick={() => fetchUsers()}
                        disabled={loading}
                        className="w-full h-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg shadow-primary/20 font-bold text-md gap-3 transition-all active:scale-95 group"
                    >
                        <RefreshCw className={cn("h-4 w-4 transition-transform group-hover:rotate-180 duration-500", loading && "animate-spin")} />
                        Sync
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white border-2 border-slate-50 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[14px] font-black uppercase text-slate-400">User Identity</th>
                                <th className="px-6 py-6 text-[14px] font-black uppercase text-slate-400">Access</th>
                                <th className="px-6 py-6 text-[14px] font-black uppercase text-slate-400">Status</th>
                                <th className="px-6 py-6 text-[14px] font-black uppercase text-slate-400">Organization</th>
                                <th className="px-8 py-6 text-[14px] font-black uppercase text-slate-400 text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-8"><div className="h-8 bg-slate-50 rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                    {getRoleIcon(user.role)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm uppercase tracking-tight">{user.name}</p>
                                                    <p className="text-xs font-medium text-slate-400 lowercase">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-widest shadow-sm">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                user.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {user.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                {user.isActive ? "Active" : "Locked"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            {user.role === 'STUDENT' && user.studentProfile ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Student ID</p>
                                                    <p className="text-xs font-bold text-slate-700">{user.studentProfile.studentNumber}</p>
                                                </div>
                                            ) : user.role === 'SUPERVISOR' && user.supervisorProfile ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Dept</p>
                                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{user.supervisorProfile.department}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Global Admin</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title={user.isActive ? "Deactivate User" : "Activate User"}
                                                    onClick={() => toggleActivation(user.id)}
                                                    className={cn(
                                                        "h-8 w-8 p-0 rounded-lg transition-colors border-2",
                                                        user.isActive ? "text-slate-300 hover:text-red-500 hover:bg-red-50 border-transparent hover:border-red-100" : "text-green-500 bg-green-50 border-green-100 hover:bg-green-100"
                                                    )}
                                                >
                                                    {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors border-2 border-transparent hover:border-red-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <Search className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No matching records found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
