"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle2, Loader2, Eye, EyeOff, Shield, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const stats = [
    { value: "950+", label: "Graduates" },
    { value: "120+", label: "Companies" },
    { value: "100%", label: "Placement" },
];

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const getStrength = (pw: string) => {
        if (!pw) return { level: 0, label: "", color: "" };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        const map = [
            { level: 1, label: "Weak", color: "bg-red-400" },
            { level: 2, label: "Fair", color: "bg-orange-400" },
            { level: 3, label: "Good", color: "bg-yellow-400" },
            { level: 4, label: "Strong", color: "bg-green-500" },
        ];
        return map[score - 1] || { level: 0, label: "", color: "" };
    };

    const strength = getStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        if (!token) { setError("Invalid reset token."); return; }

        setLoading(true);
        try {
            await apiFetch("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password }),
            });
            setDone(true);
        } catch (err: any) {
            setError(err.message || "Failed to reset password. The link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ─── LEFT PANEL ─── */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                <img src="/login-hero.jpg" alt="RCA Campus" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-br from-primary/60 via-primary/40 to-primary/20" />
                <div className="absolute top-[10%] right-[8%] h-64 w-64 rounded-full border border-white/10 animate-[spin_30s_linear_infinite]" />
                <div className="absolute top-[12%] right-[10%] h-44 w-44 rounded-full border border-white/10 animate-[spin_20s_linear_infinite_reverse]" />

                <div className="relative z-10 flex flex-col justify-between p-14 w-full">
                    <Link href="/" className="text-white font-black text-xl">IPA System</Link>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
                            <Shield className="h-3.5 w-3.5 text-white/70" />
                            <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">Set New Password</span>
                        </div>
                        <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight">
                            Choose a<br /><span className="text-white/40 italic">strong</span><br />password.
                        </h1>
                        <p className="text-white/60 text-base font-medium leading-relaxed max-w-sm">
                            Your new password will be used to securely access your internship dashboard.
                        </p>
                        <Link href="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold group transition-colors">
                            <span className="underline underline-offset-4 decoration-white/30">Back to sign in</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="flex items-center gap-10">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-2xl font-black text-white tracking-tighter">{stat.value}</div>
                                <div className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ─── RIGHT PANEL ─── */}
            <div className="flex-1 flex items-center justify-center bg-[#F4F6FB] px-6 py-12">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[420px]">
                    <AnimatePresence mode="wait">
                        {!token ? (
                            <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                <div className="h-24 w-24 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-8">
                                    <AlertTriangle className="h-12 w-12 text-red-400" />
                                </div>
                                <h2 className="text-[2rem] font-black text-primary tracking-tight mb-3">Invalid Link</h2>
                                <p className="text-primary/45 font-medium text-[15px] mb-8">This link is invalid or has expired.</p>
                                <Link href="/forgot-password" className="inline-flex items-center justify-center w-full h-[54px] bg-primary text-white rounded-xl font-black text-lg shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all">
                                    Request New Link
                                </Link>
                            </motion.div>
                        ) : !done ? (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                                <div className="mb-10">
                                    <h2 className="text-[2.5rem] font-black text-primary tracking-tight leading-tight mb-2">New Password</h2>
                                    <p className="text-primary/45 font-medium text-[15px]">Choose a strong password for your account.</p>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-semibold">
                                            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-0.5" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* New Password */}
                                    <div className="space-y-2">
                                        <label className="text-lg font-semibold text-primary/40">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/25 group-focus-within:text-primary/60 transition-colors" />
                                            <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} required className="h-[54px] w-full rounded-2xl border-2 border-primary/8 bg-white pl-11 pr-12 text-sm font-medium text-primary placeholder:text-primary/20 focus:border-primary focus:outline-none shadow-sm shadow-primary/5 transition-all duration-300" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/25 hover:text-primary/60 transition-colors">
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {/* Strength bar */}
                                        {password && (
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : "bg-primary/8"}`} />
                                                    ))}
                                                </div>
                                                {strength.label && <p className="text-[11px] font-bold text-primary/40">{strength.label} password</p>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <label className="text-lg font-semibold text-primary/40">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/25 group-focus-within:text-primary/60 transition-colors" />
                                            <input type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} required
                                                className={`h-[54px] w-full rounded-2xl border-2 bg-white pl-11 pr-12 text-sm font-medium text-primary placeholder:text-primary/20 focus:outline-none shadow-sm transition-all duration-300 ${confirmPassword && confirmPassword !== password ? "border-red-300 focus:border-red-400" : confirmPassword && confirmPassword === password ? "border-green-300 focus:border-green-400" : "border-primary/8 focus:border-primary"}`}
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/25 hover:text-primary/60 transition-colors">
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.015 }} whileTap={{ scale: loading ? 1 : 0.985 }} className="w-full h-[54px] bg-primary text-white rounded-xl font-black text-lg cursor-pointer shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 mt-2">
                                        {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</>) : "Set New Password"}
                                    </motion.button>
                                </form>

                                <div className="flex items-center gap-4 my-8">
                                    <div className="flex-1 h-px bg-primary/8" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/25">or</span>
                                    <div className="flex-1 h-px bg-primary/8" />
                                </div>
                                <div className="text-center">
                                    <Link href="/login" className="text-sm font-bold text-primary/35 hover:text-primary transition-colors">← Back to Sign In</Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center">
                                <div className="h-24 w-24 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                                <h2 className="text-[2.5rem] font-black text-primary tracking-tight leading-tight mb-3">Password Updated!</h2>
                                <p className="text-primary/45 font-medium text-[15px] mb-10">Your password has been reset. You can now sign in.</p>
                                <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={() => router.push("/login")} className="w-full h-[54px] bg-primary text-white rounded-xl font-black text-lg cursor-pointer shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all">
                                    Sign In Now
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
