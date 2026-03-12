"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    studentId?: number;
    supervisorId?: number;
    liaisonId?: number;
}

export function ProfileForm() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form states
    const [name, setName] = useState("");
    const [extraFields, setExtraFields] = useState<any>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const meResult = await apiFetch("/auth/me");
            if (meResult.ok) {
                const userData = meResult.data;
                setUser(userData);
                setName(userData.name);

                // Fetch role-specific details
                let roleEndpoint = "";
                let roleId = 0;

                if (userData.role === "STUDENT") {
                    roleEndpoint = "/students";
                    roleId = userData.studentId || userData.studentProfile?.id;
                } else if (userData.role === "SUPERVISOR") {
                    roleEndpoint = "/supervisors";
                    roleId = userData.supervisorId || userData.supervisorProfile?.id;
                } else if (userData.role === "LIAISON") {
                    roleEndpoint = "/liaisons";
                    roleId = userData.liaisonId || userData.liaisonProfile?.id;
                }

                if (roleEndpoint && roleId) {
                    const roleResult = await apiFetch(`${roleEndpoint}/${roleId}`);
                    if (roleResult.ok) {
                        const data = roleResult.data;
                        // For students, the response might be { student: { ... } }
                        const actualData = data.student || data.supervisor || data.liaison || data;
                        setExtraFields(actualData);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Update User Name
            const nameResult = await apiFetch("/auth/me", {
                method: "PATCH",
                body: JSON.stringify({ name }),
            });

            if (!nameResult.ok) {
                toast.error(nameResult.error || "Failed to update name");
                setSaving(false);
                return;
            }

            // Update localStorage name for immediate UI feedback
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.name = name;
                localStorage.setItem("user", JSON.stringify(parsed));
                // Trigger an event or rely on state refresh
            }

            // 2. Update Role specific fields
            let roleEndpoint = "";
            let roleId = 0;

            if (user?.role === "STUDENT") {
                roleEndpoint = "/students";
                roleId = user.studentId || (user as any).studentProfile?.id;
            } else if (user?.role === "SUPERVISOR") {
                roleEndpoint = "/supervisors";
                roleId = user.supervisorId || (user as any).supervisorProfile?.id;
            } else if (user?.role === "LIAISON") {
                roleEndpoint = "/liaisons";
                roleId = user.liaisonId || (user as any).liaisonProfile?.id;
            }

            if (roleEndpoint && roleId) {
                // Filter out non-updatable fields if necessary
                const { id, userId, createdAt, updatedAt, user: _u, supervisor: _s, liaison: _l, ratings: _r, students: _st, ...updatable } = extraFields;
                
                const roleUpdateResult = await apiFetch(`${roleEndpoint}/${roleId}`, {
                    method: "PATCH",
                    body: JSON.stringify(updatable),
                });

                if (!roleUpdateResult.ok) {
                    toast.error(roleUpdateResult.error || "Failed to update profile details");
                    setSaving(false);
                    return;
                }
            }

            toast.success("Profile updated successfully");
            fetchData();
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-neutral animate-pulse">Loading profile details...</p>
        </div>
    );

    return (
        <form onSubmit={handleSave} className="space-y-8">
            {/* General Information */}
            <div className="space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    General Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <Input
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        required
                    />
                    <Input
                        label="Email Address"
                        value={user?.email || ""}
                        disabled
                        className="bg-white/50"
                    />
                    {user?.role === "STUDENT" && (
                        <>
                            <Input
                                label="Student Number"
                                value={extraFields.studentNumber || ""}
                                disabled
                                className="bg-white/50"
                            />
                            <div className="w-full space-y-2">
                                <label className="text-sm font-medium text-primary">Gender</label>
                                <select 
                                    className="flex h-11 w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    value={extraFields.sex || ""}
                                    onChange={(e) => setExtraFields({ ...extraFields, sex: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Contact & Personal Details */}
            <div className="space-y-4">
                <h4 className="font-bold text-primary flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    Contact & Personal Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Phone Number"
                        value={extraFields.phone || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, phone: e.target.value })}
                        placeholder="+250..."
                    />
                    <Input
                        label="Residential Address"
                        value={extraFields.address || ""}
                        onChange={(e) => setExtraFields({ ...extraFields, address: e.target.value })}
                        placeholder="City, District..."
                    />
                    {user?.role === "STUDENT" && (
                        <>
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={extraFields.dateOfBirth ? new Date(extraFields.dateOfBirth).toISOString().split('T')[0] : ""}
                                onChange={(e) => setExtraFields({ ...extraFields, dateOfBirth: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Year of Study"
                                    value={extraFields.year || ""}
                                    onChange={(e) => setExtraFields({ ...extraFields, year: e.target.value })}
                                    placeholder="e.g. Year 3"
                                />
                                <Input
                                    label="Graduation Year"
                                    value={extraFields.graduationYear || ""}
                                    onChange={(e) => setExtraFields({ ...extraFields, graduationYear: e.target.value })}
                                    placeholder="2025"
                                />
                            </div>
                        </>
                    )}
                    {(user?.role === "SUPERVISOR" || user?.role === "LIAISON") && (
                        <Input
                            label="Department"
                            value={extraFields.department || ""}
                            onChange={(e) => setExtraFields({ ...extraFields, department: e.target.value })}
                        />
                    )}
                </div>
            </div>

            {/* Role Specific Details */}
            {user?.role === "STUDENT" && (
                <div className="space-y-4">
                    <h4 className="font-bold text-primary flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        Internship Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-neutral/5 border border-neutral/10">
                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input
                                label="Company Name"
                                value={extraFields.companyName || ""}
                                onChange={(e) => setExtraFields({ ...extraFields, companyName: e.target.value })}
                            />
                            <div className="md:col-span-2">
                                <Input
                                    label="Company Address"
                                    value={extraFields.companyAddress || ""}
                                    onChange={(e) => setExtraFields({ ...extraFields, companyAddress: e.target.value })}
                                />
                            </div>
                        </div>
                        <Input
                            label="Company Phone"
                            value={extraFields.companyPhone || ""}
                            onChange={(e) => setExtraFields({ ...extraFields, companyPhone: e.target.value })}
                        />
                        <Input
                            label="Company Email"
                            value={extraFields.companyEmail || ""}
                            onChange={(e) => setExtraFields({ ...extraFields, companyEmail: e.target.value })}
                        />
                        <Input
                            label="Company P.O. Box"
                            value={extraFields.companyPOBox || ""}
                            onChange={(e) => setExtraFields({ ...extraFields, companyPOBox: e.target.value })}
                        />
                        <Input
                            label="Absent Days"
                            type="number"
                            value={extraFields.absentDays || 0}
                            onChange={(e) => setExtraFields({ ...extraFields, absentDays: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="mt-6 space-y-4">
                        <h5 className="font-semibold text-primary/80 text-sm italic">Industry Supervisor Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Supervisor Name"
                                value={extraFields.supervisorName || ""}
                                onChange={(e) => setExtraFields({ ...extraFields, supervisorName: e.target.value })}
                            />
                            <Input
                                label="Supervisor Designation"
                                value={extraFields.supervisorDesignation || ""}
                                onChange={(e) => setExtraFields({ ...extraFields, supervisorDesignation: e.target.value })}
                                placeholder="e.g. CTO, Manager"
                            />
                            <Input
                                label="Supervisor Email"
                                value={extraFields.supervisorEmail || ""}
                                onChange={(e) => setExtraFields({ ...extraFields, supervisorEmail: e.target.value })}
                            />
                            <Input
                                label="Supervisor Phone"
                                value={extraFields.supervisorPhone || ""}
                                onChange={(e) => setExtraFields({ ...extraFields, supervisorPhone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-8 border-t border-neutral/10">
                <Button type="submit" isLoading={saving} className="px-12 py-6 rounded-xl shadow-lg shadow-primary/20">
                    Update Profile
                </Button>
            </div>
        </form>
    );
}
