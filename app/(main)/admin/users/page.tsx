"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Trash2, UserCog, Loader2, Shield, GraduationCap, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

interface User {
    id: number;
    name: string;
    email: string;
    role: "ADMIN" | "SUPERVISOR" | "STUDENT";
    createdAt: string;
    studentProfile?: { studentNumber: string };
    supervisorProfile?: { department: string };
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState<string>("ALL");
    const [creatingUser, setCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        role: "SUPERVISOR" as "SUPERVISOR",
        phone: "",
        department: "",
        password: "",
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);
        try {
            const res = await fetch("/api/superteacher/add-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                setNewUser({
                    name: "",
                    email: "",
                    role: "SUPERVISOR",
                    phone: "",
                    department: "",
                    password: "",
                });
                alert("User created successfully");
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to create user");
            }
        } catch (error) {
            console.error("Error creating user:", error);
        } finally {
            setCreatingUser(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = filterRole === "ALL" || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "ADMIN": return <Shield className="h-4 w-4 text-purple-600" />;
            case "SUPERVISOR": return <Briefcase className="h-4 w-4 text-blue-600" />;
            case "STUDENT": return <GraduationCap className="h-4 w-4 text-green-600" />;
            default: return <UserCog className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Manage Users</h1>
                    <p className="text-primary/60">View, create, and manage system users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>User List</CardTitle>
                        <CardDescription>
                            Total Users: {users.length}
                        </CardDescription>
                        <div className="flex gap-2 mt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral/50" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="px-3 py-2 text-sm border border-neutral/20 rounded-lg"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="ADMIN">Admins</option>
                                <option value="SUPERVISOR">Supervisors</option>
                                <option value="STUDENT">Students</option>
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setLoading(true);
                                    fetchUsers();
                                }}
                                disabled={loading}
                                className="h-9"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-4">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border shadow-sm">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-primary">{user.name}</p>
                                                <p className="text-xs text-primary/60">{user.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border">
                                                        {user.role}
                                                    </span>
                                                    {user.role === 'STUDENT' && user.studentProfile && (
                                                        <span className="text-[10px] text-primary/50">ID: {user.studentProfile.studentNumber}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="text-center py-8 text-primary/40">No users found</div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
