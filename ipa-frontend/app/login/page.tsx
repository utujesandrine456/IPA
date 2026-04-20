"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, ChevronRight } from "lucide-react";
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            if (!result.ok) {
                setError(result.error || "Invalid credentials. Please try again.");
                return;
            }

            const { data } = result;

            if (data?.user) {
                const user = data.user;
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("token", data.token || "");

                const role = user.role?.toUpperCase();
                const sid = user.studentId || user.supervisorId || user.liaisonId || user.id;

                if (role === "ADMIN") {
                    router.push("/admin");
                } else if (role === "SUPERVISOR") {
                    router.push(`/supervisor/${sid}`);
                } else if (role === "LIAISON") {
                    router.push(`/liaison/${sid}`);
                } else if (role === "STUDENT") {
                    if (!sid) {
                        setError("Student profile not found. Please contact admin.");
                        return;
                    }

                    if (user.studentId || user.studentProfile?.id) {
                        localStorage.setItem("studentProfileId", String(user.studentId || user.studentProfile.id));
                    }

                    if (user.profileCompleted || user.studentProfile?.profileCompleted) {
                        router.push(`/student/${sid}`);
                    } else {
                        router.push(`/complete-profile?token=login_${sid}`);
                    }
                } else {
                    router.push("/login");
                }
            } else {
                setError("Unexpected response from server.");
            }
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <motion.div
                className="hidden lg:flex lg:w-[55%] relative overflow-hidden cursor-pointer"
                whileHover="hovered"
                initial="initial"
            >
                <motion.img
                    src="/login-hero.jpg"
                    alt="RCA Campus"
                    className="absolute inset-0 w-full h-full object-cover"
                    variants={{
                        initial: { filter: "grayscale(100%)", scale: 1 },
                        hovered: { filter: "grayscale(0%)", scale: 1.05 }
                    }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />

                {/* Sophisticated dual-layer overlay */}
                <motion.div
                    className="absolute inset-0 bg-primary/40"
                    variants={{
                        initial: { opacity: 1 },
                        hovered: { opacity: 0.2 }
                    }}
                    transition={{ duration: 1 }}
                />
                <motion.div
                    className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/40 to-transparent"
                    variants={{
                        initial: { opacity: 1 },
                        hovered: { opacity: 0.8 }
                    }}
                    transition={{ duration: 1 }}
                />

                {/* Animated decorative elements - more subtle */}
                <div className="absolute top-[10%] right-[8%] h-64 w-64 rounded-full border border-white/5 animate-[spin_40s_linear_infinite]" />
                <div className="absolute top-[12%] right-[10%] h-44 w-44 rounded-full border border-white/5 animate-[spin_30s_linear_infinite_reverse]" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-6 w-full">
                    {/* Top: Brand */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div>
                                <div className="text-white font-black text-5xl leading-none italic">IAP System</div>
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
                        <h1 className="text-5xl xl:text-7xl font-bold text-white leading-[1.05]">
                            Launch your <span className="text-white/60 italic font-bold">career from</span> here
                        </h1>

                        <p className="text-white/60 text-base font-medium leading-relaxed max-w-sm">
                            The official platform for managing your Industrial Attachment Program — from placement to certification.
                        </p>

                        <Link
                            href="/objectives"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium group/link transition-colors"
                        >
                            <span className="underline underline-offset-4 decoration-white/30">Learn about the program</span>
                            <ChevronRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
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
                                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                                <div className="text-white/40 text-[10px] font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* ─── RIGHT PANEL – Login Form ─── */}
            <div className="flex-1 flex items-center justify-center bg-[#F4F6FB] px-6 py-12">
                {/* Mobile brand */}
                <div className="absolute top-6 left-6 lg:hidden">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <span className="font-semibold text-primary text-sm">IAP Portal</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-[480px] bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-primary/5 border border-white"
                >
                    {/* Heading */}
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-4xl font-semibold text-primary leading-tight mb-2">
                            Welcome back
                        </h2>
                        <p className="text-slate-400 font-medium text-[15px]">
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-500 ml-1">
                                Email Address
                            </label>
                            <motion.div
                                className="relative group"
                                whileTap={{ scale: 0.995 }}
                            >
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    autoComplete="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-[54px] w-full rounded-md border border-slate-200 bg-slate-50/30 pl-11 pr-4 text-sm font-medium text-primary placeholder:text-slate-300 focus:border-primary focus:bg-white focus:outline-none hover:bg-slate-100/50 shadow-sm transition-all duration-300"
                                />
                            </motion.div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-semibold text-slate-500">
                                    Password
                                </label>
                                <Link href="/forgot-password" icon-hover="gray" className="text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <motion.div
                                className="relative group"
                                whileTap={{ scale: 0.995 }}
                            >
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••"
                                    value={password}
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-[54px] w-full rounded-md border border-slate-200 bg-slate-50/30 pl-11 pr-12 text-sm font-medium text-primary placeholder:text-slate-300 focus:border-primary focus:bg-white focus:outline-none hover:bg-slate-100/50 shadow-sm transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </motion.div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.01 }}
                            whileTap={{ scale: loading ? 1 : 0.99 }}
                            className="w-full h-[56px] bg-primary text-white rounded-md font-semibold text-base cursor-pointer shadow-lg shadow-primary/20 hover:bg-primary/95 hover:grayscale-[0.2] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-60 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-10">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[12px] font-medium text-slate-300">or continue with</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {/* Back to home */}
                    <div className="text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            Back to Home Page
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
