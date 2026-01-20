"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen, Search, Target, Lightbulb, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

export default function GuidelinesPage() {
    const phases = [
        {
            title: "1. Introduction",
            icon: BookOpen,
            color: "bg-primary/10 text-primary",
            content: "Preparing for an IAP is crucial to ensure a successful and enriching experience. This guide presents instructions to students on how to make the most out of their placement, starting from the preparation phase, during the placement itself, and concluding with the post-placement phase. Follow these guidelines to maximize your learning, professional growth, and overall experience."
        },
        {
            title: "2. Prior to Placement",
            icon: Search,
            color: "bg-primary/10 text-primary",
            items: [
                "Research the Company/Institution where you will be placed and familiarize yourself with it by understand their mission, values, products/services, and any recent news or projects. This will help you align your expectations and demonstrate your interest during the placement.",
                "Review Placement Objectives and understand the objectives of your placement as communicated by RCA. Review the specific skills and knowledge you are expected to gain and consider how you can actively work towards achieving those objectives during your placement.",
                "Set personal goals that align with the placement objectives and always reflect on what you hope to achieve during the placement. This will provide a clear focus and direction for your efforts.",
                "Familiarize yourself with professional etiquette and workplace norms. This includes appropriate behaviour, respect for colleagues and supervisors, confidentiality, punctuality, and a positive attitude. Prepare a professional-looking resume, if required, and bring any necessary identification or documentation requested by the placement host."
            ]
        },
        {
            title: "3. During the Placement",
            icon: Target,
            color: "bg-primary/10 text-primary",
            items: [
                "Be proactive and eager to learn by taking initiative, ask questions, and seek opportunities to contribute to new tasks, projects, and responsibilities that align with your learning goals.",
                "Observe and learn from your colleagues and supervisors by paying attention to their work practices, communication styles, and problem-solving approaches. Actively seek feedback to improve your performance and demonstrate your commitment to growth.",
                "Take advantage of networking opportunities within the workplace by engaging with colleagues, attend company events, and seek mentorship from experienced professionals. Building relationships can open your doors for future opportunities and provide valuable guidance.",
                "Maintain a growth mind-set by embracing challenges and setbacks as learning opportunities. Be open to feedback, adapt to new situations, and continuously seek ways to improve your skills. Embody a growth mind-set that fosters resilience, adaptability, and a commitment to lifelong learning."
            ]
        },
        {
            title: "4. After the Placement",
            icon: TrendingUp,
            color: "bg-primary/10 text-primary",
            items: [
                "Take time to reflect on your placement experience by evaluating your accomplishments, challenges faced, and lessons learned. Consider how the experience has contributed to your personal and professional growth.",
                "Document your achievements, skills acquired, and projects completed during the placement. Update your resume or portfolio to reflect your new experiences and competencies. These will be valuable assets when pursuing future opportunities.",
                "Seek feedback and recommendations by approaching your supervisors or mentors. Request their insights on your performance and areas for further development. These testimonials can be valuable additions to your professional profile.",
                "Apply the knowledge, skills, and insights gained during the placement to your future academic pursuits or career endeavours. Leverage the experience to enhance your academic performance, shape your career path, and make informed decisions."
            ]
        }
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
                                IAP Guidelines
                            </h1>
                            <p className="text-lg md:text-xl text-primary leading-relaxed">
                                Essential guidelines to ensure a successful and professional internship experience throughout your IAP journey.
                            </p>
                        </motion.div>
                    </div>

                    {/* Guidelines Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {phases.map((phase, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="bg-white rounded-2xl shadow-md border border-primary/20 hover:border-primary hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                <div className={`${phase.color} p-6 flex items-center gap-4`}>
                                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <phase.icon className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-primary">{phase.title}</h2>
                                </div>
                                
                                <div className="p-6">
                                    {phase.content ? (
                                        <p className="text-primary leading-relaxed">{phase.content}</p>
                                    ) : (
                                        <ul className="space-y-4">
                                            {phase.items?.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <p className="text-primary leading-relaxed text-sm">{item}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Tips Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Lightbulb className="h-8 w-8 text-primary" />
                            <h2 className="text-3xl font-bold text-primary font-heading">
                                Quick Tips for Success
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                "Always be punctual and maintain professional behavior",
                                "Ask questions and seek clarification when needed",
                                "Document your daily activities and learning experiences",
                                "Build positive relationships with colleagues and supervisors",
                                "Take initiative and show enthusiasm for learning",
                                "Reflect regularly on your progress and growth"
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-primary/10">
                                    <ArrowRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <p className="text-primary text-sm">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
