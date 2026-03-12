"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";
import { ShieldCheck, Lock } from "lucide-react";

export function SecurityForm() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const result = await apiFetch("/auth/change-password", {
                method: "POST",
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            if (result.ok) {
                toast.success("Password changed successfully. You may need to log in again.");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                
                // Optional: Logout or force re-auth
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = "/login";
                }, 2000);
            } else {
                toast.error(result.error || "Failed to change password");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6 flex items-start gap-4">
                <ShieldCheck className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-primary">Security Recommendation</p>
                    <p className="text-xs text-neutral">Use a unique password you don't use elsewhere. Changing your password will log you out of all other devices.</p>
                </div>
            </div>

            <Input
                label="Current Password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                iconLeft={<Lock className="h-4 w-4" />}
            />

            <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                iconLeft={<Lock className="h-4 w-4" />}
            />

            <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                iconLeft={<Lock className="h-4 w-4" />}
            />

            <div className="pt-4">
                <Button type="submit" isLoading={loading} className="w-full">
                    Update Password
                </Button>
            </div>
        </form>
    );
}
