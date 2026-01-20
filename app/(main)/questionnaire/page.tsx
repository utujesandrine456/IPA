"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { CheckSquare, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuestionnairePage() {
    const [activeTab, setActiveTab] = useState<"student" | "supervisor">("student");

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-primary mb-2">Evaluation Questionnaire</h1>
                <p className="text-neutral">Please complete the relevant section below.</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-xl border border-neutral/10 shadow-sm inline-flex">
                    <button
                        onClick={() => setActiveTab("student")}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === "student"
                                ? "bg-primary text-white shadow-sm"
                                : "text-neutral hover:text-primary"
                        )}
                    >
                        <User className="h-4 w-4" />
                        Student Self-Evaluation
                    </button>
                    <button
                        onClick={() => setActiveTab("supervisor")}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === "supervisor"
                                ? "bg-primary text-white shadow-sm"
                                : "text-neutral hover:text-primary"
                        )}
                    >
                        <Briefcase className="h-4 w-4" />
                        Supervisor Evaluation
                    </button>
                </div>
            </div>

            <Card>
                <CardContent className="p-8">
                    {activeTab === "student" ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div>
                                <h3 className="font-semibold text-lg text-neutral-dark mb-4">Skills Acquired</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {["Technical Skills", "Communication", "Teamwork", "Problem Solving", "Time Management", "Leadership"].map((skill) => (
                                        <label key={skill} className="flex items-center gap-3 p-3 border border-neutral/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                            <input type="checkbox" className="h-4 w-4 text-primary rounded border-neutral/30 focus:ring-primary" />
                                            <span className="text-sm text-neutral-dark">{skill}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg text-neutral-dark mb-4">Challenges Faced</h3>
                                <textarea
                                    className="w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px]"
                                    placeholder="Describe any challenges you encountered..."
                                ></textarea>
                            </div>

                            <Button className="w-full">Submit Evaluation</Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 mb-6">
                                <p className="text-sm text-primary">
                                    To be filled by the Industry Supervisor only.
                                </p>
                            </div>

                            <Input label="Student Name" placeholder="Enter student name" />

                            <div>
                                <label className="text-sm font-medium text-neutral-dark mb-2 block">Performance Rating</label>
                                <select className="w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary">
                                    <option>Excellent</option>
                                    <option>Very Good</option>
                                    <option>Good</option>
                                    <option>Fair</option>
                                    <option>Poor</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-neutral-dark mb-2 block">Remarks</label>
                                <textarea
                                    className="w-full rounded-lg border border-neutral/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px]"
                                    placeholder="Additional comments..."
                                ></textarea>
                            </div>

                            <Button className="w-full">Submit Assessment</Button>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
