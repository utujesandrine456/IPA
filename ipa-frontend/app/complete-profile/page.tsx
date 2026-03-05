"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Building, Handshake, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Lock, Eye, EyeOff, Phone, MapPin, Calendar, Shield
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const steps = [
  { id: 1, label: "Personal Info", icon: User, desc: "Confirm your details and set your login password." },
  { id: 2, label: "Company Info", icon: Building, desc: "Share the details of the organization hosting your internship." },
  { id: 3, label: "Supervisor", icon: Handshake, desc: "Select your supervisor and set your internship schedule." },
];

function StepInput({ label, type = "text", placeholder, value, onChange, required, icon: Icon }: {
  label: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; required?: boolean; icon?: any;
}) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 group-focus-within:text-primary transition-colors">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/25 pointer-events-none" />}
        <input
          type={isPassword ? (showPw ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`h-14 w-full rounded-2xl border-2 border-primary/8 bg-primary/3 ${Icon ? "pl-11" : "px-4"} ${isPassword ? "pr-12" : "pr-4"} text-sm font-medium text-primary placeholder:text-primary/20 focus:border-primary focus:outline-none focus:bg-white transition-all duration-300`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/25 hover:text-primary/50 transition-colors">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function StepTextarea({ label, placeholder, value, onChange, required }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 group-focus-within:text-primary transition-colors">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={3}
        className="w-full rounded-2xl border-2 border-primary/8 bg-primary/3 px-4 py-3 text-sm font-medium text-primary placeholder:text-primary/20 focus:border-primary focus:outline-none focus:bg-white transition-all duration-300 resize-none"
      />
    </div>
  );
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    supervisorId: "",
    supervisorName: "",
    supervisorEmail: "",
    internshipStart: "",
    internshipEnd: "",
  });

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      apiFetch(`/students/complete-profile?token=${token}`),
      apiFetch("/supervisors")
    ]).then(([profileData, supData]) => {
      const s = profileData.student;
      setStudent(s);
      setFormData(prev => ({
        ...prev,
        phone: s.phone || "",
        address: s.address || "",
        companyName: s.companyName || "",
        companyAddress: s.companyAddress || "",
        companyPhone: s.companyPhone || "",
        companyEmail: s.companyEmail || "",
        internshipStart: s.internshipStart ? new Date(s.internshipStart).toISOString().split("T")[0] : "",
        internshipEnd: s.internshipEnd ? new Date(s.internshipEnd).toISOString().split("T")[0] : "",
        supervisorId: s.supervisorId?.toString() || "",
      }));
      if (supData.supervisors) setSupervisors(supData.supervisors);
    }).catch(() => {
      router.push("/login");
    }).finally(() => setLoading(false));
  }, [token, router]);

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const validateStep = () => {
    if (step === 1) {
      if (!formData.phone) { setError("Phone number is required."); return false; }
      if (!formData.address) { setError("Address is required."); return false; }
      if (formData.password && formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return false; }
      if (formData.password && formData.password.length < 8) { setError("Password must be at least 8 characters."); return false; }
    }
    if (step === 2) {
      if (!formData.companyName) { setError("Company name is required."); return false; }
      if (!formData.companyAddress) { setError("Company address is required."); return false; }
    }
    if (step === 3) {
      if (!formData.supervisorId) { setError("Please select a supervisor."); return false; }
      if (!formData.internshipStart || !formData.internshipEnd) { setError("Internship dates are required."); return false; }
    }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (!validateStep()) return;
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleSupervisorSelect = (id: string) => {
    const sup = supervisors.find(s => s.id === Number(id));
    if (sup) {
      setFormData(prev => ({
        ...prev,
        supervisorId: id,
        supervisorName: sup.user?.name || "",
        supervisorEmail: sup.user?.email || "",
      }));
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await apiFetch("/students/complete-profile", {
        method: "POST",
        body: JSON.stringify({ token, ...formData }),
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl shadow-primary/8 border border-primary/5 p-12 max-w-md w-full text-center"
        >
          <div className="h-24 w-24 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-primary mb-2 tracking-tight">Profile Complete!</h2>
          <p className="text-primary/50 text-sm font-medium mb-8">
            Your details have been verified. Welcome, {student?.user?.name}!
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full h-14 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            Sign In to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] py-12 px-4">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shadow-xl shadow-primary/30 mb-5">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Complete Your Profile</h1>
          <p className="text-primary/40 text-sm font-medium mt-2">
            Welcome, <span className="font-black text-primary">{student?.user?.name}</span> — please fill in the steps below to activate your account.
          </p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-8 relative">
          {/* Connector Track */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-primary/8 -z-10 mx-10" />
          <div
            className="absolute top-5 left-10 h-0.5 bg-primary -z-10 transition-all duration-700"
            style={{ width: `calc(${((step - 1) / (steps.length - 1)) * 100}% - 80px * ${(step - 1) / (steps.length - 1)})` }}
          />
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 border-2 shadow-sm ${step > s.id
                  ? "bg-green-500 border-green-500 text-white shadow-green-200"
                  : step === s.id
                    ? "bg-primary border-primary text-white shadow-primary/30 scale-110"
                    : "bg-white border-primary/10 text-primary/30"
                }`}>
                {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${step >= s.id ? "text-primary" : "text-primary/25"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-primary/8 border border-primary/5 overflow-hidden">
          {/* Step Header */}
          <div className="px-10 pt-10 pb-6 border-b border-primary/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-1.5">
                  {(() => { const StepIcon = steps[step - 1].icon; return <StepIcon className="h-5 w-5 text-primary/40" />; })()}
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">
                    Step {step} of {steps.length}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-primary tracking-tight">{steps[step - 1].label}</h2>
                <p className="text-primary/40 text-sm font-medium mt-1">{steps[step - 1].desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form Content */}
          <div className="p-10">
            <AnimatePresence mode="wait">
              {/* ── Step 1 ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5"
                >
                  {/* Read-only identity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Full Name</label>
                      <div className="h-14 w-full rounded-2xl border-2 border-primary/5 bg-primary/3 px-4 flex items-center text-sm font-black text-primary">{student?.user?.name || "—"}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Student Number</label>
                      <div className="h-14 w-full rounded-2xl border-2 border-primary/5 bg-primary/3 px-4 flex items-center text-sm font-black text-primary">{student?.studentNumber || "—"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <StepInput label="Phone Number" placeholder="+250 788 123 456" value={formData.phone} onChange={v => update("phone", v)} required icon={Phone} />
                    <StepInput label="Address" placeholder="Kigali, Rwanda" value={formData.address} onChange={v => update("address", v)} required icon={MapPin} />
                  </div>

                  <div className="pt-4 border-t border-primary/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 mb-4 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" /> Set Login Password (optional)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <StepInput label="New Password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={v => update("password", v)} />
                      <StepInput label="Confirm Password" type="password" placeholder="Repeat password" value={formData.confirmPassword} onChange={v => update("confirmPassword", v)} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5"
                >
                  <StepInput label="Company Name" placeholder="e.g. BK TechHouse" value={formData.companyName} onChange={v => update("companyName", v)} required icon={Building} />
                  <StepTextarea label="Company Address" placeholder="Enter full company address..." value={formData.companyAddress} onChange={v => update("companyAddress", v)} required />
                  <div className="grid grid-cols-2 gap-4">
                    <StepInput label="Company Phone" placeholder="+250..." value={formData.companyPhone} onChange={v => update("companyPhone", v)} icon={Phone} />
                    <StepInput label="Company Email" type="email" placeholder="info@company.com" value={formData.companyEmail} onChange={v => update("companyEmail", v)} />
                  </div>
                </motion.div>
              )}

              {/* ── Step 3 ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5"
                >
                  <div className="space-y-2 group">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 group-focus-within:text-primary transition-colors">
                      Select Supervisor <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.supervisorId}
                      onChange={e => handleSupervisorSelect(e.target.value)}
                      className="h-14 w-full rounded-2xl border-2 border-primary/8 bg-primary/3 px-4 text-sm font-medium text-primary focus:border-primary focus:outline-none focus:bg-white transition-all duration-300"
                    >
                      <option value="">— Choose a supervisor —</option>
                      {supervisors.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.user?.name} ({sup.user?.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.supervisorId && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-primary/3 border border-primary/8 text-sm"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 mb-1">Selected Supervisor</p>
                      <p className="font-black text-primary">{formData.supervisorName}</p>
                      <p className="text-primary/50 text-xs">{formData.supervisorEmail}</p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <StepInput label="Internship Start Date" type="date" value={formData.internshipStart} onChange={v => update("internshipStart", v)} required icon={Calendar} />
                    <StepInput label="Internship End Date" type="date" value={formData.internshipEnd} onChange={v => update("internshipEnd", v)} required icon={Calendar} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-5 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-semibold"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-primary/5">
              <button
                type="button"
                onClick={() => { setError(""); setStep(p => Math.max(p - 1, 1)); }}
                className={`flex items-center gap-2 h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-primary/8 text-primary/50 hover:border-primary/20 hover:text-primary transition-all ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 h-12 px-8 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 h-12 px-8 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Complete Profile</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}