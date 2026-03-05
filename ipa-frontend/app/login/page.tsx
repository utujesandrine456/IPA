"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, ChevronRight } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const stats = [
    { value: "950+", label: "Graduates" },
    { value: "120+", label: "Companies" },
    { value: "100%", label: "Placement" },
];

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (data.user) {
                const user = data.user;
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("token", data.token || "");

<<<<<<< HEAD
                const { role, profileCompleted, id, studentId, supervisorId } = data.user;
=======
                if (user.studentProfile?.id) {
                    localStorage.setItem("studentProfileId", String(user.studentProfile.id));
                }

                const { role } = user;
                const studentProfileId = user.studentProfile?.id;
                const profileCompleted = user.profileCompleted || user.studentProfile?.profileCompleted;
>>>>>>> 2bbe396d2e25605d5973c961b75a8a4ea493b20b

                if (role === "ADMIN") {
                    router.push("/admin");
                } else if (role === "SUPERVISOR") {
<<<<<<< HEAD
                    router.push(`/supervisor/${supervisorId || id}?supervisorId=${supervisorId || id}`);
=======
                    router.push(`/supervisor?supervisorId=${user.id}`);
>>>>>>> 2bbe396d2e25605d5973c961b75a8a4ea493b20b
                } else if (role === "STUDENT") {
                    if (!studentProfileId) {
                        // No profile found at all — shouldn't happen, but fallback
                        setError("Student profile not found. Please contact admin.");
                        return;
                    }
                    if (profileCompleted) {
<<<<<<< HEAD
                        router.push(`/student/${studentId || id}`);
=======
                        router.push(`/student/${studentProfileId}`);
>>>>>>> 2bbe396d2e25605d5973c961b75a8a4ea493b20b
                    } else {
                        router.push(`/complete-profile?token=login_${studentProfileId}`);
                    }
                } else {
                    router.push("/login");
                }
            }
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ─── LEFT PANEL – Hero Image ─── */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                {/* Background image */}
                <img
                    src="/login-hero.jpg"
                    alt="RCA Campus"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Dark overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/60 via-primary/40 to-primary/20" />

                {/* Animated decorative circles */}
                <div className="absolute top-[10%] right-[8%] h-64 w-64 rounded-full border border-white/10 animate-[spin_30s_linear_infinite]" />
                <div className="absolute top-[12%] right-[10%] h-44 w-44 rounded-full border border-white/10 animate-[spin_20s_linear_infinite_reverse]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-14 w-full">
                    {/* Top: Brand */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div>
                                <div className="text-white font-black text-xl leading-none">IPA System</div>
                            </div>
                        </Link>
                    </div>

                    {/* Middle: Headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">Internship Management System</span>
                        </div>

                        <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight">
                            Launch your<br />
                            <span className="text-white/40 italic">career from</span><br />
                            here.
                        </h1>

                        <p className="text-white/60 text-base font-medium leading-relaxed max-w-sm">
                            The official platform for managing your Industrial Attachment Program — from placement to certification.
                        </p>


                        <Link
                            href="/objectives"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold group transition-colors"
                        >
                            <span className="underline underline-offset-4 decoration-white/30">Learn about the program</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Bottom: Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="flex items-center gap-10"
                    >
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-black text-white tracking-tighter">{stat.value}</div>
                                <div className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ─── RIGHT PANEL – Login Form ─── */}
            <div className="flex-1 flex items-center justify-center bg-[#F4F6FB] px-6 py-12">
                {/* Mobile brand */}
                <div className="absolute top-6 left-6 lg:hidden">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-white font-black text-xs">IA</span>
                        </div>
                        <span className="font-black text-primary text-sm">IPA Portal</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[420px]"
                >
                    {/* Heading */}
                    <div className="mb-10">
                        <h2 className="text-[2.5rem] font-black text-primary tracking-tight leading-tight mb-2">
                            Welcome back
                        </h2>
                        <p className="text-primary/45 font-medium text-[15px]">
                            Sign in with your institutional credentials.
                        </p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold"
                            >
                                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-0.5" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-lg font-semibold text-primary/40">
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/25 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    type="email"
                                    placeholder="example@gmail.com"
                                    value={email}
                                    autoComplete="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-[54px] w-full rounded-2xl border-2 border-primary/8 bg-white pl-11 pr-4 text-sm font-medium text-primary placeholder:text-primary/20 focus:border-primary focus:outline-none shadow-sm shadow-primary/5 transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-lg font-semibold text-primary/40">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-[12px] font-semibold text-primary/40 hover:text-primary transition-colors">
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/25 group-focus-within:text-primary/60 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••"
                                    value={password}
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-[54px] w-full rounded-2xl border-2 border-primary/8 bg-white pl-11 pr-12 text-sm font-medium text-primary placeholder:text-primary/20 focus:border-primary focus:outline-none shadow-sm shadow-primary/5 transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/25 hover:text-primary/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.015 }}
                            whileTap={{ scale: loading ? 1 : 0.985 }}
                            className="w-full h-[54px] bg-primary text-white rounded-xl font-black text-lg cursor-pointer shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-primary/8" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/25">or</span>
                        <div className="flex-1 h-px bg-primary/8" />
                    </div>

                    {/* Back to home */}
                    <div className="text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-bold text-primary/35 hover:text-primary transition-colors"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
