"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { Mail, Shield, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const data = await apiFetch("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setMessage(data.message || "A reset link has been sent to your email.");
        } catch (error: any) {
            setError(error.message || "An error occurred. Please try again.");
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
                                Forgot Password?
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Enter your email and we'll send you a link to reset your password.
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
                                        <h3 className="text-xl font-bold text-primary">Email Sent!</h3>
                                        <p className="text-slate-500 text-sm">
                                            {message}
                                        </p>
                                    </div>
                                    <Link href="/login" className="w-full block">
                                        <Button className="w-full">Back to Login</Button>
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
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                                            <Input
                                                type="email"
                                                placeholder="your-email@rca.ac.rw"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                        {loading ? "Sending link..." : "Send Reset Link"}
                                    </Button>

                                    <div className="text-center">
                                        <Link href="/login" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-primary transition-colors">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to Login
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
