"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building, Handshake, Check, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InvitePage() {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const nextStep = () => setStep((s) => Math.min(s + 1, 3));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));
    const submit = () => setIsSubmitted(true);

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-lg border border-neutral/10 max-w-md mx-auto"
            >
                <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
                    <Check className="h-12 w-12 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">You're all set!</h2>
                <p className="text-neutral mb-6">
                    Your profile has been completed successfully. We've sent a confirmation email with your login details.
                </p>
                <Button className="w-full cursor-pointer" onClick={() => window.location.href = "/student/dashboard"}>
                    Go to Dashboard
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stepper */}
            <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto mb-12">
                <div className="absolute left-0 top-1/2 h-1 w-full bg-neutral/10 -z-10 rounded-full"></div>
                <div
                    className="absolute left-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                ></div>

                {[
                    { num: 1, label: "Personal Info", icon: User },
                    { num: 2, label: "Company Info", icon: Building },
                    { num: 3, label: "Supervisor", icon: Handshake },
                ].map((s) => (
                    <div key={s.num} className="flex flex-col items-center gap-2 bg-background px-2">
                        <div
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
                                step >= s.num
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white border-neutral/20 text-neutral"
                            )}
                        >
                            {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                        </div>
                        <span className={cn(
                            "text-sm font-medium transition-colors duration-300",
                            step >= s.num ? "text-primary" : "text-neutral"
                        )}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Illustration Side */}
                <div className="hidden lg:flex lg:col-span-4 flex-col justify-center items-center text-center p-8 bg-primary/5 rounded-2xl border border-primary/10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col items-center"
                        >
                            {step === 1 && <User className="h-48 w-48 text-primary/20 mb-6" strokeWidth={1} />}
                            {step === 2 && <Building className="h-48 w-48 text-primary/20 mb-6" strokeWidth={1} />}
                            {step === 3 && <Handshake className="h-48 w-48 text-primary/20 mb-6" strokeWidth={1} />}

                            <h3 className="text-xl font-bold text-primary mb-2">
                                {step === 1 && "Tell us about yourself"}
                                {step === 2 && "Where are you working?"}
                                {step === 3 && "Who is your supervisor?"}
                            </h3>
                            <p className="text-neutral text-sm max-w-xs">
                                {step === 1 && "Please provide your personal details so we can create your student profile."}
                                {step === 2 && "Enter the details of the company where you are doing your internship."}
                                {step === 3 && "We need to know who will be assessing your performance during the internship."}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Form Side */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-xl">
                        <CardContent className="p-8">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center gap-6 mb-8">
                                                <div className="h-24 w-24 rounded-full bg-neutral/10 border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors group relative overflow-hidden">
                                                    <Upload className="h-8 w-8 text-neutral group-hover:text-primary transition-colors" />
                                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-neutral-dark">Profile Photo</h4>
                                                    <p className="text-xs text-neutral mt-1">Upload a professional photo.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <Input label="Full Name" placeholder="e.g. Emma Watson" />
                                                <Input label="Date of Birth" type="date" />
                                                <Input label="Student ID" placeholder="e.g. 2024001" />
                                                <Input label="Phone Number" placeholder="e.g. +250 788 123 456" />
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <Input label="Company Name" placeholder="e.g. Bk TechHouse" />
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-primary">Address</label>
                                                <textarea
                                                    className="flex min-h-[100px] w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                                                    placeholder="Enter full company address..."
                                                ></textarea>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <Input label="Company Tel" placeholder="+250..." />
                                                <Input label="Company Email" type="email" placeholder="info@company.com" />
                                                <Input label="P.O. Box" placeholder="Optional" />
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <Select
                                                label="Assign Supervisor"
                                                options={[
                                                    { label: "John Doe (Existing)", value: "john" },
                                                    { label: "Jane Smith (Existing)", value: "jane" },
                                                    { label: "Add New Supervisor", value: "new" },
                                                ]}
                                            />

                                            <div className="p-4 bg-neutral/5 rounded-lg border border-neutral/10 space-y-4">
                                                <h4 className="text-sm font-semibold text-primary">New Supervisor Details</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input label="Name" placeholder="Supervisor Name" />
                                                    <Input label="Designation" placeholder="e.g. Senior Engineer" />
                                                    <Input label="Email" type="email" placeholder="supervisor@company.com" />
                                                    <Input label="Phone" placeholder="+250..." />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex justify-between mt-8 pt-6 border-t border-neutral/10">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={prevStep}
                                        disabled={step === 1}
                                        className={step === 1 ? "invisible" : ""}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>

                                    {step < 3 ? (
                                        <Button type="button" onClick={nextStep}>
                                            Next Step
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={submit} className="bg-success hover:bg-success/90">
                                            Complete Profile
                                            <Check className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
