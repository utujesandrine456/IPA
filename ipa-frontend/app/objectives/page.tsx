"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { CheckCircle2, Target, Lightbulb, Briefcase, Users, Zap, Award, Network, GraduationCap } from "lucide-react";

export default function ObjectivesPage() {
    const objectives = [
        {
            icon: Target,
            title: "Skill Development",
            desc: "To develop students and enhance their range of skills that are valuable for future careers, including technical skills and transferable skills such as communication, problem-solving, critical thinking, teamwork, adaptability, and time management."
        },
        {
            icon: Briefcase,
            title: "Industry Exposure",
            desc: "To expose students to the industry they are interested in or studying, allowing them to gain a deeper understanding of industry practices, trends, challenges, and opportunities."
        },
        {
            icon: Network,
            title: "Professional Networking",
            desc: "Opportunity for students to build professional networks and establish connections with industry professionals, facilitating future job opportunities, mentorship, and valuable industry contacts."
        },
        {
            icon: Lightbulb,
            title: "Career Exploration",
            desc: "Students can explore their career interests and clarify their goals by experiencing a real work environment and gaining insights into different roles, industries, and work cultures."
        },
        {
            icon: Zap,
            title: "Professional Growth",
            desc: "To foster professional growth in students, challenging them, providing new experiences, and offering feedback to develop self-confidence, resilience, adaptability, and a growth mind-set."
        },
        {
            icon: GraduationCap,
            title: "Academic Integration",
            desc: "To integrate academic learning with practical application, helping students understand how theoretical concepts and classroom learning align with real-world scenarios, enhancing their overall educational experience."
        }
    ];

    const keyPoints = [
        "Did you meet your IAP coordinator or any Liaison Officer (LO)?",
        "Did your company supervisor assess you weekly and record on your Log Book?",
        "Did your LO assess your Log Book when you are visited?",
        "Did you send a Thank You letter to your IAP Company/Institution and give a copy to your LO with a reception stamp & signature? (Compulsory)",
        "Did you complete the Student's Report Form?",
        "Did you submit your Log Book plus your IAP-Report to your LO for grading within TWO weeks after the completion of IAP?",
        "Did the LO sign your Log Book pages?"
    ];

    return (
        <div className="min-h-screen bg-background font-sans">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header Section */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-5xl md:text-6xl font-bold text-primary font-heading mb-6">
                                IAP Objectives
                            </h1>
                            <p className="text-lg md:text-xl text-primary leading-relaxed">
                                The Industrial Attachment Program is designed with clear goals to ensure every student maximizes their potential and delivers value to their host organizations.
                            </p>
                        </motion.div>
                    </div>

                    {/* Objectives Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                        {objectives.map((obj, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="bg-white p-8 rounded-2xl shadow-md border border-primary/20 hover:border-primary hover:shadow-xl transition-all duration-300 group"
                            >
                                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                                    <obj.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-primary mb-4">{obj.title}</h3>
                                <p className="text-primary leading-relaxed text-sm">
                                    {obj.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Key Points Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 md:p-12 border border-primary/20"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl md:text-4xl font-bold text-primary font-heading">
                                Key Points to Keep in Mind
                            </h2>
                        </div>
                        <p className="text-primary mb-8 text-lg font-medium">
                            Compulsory checkpoints by the student throughout the IAP journey:
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            {keyPoints.map((point, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                    className="flex items-start gap-4 bg-white p-5 rounded-xl shadow-sm border border-primary/20 hover:border-primary transition-colors"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-primary font-bold text-sm">{i + 1}</span>
                                        </div>
                                    </div>
                                    <p className="text-primary leading-relaxed flex-1">{point}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
