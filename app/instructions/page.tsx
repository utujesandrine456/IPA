"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { UserCheck, FileText, DollarSign, AlertTriangle, BookOpen, Info } from "lucide-react";

export default function InstructionsPage() {
    const sections = [
        {
            icon: UserCheck,
            title: "Meet your LO",
            color: "bg-primary/10 text-primary",
            content: "It is very important that you obtain the contact number of your LO where they can be contacted outside office hours in case you may need it. Please consult him or her if you have any problems."
        },
        {
            icon: FileText,
            title: "Rules and Regulations",
            color: "bg-primary/10 text-primary",
            items: [
                "Once your IAP placement has been confirmed, you are not permitted to change your attachment or withdraw from the program without obtaining approval from the RCA IAP coordinator.",
                "It is mandatory for you to adhere to the rules and regulations that govern employees of the IAP company or institution to which you are attached.",
                "Any instances of absenteeism, insubordination, tardiness, or misconduct reported against you will result in disciplinary action.",
                "Direct negotiation with the company regarding matters such as the duration of your attachment, allowance, working hours, leave of absence, working conditions, and rules is strictly prohibited.",
                "During your attachment, you are not entitled to any leave or days off, including returning to RCA or your home. However, in case of emergencies, please seek permission from your supervisor for a leave of absence. Your LO must also be notified.",
                "For non-emergency situations, you must apply for a leave of absence from the company or institution's supervision and inform your LO. Please contact them during regular working hours, excluding weekends.",
                "If you become ill, please inform your supervisor that you will be consulting a doctor. A Medical Certificate must be submitted to your supervisor on the day you return to work.",
                "As an intern, you do not possess the authority to negotiate or influence company-wide decisions, such as changes to the organizational structure, budget allocations, or major strategic initiatives.",
                "Harassment of any kind, including but not limited to sexual harassment, verbal abuse, or discrimination, will not be tolerated. If you experience or witness any form of harassment during your attachment, immediately report it to your supervisor or the designated authority within the company or institution. Confidentiality and appropriate action will be ensured in addressing such complaints."
            ]
        },
        {
            icon: DollarSign,
            title: "Allowance",
            color: "bg-primary/10 text-primary",
            items: [
                "The provision of an allowance by the company you are attached to is not guaranteed, unless specifically mentioned in your Placement Notice.",
                "It is important to note that the allowance provided does not directly correspond to the productivity of your work. It is primarily intended as an out-of-pocket allowance.",
                "In the event that the company fails to fulfil any officially agreed-upon arrangements at the conclusion of your attachment, please contact the designated person-in-charge within the IAP company or institution to address and resolve such matters.",
                "If you encounter any difficulties or issues with your IAP company that you are unable to resolve independently, please consult your LO for assistance."
            ]
        },
        {
            icon: AlertTriangle,
            title: "Accident",
            color: "bg-primary/10 text-primary",
            items: [
                "Ensuring safety for yourself and others involved is of utmost importance. In the event of any injuries or hazards, promptly seek medical assistance or contact emergency services.",
                "It is crucial to inform your supervisor at the IAP site about any accidents that occur, providing accurate details of the incident, including the date, time, location, and a description of what transpired.",
                "Please be aware that you are covered under the RCA student's Accident Insurance Policy. If you require any necessary assistance, consult your IAP coordinator to ensure that you receive the appropriate support."
            ]
        },
        {
            icon: BookOpen,
            title: "Log book",
            color: "bg-primary/10 text-primary",
            items: [
                "Please read the instructions given in this Log Book as well as those written on the forms before completing them. If in doubt, please consult your LO.",
                "At the end of each day, take some time to reflect on your activities and write down a detailed account of what you worked on, including tasks, projects, meetings, and any notable accomplishments or challenges.",
                "Use clear and concise language when describing your activities, focusing on key points and outcomes rather than excessive detail.",
                "Treat your log book as a valuable resource for self-reflection and future reference, as it can help you track your progress, identify areas for growth, and serve as supporting evidence for any reports, presentations, or evaluations related to your IAP."
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
                                IAP Instructions
                            </h1>
                            <p className="text-lg md:text-xl text-primary leading-relaxed">
                                Essential instructions and guidelines to ensure a successful and professional internship experience.
                            </p>
                        </motion.div>
                    </div>

                    {/* Instructions Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {sections.map((section, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="bg-white rounded-2xl shadow-md border border-primary/20 hover:border-primary hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                <div className={`${section.color} p-6 flex items-center gap-4`}>
                                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <section.icon className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-primary">{section.title}</h2>
                                </div>
                                
                                <div className="p-6">
                                    {section.content ? (
                                        <p className="text-primary leading-relaxed">{section.content}</p>
                                    ) : (
                                        <ul className="space-y-4">
                                            {section.items?.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
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

                    {/* Important Notice */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20"
                    >
                        <div className="flex items-start gap-4">
                            <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold text-primary mb-2">Important Notice</h3>
                                <p className="text-primary leading-relaxed">
                                    Please ensure you read and understand all instructions carefully. If you have any questions or concerns, 
                                    do not hesitate to contact your Liaison Officer (LO) or the IAP coordinator for clarification.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
