"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Lock, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const data = await apiFetch("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password }),
            });
            setMessage(data.message || "Password has been successfully reset.");
        } catch (error: any) {
            setError(error.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="w-full max-w-md border-primary/20 shadow-xl text-center p-8">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-primary mb-2">Invalid Reset Link</h2>
                    <p className="text-slate-500 mb-6">The password reset link is missing or invalid.</p>
                    <Link href="/forgot-password" gap-4 className="w-full block">
                        <Button className="w-full">Request New Link</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="border-primary/20 shadow-xl">
                        <CardHeader className="text-center pb-8">
                            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-primary mb-2">
                                Reset Password
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Create a strong password for your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {message ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-6 py-4"
                                >
                                    <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-primary">Password Changed!</h3>
                                        <p className="text-slate-500 text-sm">
                                            {message}
                                        </p>
                                    </div>
                                    <Link href="/login" className="w-full block">
                                        <Button className="w-full">Go to Login</Button>
                                    </Link>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="pl-10 border-primary/20 focus:border-primary focus:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="pl-10 border-primary/20 focus:border-primary focus:ring-primary"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg"
                                    >
                                        {loading ? "Resetting..." : "Update Password"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
