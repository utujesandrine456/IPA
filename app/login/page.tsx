"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Lock, Mail, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.token || "");

                const { role, profileCompleted, id } = data.user;

                if (role === "ADMIN") {
                    router.push("/admin");
                } else if (role === "SUPERVISOR") {
                    router.push(`/supervisor?supervisorId=${id}`);
                } else if (role === "STUDENT") {
                    if (profileCompleted) {
                        router.push(`/student/${id}`);
                    } else {
                        // Redirect to complete profile if not completed
                        // We might need a token for this, or just pass the user ID if authenticated
                        // For now, let's assume we can route them there and the page handles it via the Auth Token we just saved
                        router.push(`/complete-profile?token=login_${id}`);
                    }
                } else {
                    router.push("/");
                }
            } else {
                setError(data.error || "Invalid credentials");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                                Sign in to your dashboard
                            </CardTitle>
                            <CardDescription className="text-primary">
                                Superteachers, supervisors, and students can access their dashboards here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                                        <Input
                                            type="email"
                                            placeholder="admin@rca.ac.rw"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10 border-primary/20 focus:border-primary focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                                        <Input
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Logging in...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            Login
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </span>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link href="/" className="text-sm text-primary hover:text-primary/80 transition-colors">
                                    ← Back to Home
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

