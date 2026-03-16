"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, Loader2, ChevronRight, Shield } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";

const stats = [
    { value: "950+", label: "Graduates" },
    { value: "120+", label: "Companies" },
    { value: "100%", label: "Placement" },
];

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) { setError("Please enter your email address."); return; }
        setLoading(true);
        setError("");

        try {
            const res = await apiFetch("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setSent(true);
                toast.success("Reset link sent successfully!");
            } else {
                setError(res.error || "An error occurred.");
                toast.error(res.error || "An error occurred.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ─── LEFT PANEL – Hero Image ─── */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                <img
                    src="/login-hero.jpg"
                    alt="RCA Campus"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-br from-primary/60 via-primary/40 to-primary/20" />

                {/* Animated decorative circles */}
                <div className="absolute top-[10%] right-[8%] h-64 w-64 rounded-full border border-white/10 animate-[spin_30s_linear_infinite]" />
                <div className="absolute top-[12%] right-[10%] h-44 w-44 rounded-full border border-white/10 animate-[spin_20s_linear_infinite_reverse]" />

                <div className="relative z-10 flex flex-col justify-between p-14 w-full">
                    {/* Top: Brand */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div>
                                <div className="text-white font-black text-xl leading-none">IAP System</div>
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
                            <Shield className="h-3.5 w-3.5 text-white/70" />
                            <span className="text-white/80 text-[11px] font-bold uppercase tracking-widest">Secure Account Recovery</span>
                        </div>

                        <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight">
                            Recover<br />
                            <span className="text-white/40 italic">your access</span><br />
                            securely.
                        </h1>

                        <p className="text-white/60 text-base font-medium leading-relaxed max-w-sm">
                            We'll send a secure reset link to your registered institutional email address.
                        </p>

                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-bold group transition-colors"
                        >
                            <span className="underline underline-offset-4 decoration-white/30">Back to sign in</span>
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

            {/* ─── RIGHT PANEL – Form ─── */}
            <div className="flex-1 flex items-center justify-center bg-[#F4F6FB] px-6 py-12">
                {/* Mobile brand */}
                <div className="absolute top-6 left-6 lg:hidden">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <span className="font-black text-primary text-sm">IPA System</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[420px]"
                >
                    <AnimatePresence mode="wait">
                        {!sent ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.35 }}
                            >
                                {/* Heading */}
                                <div className="mb-10">
                                    <h2 className="text-[2.5rem] font-black text-primary tracking-tight leading-tight mb-2">
                                        Reset Password
                                    </h2>
                                    <p className="text-primary/45 font-medium text-[15px]">
                                        Enter your registered email and we'll send a secure link.
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
                                    <div className="space-y-2">
                                        <label className="text-lg font-semibold text-primary/40">
                                            Email Address:
                                        </label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/25 group-focus-within:text-primary/60 transition-colors" />
                                            <input
                                                type="email"
                                                placeholder="example@gmail.com"
                                                value={email}
                                                autoComplete="email"
                                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                                required
                                                className="h-[54px] w-full rounded-2xl border-2 border-primary/8 bg-white pl-11 pr-4 text-sm font-medium text-primary placeholder:text-primary/20 focus:border-primary focus:outline-none shadow-sm shadow-primary/5 transition-all duration-300"
                                            />
                                        </div>
                                    </div>

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
                                                Sending Link...
                                            </>
                                        ) : "Send Reset Link"}
                                    </motion.button>
                                </form>

                                <div className="flex items-center gap-4 my-8">
                                    <div className="flex-1 h-px bg-primary/8" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/25">or</span>
                                    <div className="flex-1 h-px bg-primary/8" />
                                </div>

                                <div className="text-center">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-primary/35 hover:text-primary transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Sign In
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="text-center"
                            >
                                <div className="h-24 w-24 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                                <h2 className="text-[2.5rem] font-black text-primary tracking-tight leading-tight mb-3">
                                    Check your inbox
                                </h2>
                                <p className="text-primary/45 font-medium text-[15px] mb-2">
                                    A password reset link has been sent to:
                                </p>
                                <p className="font-black text-primary text-lg mb-3">{email}</p>
                                <p className="text-primary/30 text-sm mb-10">
                                    Didn't receive it? Check your spam folder.<br />The link expires in 1 hour.
                                </p>

                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-primary/35 hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Sign In
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}
