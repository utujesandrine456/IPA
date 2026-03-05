"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Plus, Loader2, FileText, CheckSquare, MessageSquare,
    Star, Building2, User, Calendar, ChevronDown,
    ChevronUp, Download, CheckCircle2, AlertCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast, Toaster } from "react-hot-toast";
import DOMPurify from "dompurify";

// Type definitions
const sanitize = (html: string) => ({ __html: DOMPurify.sanitize(html) });

// Subcomponents
function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-4 group">
            <label className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/20 group-hover:text-primary transition-colors duration-700">{label}</label>
            <div className="h-16 w-full rounded-2.5xl bg-primary/2 border border-primary/5 flex items-center px-6 text-sm font-black text-primary shadow-sm hover:bg-primary/5 transition-all duration-700">
                {value || "—"}
            </div>
        </div>
    );
}

function LogbookInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div className="space-y-4 group">
            <label className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/20 group-hover:text-primary transition-colors duration-700">{label}</label>
            <input
                type={type}
                className="h-16 w-full rounded-2.5xl border-2 border-primary/5 bg-white px-8 text-sm font-black text-primary focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all duration-700 shadow-sm outline-none"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isApproved = status === "APPROVED";
    return (
        <div className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm flex items-center gap-3 transition-all duration-700 ${isApproved ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
            <div className={`h-2 w-2 rounded-full ${isApproved ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
            {status}
        </div>
    );
}

function SurveyButton({ label, active, onClick, onDecline }: { label: string; active?: boolean; onClick: () => void; onDecline: () => void }) {
    return (
        <div className="flex flex-col gap-8 group">
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/20 text-center group-hover:text-primary transition-colors duration-700">{label}</span>
            <div className="flex gap-6">
                <button
                    onClick={onClick}
                    className={`flex-1 h-20 rounded-4xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 border-4 ${active === true ? 'bg-primary border-primary text-white shadow-3xl shadow-primary/30 scale-105' : 'bg-white border-primary/5 text-primary/20 hover:border-primary/20 hover:text-primary'}`}
                >Confirm</button>
                <button
                    onClick={onDecline}
                    className={`flex-1 h-20 rounded-4xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 border-4 ${active === false ? 'bg-red-500 border-red-500 text-white shadow-3xl shadow-red-200 scale-105' : 'bg-white border-primary/5 text-primary/20 hover:border-red-400 hover:text-red-500'}`}
                >Decline</button>
            </div>
        </div>
    );
}
interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    date: string;
    submissionContent?: string;
    rating?: number;
    comments?: { id: number; content: string; createdAt: string }[];
}

interface WeeklyLog {
    id?: number;
    weekNumber: number;
    startDate: string;
    endDate: string;
    mondayTask?: string; mondayHours?: number;
    tuesdayTask?: string; tuesdayHours?: number;
    wednesdayTask?: string; wednesdayHours?: number;
    thursdayTask?: string; thursdayHours?: number;
    fridayTask?: string; fridayHours?: number;
    totalHours?: number;
    generalStatement?: string;
    grade?: 'A' | 'B' | 'C' | 'D' | 'E';
    supervisorName?: string;
    supervisorDate?: string;
    supervisorSignature?: boolean;
}

interface IapReport {
    isUseful?: boolean;
    improvedUnderstanding?: boolean;
    providedExperiences?: boolean;
    programmeTypes: string[];
    otherProgrammeDetails?: string;
    satisfactionIndustry?: 'Excellent' | 'Average' | 'Poor';
    satisfactionMajor?: 'Excellent' | 'Average' | 'Poor';
    satisfactionPractical?: 'Excellent' | 'Average' | 'Poor';
    satisfactionInstructors?: 'Excellent' | 'Average' | 'Poor';
    notableAchievements?: string;
    futureCareerPlan?: string;
    suggestions?: string;
}

export default function StudentLogbookPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [user, setUser] = useState<any>(null);
    const [student, setStudent] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
    const [report, setReport] = useState<IapReport>({ programmeTypes: [] });

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

    const steps = [
        { id: 1, title: "Identity & Objectives", icon: User },
        { id: 2, title: "Placement Details", icon: Building2 },
        { id: 3, title: "Weekly Engagement", icon: Calendar },
        { id: 4, title: "Result Report", icon: FileText },
        { id: 5, title: "Assessment Vault", icon: CheckSquare }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const storedUserRaw = localStorage.getItem("user");
            if (!storedUserRaw || storedUserRaw === "{}") {
                toast.error("Session trace lost. Please re-authenticate.");
                window.location.href = "/login";
                return;
            }

            const storedUser = JSON.parse(storedUserRaw);
            const studentId = storedUser.studentProfile?.id || storedUser.id;

            if (!studentId) {
                toast.error("Profile synchronization error. Redirecting...");
                window.location.href = "/login";
                return;
            }

            setUser(storedUser);

            const [studentData, tasksData, weeklyData, reportData] = await Promise.all([
                apiFetch(`/students/${studentId}`),
                apiFetch(`/tasks?studentId=${studentId}`),
                apiFetch(`/weekly-logs?studentId=${studentId}`),
                apiFetch(`/iap-reports?studentId=${studentId}`)
            ]);

            setStudent(studentData);
            setTasks(tasksData.tasks || []);
            setWeeklyLogs(weeklyData.logs || []);
            if (reportData) setReport(reportData);
        } catch (error) {
            toast.error("Failed to synchronize with server");
        } finally {
            setLoading(false);
        }
    };

    const calculateWeeks = () => {
        if (!student?.internshipStart || !student?.internshipEnd) return [];
        const start = new Date(student.internshipStart);
        const end = new Date(student.internshipEnd);
        const diff = end.getTime() - start.getTime();
        const weeksCount = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
        return Array.from({ length: Math.max(1, weeksCount) }, (_, i) => i + 1);
    };

    const generatedWeeks = calculateWeeks();

    const handleSaveStudentInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiFetch(`/students/${student.id}`, {
                method: "PATCH",
                body: JSON.stringify(student)
            });
            toast.success("Profile records updated");
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveWeeklyLog = async (log: WeeklyLog) => {
        setIsSaving(true);
        try {
            await apiFetch("/weekly-logs", {
                method: "POST",
                body: JSON.stringify({ ...log, studentId: student.id })
            });
            toast.success(`Week ${log.weekNumber} activity synced`);
            fetchData();
        } catch (error) {
            toast.error("Synchronization failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveReport = async () => {
        setIsSaving(true);
        try {
            await apiFetch("/iap-reports", {
                method: "POST",
                body: JSON.stringify({ ...report, studentId: student.id })
            });
            toast.success("Final report encrypted and saved");
        } catch (error) {
            toast.error("Analysis save failed");
        } finally {
            setIsSaving(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF() as any;
        const bodyColor = [26, 38, 74];
        const secondaryColor = [240, 244, 255];

        // Header
        doc.setFontSize(24);
        doc.setTextColor(26, 38, 74);
        doc.text("INDUSTRIAL ATTACHMENT LOGBOOK", 105, 25, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Official Technical Report Generation System", 105, 32, { align: "center" });

        doc.setDrawColor(230, 230, 230);
        doc.line(20, 38, 190, 38);

        // Section 1: Student Details
        doc.setFontSize(14);
        doc.setTextColor(26, 38, 74);
        doc.text("1. Student Information", 20, 50);
        doc.autoTable({
            startY: 55,
            head: [['Field', 'Details']],
            body: [
                ['Name of Student', student?.fullName || 'N/A'],
                ['Date of Birth', student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'],
                ['Reg No.', student?.studentNumber || 'N/A'],
                ['ID/Passport No.', student?.idOrPassport || 'N/A'],
                ['Cell Phone No.', student?.phone || 'N/A'],
                ['Email', student?.email || 'N/A'],
            ],
            theme: 'grid',
            headStyles: { fillColor: bodyColor, cellPadding: 4 },
            styles: { cellPadding: 3, fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
        });

        // Section 2: Company Details
        const finalY1 = (doc as any).lastAutoTable.finalY || 55;
        doc.text("2. Placement Details", 20, finalY1 + 15);
        doc.autoTable({
            startY: finalY1 + 20,
            head: [['Field', 'Organization Details']],
            body: [
                ['Name', student?.companyName || 'N/A'],
                ['Address/Location', student?.companyAddress || 'N/A'],
                ['P.O.Box', student?.companyPOBox || 'N/A'],
                ['Tel No.', student?.companyPhone || 'N/A'],
                ['Email', student?.companyEmail || 'N/A'],
            ],
            theme: 'grid',
            headStyles: { fillColor: bodyColor, cellPadding: 4 },
            styles: { cellPadding: 3, fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
        });

        // Section 3: Professional Oversight (Supervisor)
        const finalY2 = (doc as any).lastAutoTable.finalY || 120;
        doc.text("3. Professional Oversight", 20, finalY2 + 15);
        doc.autoTable({
            startY: finalY2 + 20,
            head: [['Field', 'Supervisor Details']],
            body: [
                ['IAP Company Supervisor Name', student?.supervisorName || 'N/A'],
                ['Designation/Title', student?.supervisorDesignation || 'N/A'],
                ['Tel No.', student?.supervisorPhone || 'N/A'],
                ['Email', student?.supervisorEmail || 'N/A'],
            ],
            theme: 'grid',
            headStyles: { fillColor: bodyColor, cellPadding: 4 },
            styles: { cellPadding: 3, fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
        });

        // Section 4: Engagement Logs
        doc.addPage();
        doc.text("4. Detailed Weekly Engagement Logs", 20, 20);

        weeklyLogs.sort((a, b) => a.weekNumber - b.weekNumber).forEach((log) => {
            const start = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 25;
            if (start > 230) doc.addPage();

            const currentStart = (doc as any).lastAutoTable?.finalY && start <= 230 ? start : 25;

            doc.setFontSize(12);
            doc.setTextColor(26, 38, 74);
            doc.text(`Week ${log.weekNumber}`, 20, currentStart);

            doc.autoTable({
                startY: currentStart + 5,
                head: [['Work Day', 'Technical Activities & Tasks Performed', 'Duration']],
                body: [
                    ['Monday', log.mondayTask || 'No tasks recorded', `${log.mondayHours || 0} Hrs`],
                    ['Tuesday', log.tuesdayTask || 'No tasks recorded', `${log.tuesdayHours || 0} Hrs`],
                    ['Wednesday', log.wednesdayTask || 'No tasks recorded', `${log.wednesdayHours || 0} Hrs`],
                    ['Thursday', log.thursdayTask || 'No tasks recorded', `${log.thursdayHours || 0} Hrs`],
                    ['Friday', log.fridayTask || 'No tasks recorded', `${log.fridayHours || 0} Hrs`],
                ],
                theme: 'striped',
                headStyles: { fillColor: [40, 44, 52] },
                styles: { fontSize: 9 },
                columnStyles: { 2: { halign: 'center', width: 25 } }
            });

            const nextY = (doc as any).lastAutoTable.finalY;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text("Weekly Assessment Statement:", 20, nextY + 8);
            doc.setTextColor(26, 38, 74);
            const splitText = doc.splitTextToSize(log.generalStatement || "No overall statement provided for this week.", 170);
            doc.text(splitText, 25, nextY + 15);
            (doc as any).lastAutoTable.finalY = nextY + 15 + (splitText.length * 5);
        });

        // Final Assessment Survey
        doc.addPage();
        doc.setFontSize(14);
        doc.text("4. End-of-Program Assessment", 20, 20);
        doc.autoTable({
            startY: 25,
            head: [['Evaluation Criteria', 'Response Status']],
            body: [
                ['Did you find the IAP useful and relevant to your studies?', report.isUseful ? 'CONFIRMED' : 'NEGATIVE'],
                ['Has it improved your understanding of technical concepts?', report.improvedUnderstanding ? 'CONFIRMED' : 'NEGATIVE'],
                ['Has it provided experiences you would not have gained in university?', report.providedExperiences ? 'CONFIRMED' : 'NEGATIVE'],
                ['Activities participated in during the program', report.programmeTypes.join(', ') || 'None specified'],
            ],
            theme: 'grid',
            headStyles: { fillColor: bodyColor },
            styles: { fontSize: 10 }
        });

        doc.save(`IAP_Technical_Logbook_${student?.studentNumber}.pdf`);
        toast.success("Standardized PDF generated");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-16 w-16 border-4 border-primary/10 border-t-primary rounded-full"
                />
                <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Decrypting Student Archives</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <Toaster position="top-right" />

            {/* Multi-Step Registry Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-12 rounded-4xl border border-primary/5 shadow-2xl shadow-primary/2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Industrial Attachment Portfolio</span>
                    </div>
                    <h1 className="text-6xl font-black text-primary font-heading tracking-tighter leading-none">IAP <span className="text-primary/20 italic">Registry</span></h1>
                    <p className="text-primary/60 font-medium mt-3 text-lg leading-relaxed">Official documentation system for professional internship placement.</p>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <Button
                        onClick={generatePDF}
                        className="rounded-full bg-primary hover:bg-black text-white px-12 h-16 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Download className="h-5 w-5 mr-3" /> Print Report
                    </Button>
                </div>
            </div>

            {/* Step Progress Matrix */}
            <div className="grid grid-cols-5 gap-4 p-3 bg-primary/2 rounded-4xl border border-primary/5">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`
                            relative flex flex-col items-center gap-3 py-6 px-4 rounded-3.5xl transition-all duration-700
                            ${currentStep === step.id
                                ? "bg-white text-primary shadow-2xl shadow-primary/5 scale-[1.03] ring-1 ring-primary/5"
                                : currentStep > step.id
                                    ? "text-primary/60 cursor-pointer hover:bg-white/40"
                                    : "text-primary/20 bg-transparent"
                            }
                        `}
                        onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                    >
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-700 ${currentStep >= step.id ? 'bg-primary text-white' : 'bg-primary/5 text-primary/20'}`}>
                            <step.icon className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center hidden md:block">{step.title}</span>
                        {currentStep > step.id && (
                            <div className="absolute top-4 right-4 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Viewport Animation Wrapper */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 30, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.98 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    {currentStep === 1 && (
                        <div className="space-y-10">
                            <Card className="rounded-4xl border-primary/5 shadow-2xl shadow-primary/2 overflow-hidden bg-white">
                                <CardHeader className="bg-primary/2 border-b border-primary/5 p-12">
                                    <div className="flex items-center gap-4 text-primary">
                                        <User className="h-7 w-7" />
                                        <CardTitle className="font-black uppercase tracking-[0.3em] text-xs underline underline-offset-8 decoration-2 decoration-primary/20">Student details</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-12 space-y-10">
                                    <div className="grid md:grid-cols-2 gap-10">
                                        <Field label="Name of Student" value={student?.fullName} />
                                        <LogbookInput
                                            label="Date of Birth"
                                            type="date"
                                            value={student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ""}
                                            onChange={v => setStudent({ ...student, dateOfBirth: v })}
                                        />
                                        <Field label="ID/Passport No." value={student?.idOrPassport} />
                                        <Field label="Reg No." value={student?.studentNumber} />
                                        <Field label="Cell Phone No." value={student?.phone} />
                                        <div className="grid grid-cols-2 gap-8">
                                            <LogbookInput
                                                label="From"
                                                type="date"
                                                value={student?.internshipStart ? new Date(student.internshipStart).toISOString().split('T')[0] : ""}
                                                onChange={v => setStudent({ ...student, internshipStart: v })}
                                            />
                                            <LogbookInput
                                                label="To"
                                                type="date"
                                                value={student?.internshipEnd ? new Date(student.internshipEnd).toISOString().split('T')[0] : ""}
                                                onChange={v => setStudent({ ...student, internshipEnd: v })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-8 flex justify-end">
                                        <Button onClick={() => setCurrentStep(2)} className="rounded-full font-black uppercase tracking-[0.2em] h-14 px-10 text-[10px] shadow-lg shadow-primary/10">
                                            Continue to Placement
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-4xl border-primary/5 shadow-2xl shadow-primary/2 overflow-hidden bg-white">
                                <CardHeader className="bg-primary/2 border-b border-primary/5 p-12">
                                    <div className="flex items-center gap-4 text-primary">
                                        <Star className="h-7 w-7" />
                                        <CardTitle className="font-black uppercase tracking-[0.3em] text-xs underline underline-offset-8 decoration-2 decoration-primary/20">IAP Objectives</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-12 space-y-6">
                                    {[
                                        "To develop students and enhance their range of skills that are valuable for future careers, including technical skills and transferable skills such as communication, problem-solving, critical thinking, teamwork, adaptability, and time management.",
                                        "To expose students to the industry they are interested in or studying, allowing them to gain a deeper understanding of industry practices, trends, challenges, and opportunities.",
                                        "Opportunity for students to build professional networks and establish connections with industry professionals, facilitating future job opportunities, mentorship, and valuable industry contacts.",
                                        "Students can explore their career interests and clarify their goals by experiencing a real work environment and gaining insights into different roles, industries, and work cultures.",
                                        "To foster professional growth in students, challenging them, providing new experiences, and offering feedback to develop self-confidence, resilience, adaptability, and a growth mind-set.",
                                        "To integrate academic learning with practical application, helping students understand how theoretical concepts and classroom learning align with real-world scenarios, enhancing their overall educational experience."
                                    ].map((obj, i) => (
                                        <div key={i} className="flex gap-6 items-start p-6 rounded-3xl hover:bg-primary/2 transition-colors duration-500">
                                            <div className="h-8 w-8 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-[10px] shrink-0">{i + 1}</div>
                                            <p className="text-sm font-medium text-primary/70 leading-relaxed">{obj}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-10">
                            <Card className="rounded-4xl border-primary/5 shadow-2xl shadow-primary/2 overflow-hidden bg-white">
                                <CardHeader className="bg-primary/2 border-b border-primary/5 p-12">
                                    <div className="flex items-center gap-4 text-primary">
                                        <Building2 className="h-7 w-7" />
                                        <CardTitle className="font-black uppercase tracking-[0.3em] text-xs underline underline-offset-8 decoration-2 decoration-primary/20">Company/Institution details</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-12 space-y-8">
                                    <div className="space-y-8">
                                        <LogbookInput label="Name" value={student?.companyName} onChange={v => setStudent({ ...student, companyName: v })} />
                                        <LogbookInput label="Address/Location" value={student?.companyAddress} onChange={v => setStudent({ ...student, companyAddress: v })} />
                                        <div className="grid md:grid-cols-3 gap-8">
                                            <LogbookInput label="Tel No." value={student?.companyPhone} onChange={v => setStudent({ ...student, companyPhone: v })} />
                                            <LogbookInput label="Email" value={student?.companyEmail} onChange={v => setStudent({ ...student, companyEmail: v })} />
                                            <LogbookInput label="P.O.Box" value={student?.companyPOBox} onChange={v => setStudent({ ...student, companyPOBox: v })} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-4xl border-primary/5 shadow-2xl shadow-primary/2 overflow-hidden bg-white">
                                <CardHeader className="bg-primary/2 border-b border-primary/5 p-12">
                                    <div className="flex items-center gap-4 text-primary">
                                        <Star className="h-7 w-7" />
                                        <CardTitle className="font-black uppercase tracking-[0.3em] text-xs underline underline-offset-8 decoration-2 decoration-primary/20">Supervisor details</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-12 space-y-8">
                                    <div className="space-y-8">
                                        <LogbookInput label="IAP Company Supervisor Name" value={student?.supervisorName} onChange={v => setStudent({ ...student, supervisorName: v })} />
                                        <LogbookInput label="Designation/Title" value={student?.supervisorDesignation} onChange={v => setStudent({ ...student, supervisorDesignation: v })} />
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <LogbookInput label="Tel No." value={student?.supervisorPhone} onChange={v => setStudent({ ...student, supervisorPhone: v })} />
                                            <LogbookInput label="Email" value={student?.supervisorEmail} onChange={v => setStudent({ ...student, supervisorEmail: v })} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-between items-center bg-white p-8 rounded-4xl border border-primary/5 shadow-xl">
                                <Button variant="outline" onClick={() => setCurrentStep(1)} className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[10px]">
                                    Go Back
                                </Button>
                                <Button onClick={() => { handleSaveStudentInfo({ preventDefault: () => { } } as any); setCurrentStep(3); }} className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[10px]">
                                    Initialize Weekly Logs
                                </Button>
                            </div>
                        </div>
                    )}


                    {currentStep === 3 && (
                        <div className="space-y-12">
                            {generatedWeeks.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-5xl border-4 border-dashed border-primary/5">
                                    <Calendar className="h-16 w-16 mx-auto text-primary/10 mb-6" />
                                    <p className="text-primary/40 font-black uppercase tracking-[0.2em] mb-4">Initialize Internship Dates in Step 1</p>
                                    <Button onClick={() => setCurrentStep(1)} className="rounded-full">Set Schedule</Button>
                                </div>
                            ) : (
                                <>
                                    {/* Progress Pulse (Keeping existing progress UI) */}
                                    <div className="bg-white p-10 rounded-4xl border border-primary/5 shadow-2xl shadow-primary/2">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-2xl font-black text-primary font-heading tracking-tight">Technical Engagement Pulse</h3>
                                                <p className="text-[10px] font-black uppercase text-primary/30 tracking-[0.4em] mt-1">Real-time completion analytics</p>
                                            </div>
                                            <div className="text-4xl font-black text-primary italic font-heading">
                                                {(() => {
                                                    const completed = generatedWeeks.filter(num => {
                                                        const log = weeklyLogs.find(l => l.weekNumber === num);
                                                        return log && (log.mondayTask || log.tuesdayTask || log.wednesdayTask || log.thursdayTask || log.fridayTask);
                                                    }).length;
                                                    return Math.round((completed / generatedWeeks.length) * 100);
                                                })()}%
                                            </div>
                                        </div>
                                        <div className="h-4 w-full bg-primary/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${(() => {
                                                        const completed = generatedWeeks.filter(num => {
                                                            const log = weeklyLogs.find(l => l.weekNumber === num);
                                                            return log && (log.mondayTask || log.tuesdayTask || log.wednesdayTask || log.thursdayTask || log.fridayTask);
                                                        }).length;
                                                        return Math.round((completed / generatedWeeks.length) * 100);
                                                    })()}%`
                                                }}
                                                className="h-full bg-primary shadow-[0_0_20px_rgba(26,38,74,0.3)] transition-all duration-1000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-16">
                                        {generatedWeeks.map(weekNum => {
                                            const log = weeklyLogs.find(l => l.weekNumber === weekNum) || { weekNumber: weekNum, startDate: "", endDate: "" };
                                            const isExpanded = expandedWeek === weekNum;
                                            const isCompleted = !!(log.mondayTask || log.tuesdayTask || log.wednesdayTask || log.thursdayTask || log.fridayTask);

                                            return (
                                                <motion.div
                                                    key={weekNum}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    whileInView={{ opacity: 1, scale: 1 }}
                                                    viewport={{ once: true }}
                                                >
                                                    <Card className={`rounded-5xl overflow-hidden transition-all duration-700 bg-white border-primary/10 ${isExpanded ? 'shadow-3xl shadow-primary/20 scale-[1.01]' : 'shadow-md opacity-90'}`}>
                                                        <div className="p-10 flex items-center justify-between pointer-events-none">
                                                            <div className="flex items-center gap-10">
                                                                <div className={`h-20 w-20 rounded-3.5xl ${isCompleted ? 'bg-green-500' : 'bg-primary'} text-white flex items-center justify-center font-black text-3xl italic shadow-2xl transition-colors duration-700`}>W{weekNum}</div>
                                                                <div>
                                                                    <h4 className="text-3xl font-black text-primary font-heading tracking-tight">Student Log (Week {weekNum})</h4>
                                                                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] mt-2 ${isCompleted ? 'text-green-500' : 'text-primary/30'}`}>
                                                                        From: {log.startDate || "---"} To: {log.endDate || "---"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                                                                className="rounded-full h-14 px-8 font-black uppercase tracking-widest text-[10px] border-primary/10 hover:bg-primary/5 pointer-events-auto"
                                                            >
                                                                {isExpanded ? "Close Log" : "Open Weekly Log"}
                                                            </Button>
                                                        </div>
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-primary/2 border-t border-primary/10">
                                                                    <div className="p-12 space-y-12">
                                                                        <div className="space-y-6">
                                                                            <div className="grid grid-cols-[1fr_2fr_120px] gap-8 pb-4 border-b border-primary/5 text-[9px] font-black uppercase tracking-[0.4em] text-primary/30 px-6">
                                                                                <span>Day</span>
                                                                                <span>Brief description of tasks</span>
                                                                                <span>Working hours</span>
                                                                            </div>
                                                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                                                                const dayKey = day.toLowerCase();
                                                                                return (
                                                                                    <div key={day} className="grid grid-cols-[1fr_2fr_120px] gap-8 items-center bg-white p-6 rounded-3.5xl shadow-sm border border-primary/5">
                                                                                        <span className="text-xs font-black text-primary uppercase">{day.substring(0, 3)}</span>
                                                                                        <textarea
                                                                                            className="w-full bg-primary/2 rounded-2.5xl p-4 text-sm font-medium outline-none min-h-[80px]"
                                                                                            placeholder="Task description..."
                                                                                            //@ts-ignore
                                                                                            value={log[`${dayKey}Task`] || ""}
                                                                                            //@ts-ignore
                                                                                            onChange={(e) => {
                                                                                                const nextLogs = [...weeklyLogs];
                                                                                                const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
                                                                                                const ent = idx >= 0 ? { ...nextLogs[idx] } : { ...log };
                                                                                                //@ts-ignore
                                                                                                ent[`${dayKey}Task`] = e.target.value;
                                                                                                if (idx >= 0) nextLogs[idx] = ent; else nextLogs.push(ent);
                                                                                                setWeeklyLogs(nextLogs);
                                                                                            }}
                                                                                        />
                                                                                        <input
                                                                                            type="number"
                                                                                            className="w-full h-12 bg-primary/5 rounded-2xl text-center font-black text-primary text-sm outline-none focus:ring-4 focus:ring-primary/5"
                                                                                            //@ts-ignore
                                                                                            value={log[`${dayKey}Hours`] || ""}
                                                                                            //@ts-ignore
                                                                                            onChange={(e) => {
                                                                                                const nextLogs = [...weeklyLogs];
                                                                                                const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
                                                                                                const ent = idx >= 0 ? { ...nextLogs[idx] } : { ...log };
                                                                                                //@ts-ignore
                                                                                                ent[`${dayKey}Hours`] = parseFloat(e.target.value) || 0;
                                                                                                if (idx >= 0) nextLogs[idx] = ent; else nextLogs.push(ent);
                                                                                                setWeeklyLogs(nextLogs);
                                                                                            }}
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>

                                                                        <div className="bg-white p-10 rounded-4xl border border-primary/5 space-y-8">
                                                                            <div className="flex justify-between items-center px-4">
                                                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Total hours per week:</span>
                                                                                <span className="text-2xl font-black text-primary">{(() => {
                                                                                    return (log.mondayHours || 0) + (log.tuesdayHours || 0) + (log.wednesdayHours || 0) + (log.thursdayHours || 0) + (log.fridayHours || 0);
                                                                                })()} Hrs</span>
                                                                            </div>

                                                                            <div className="space-y-4">
                                                                                <label className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/30 px-4">Student’s General Statement on Attachment</label>
                                                                                <textarea
                                                                                    className="w-full p-8 rounded-3.5xl bg-primary/2 text-sm italic font-medium leading-relaxed outline-none min-h-[120px]"
                                                                                    placeholder="Enter your summary statement for this week..."
                                                                                    value={log.generalStatement || ""}
                                                                                    onChange={e => {
                                                                                        const nextLogs = [...weeklyLogs];
                                                                                        const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
                                                                                        const ent = idx >= 0 ? { ...nextLogs[idx] } : { ...log };
                                                                                        ent.generalStatement = e.target.value;
                                                                                        if (idx >= 0) nextLogs[idx] = ent; else nextLogs.push(ent);
                                                                                        setWeeklyLogs(nextLogs);
                                                                                    }}
                                                                                />
                                                                            </div>

                                                                            <div className="pt-6 border-t border-primary/5 grid md:grid-cols-2 gap-10">
                                                                                <div className="space-y-6">
                                                                                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/30 px-4">Supervisor Assessment Grade</label>
                                                                                    <div className="flex gap-4">
                                                                                        {['A', 'B', 'C', 'D', 'E'].map(g => (
                                                                                            <button
                                                                                                key={g}
                                                                                                onClick={() => {
                                                                                                    const nextLogs = [...weeklyLogs];
                                                                                                    const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
                                                                                                    const ent = idx >= 0 ? { ...nextLogs[idx] } : { ...log };
                                                                                                    ent.grade = g as any;
                                                                                                    if (idx >= 0) nextLogs[idx] = ent; else nextLogs.push(ent);
                                                                                                    setWeeklyLogs(nextLogs);
                                                                                                }}
                                                                                                className={`h-12 w-12 rounded-2xl font-black text-xs transition-all duration-500 border-2 ${log.grade === g ? 'bg-primary border-primary text-white shadow-lg scale-110' : 'bg-primary/2 border-transparent text-primary/40 hover:bg-primary/10'}`}
                                                                                            >
                                                                                                {g}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                                                                        <LogbookInput label="Supervisor Name" value={log.supervisorName || ""} onChange={v => {
                                                                                            const nextLogs = [...weeklyLogs];
                                                                                            const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
                                                                                            const ent = idx >= 0 ? { ...nextLogs[idx] } : { ...log };
                                                                                            ent.supervisorName = v;
                                                                                            if (idx >= 0) nextLogs[idx] = ent; else nextLogs.push(ent);
                                                                                            setWeeklyLogs(nextLogs);
                                                                                        }} />
                                                                                        <LogbookInput label="Date" type="date" value={log.supervisorDate || ""} onChange={v => {
                                                                                            const nextLogs = [...weeklyLogs];
                                                                                            const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
                                                                                            const ent = idx >= 0 ? { ...nextLogs[idx] } : { ...log };
                                                                                            ent.supervisorDate = v;
                                                                                            if (idx >= 0) nextLogs[idx] = ent; else nextLogs.push(ent);
                                                                                            setWeeklyLogs(nextLogs);
                                                                                        }} />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col justify-end gap-6">
                                                                                    <Button onClick={() => handleSaveWeeklyLog(log)} disabled={isSaving} className="w-full rounded-2.5xl h-20 font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-primary/20">
                                                                                        {isSaving ? "Syncing Milestone..." : "Synchronize Weekly Log"}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-8 rounded-4xl border border-primary/5 shadow-xl mt-12">
                                        <Button variant="outline" onClick={() => setCurrentStep(2)} className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[10px]">
                                            Back to Placement
                                        </Button>
                                        <Button onClick={() => setCurrentStep(4)} className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[10px]">
                                            Continue to Result Report
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <Card className="rounded-5xl border-primary/5 shadow-3xl shadow-primary/5 overflow-hidden bg-white">
                            <CardHeader className="p-16 bg-primary/2 border-b border-primary/10 relative">
                                <div className="absolute top-10 right-16 px-6 py-2 bg-primary rounded-full text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20">Official Evaluation</div>
                                <h2 className="text-5xl font-black text-primary font-heading tracking-tighter">Industrial Attachment <span className="text-primary/30 italic">Result Report</span></h2>
                                <p className="text-primary/60 font-medium text-xl mt-4 max-w-2xl">Satisfaction survey and professional outcomes assessment.</p>
                            </CardHeader>
                            <CardContent className="p-16 space-y-20">
                                <div className="grid md:grid-cols-3 gap-12">
                                    <SurveyButton label="IAP useful & relevant?" active={report.isUseful} onClick={() => setReport({ ...report, isUseful: true })} onDecline={() => setReport({ ...report, isUseful: false })} />
                                    <SurveyButton label="Improved understanding?" active={report.improvedUnderstanding} onClick={() => setReport({ ...report, improvedUnderstanding: true })} onDecline={() => setReport({ ...report, improvedUnderstanding: false })} />
                                    <SurveyButton label="New experiences gained?" active={report.providedExperiences} onClick={() => setReport({ ...report, providedExperiences: true })} onDecline={() => setReport({ ...report, providedExperiences: false })} />
                                </div>

                                <div className="space-y-12">
                                    <div className="flex items-center gap-8"><h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/20">Satisfaction Rating</h4><div className="h-px bg-primary/10 flex-1" /></div>
                                    <div className="grid md:grid-cols-2 gap-10">
                                        {[
                                            { label: "The Industry", key: "satisfactionIndustry" },
                                            { label: "Course Major", key: "satisfactionMajor" },
                                            { label: "Practical Training", key: "satisfactionPractical" },
                                            { label: "Instructors", key: "satisfactionInstructors" }
                                        ].map(item => (
                                            <div key={item.key} className="flex flex-col gap-4">
                                                <span className="text-sm font-black text-primary/60 uppercase tracking-wider">{item.label}</span>
                                                <div className="flex gap-3">
                                                    {['Excellent', 'Average', 'Poor'].map(rating => (
                                                        <button
                                                            key={rating}
                                                            //@ts-ignore
                                                            onClick={() => setReport({ ...report, [item.key]: rating })}
                                                            //@ts-ignore
                                                            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${report[item.key] === rating ? 'bg-primary text-white shadow-lg' : 'bg-primary/5 text-primary/40 hover:bg-primary/10'}`}
                                                        >
                                                            {rating}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <LogbookInput label="Notable achievement during attachment" value={report.notableAchievements || ""} onChange={v => setReport({ ...report, notableAchievements: v })} />
                                    <LogbookInput label="Future career plan" value={report.futureCareerPlan || ""} onChange={v => setReport({ ...report, futureCareerPlan: v })} />
                                    <LogbookInput label="Suggestions to improve IAP" value={report.suggestions || ""} onChange={v => setReport({ ...report, suggestions: v })} />
                                </div>

                                <div className="pt-16 border-t border-primary/5 flex justify-between">
                                    <Button variant="outline" onClick={() => setCurrentStep(3)} className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[10px]">
                                        Back to Logs
                                    </Button>
                                    <Button onClick={() => { handleSaveReport(); setCurrentStep(5); }} className="rounded-full bg-primary text-white font-black uppercase h-20 px-20 tracking-[0.4em] text-xs">
                                        Save & Final Assessment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-10">
                            <Card className="rounded-5xl border-primary/5 shadow-3xl shadow-primary/5 overflow-hidden bg-white">
                                <CardHeader className="p-16 bg-primary/2 border-b border-primary/10">
                                    <h2 className="text-5xl font-black text-primary font-heading tracking-tighter">Student's <span className="text-primary/30 italic">Report Form</span></h2>
                                    <p className="text-primary/60 font-medium text-xl mt-4">Mark technical activities participated in during the program.</p>
                                </CardHeader>
                                <CardContent className="p-16 space-y-12">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {['Workshop', 'Fieldwork', 'Office Work', 'Production', 'Maintenance', 'Research', 'Design', 'Other'].map(item => (
                                            <label key={item} className={`flex items-center gap-5 p-8 rounded-4xl border-4 cursor-pointer transition-all duration-700 ${report.programmeTypes.includes(item) ? 'bg-primary border-primary text-white shadow-3xl' : 'bg-primary/2 border-transparent text-primary/30 hover:border-primary/10'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={report.programmeTypes.includes(item)}
                                                    onChange={(e) => {
                                                        const newTypes = e.target.checked
                                                            ? [...report.programmeTypes, item]
                                                            : report.programmeTypes.filter(t => t !== item);
                                                        setReport({ ...report, programmeTypes: newTypes });
                                                    }}
                                                />
                                                <span className="text-lg font-black uppercase tracking-tighter">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {report.programmeTypes.includes('Other') && (
                                        <div className="pt-6 animate-in slide-in-from-top-4 duration-500">
                                            <LogbookInput label="If other, please specify" value={report.otherProgrammeDetails || ""} onChange={v => setReport({ ...report, otherProgrammeDetails: v })} />
                                        </div>
                                    )}

                                    <div className="pt-20 flex flex-col items-center gap-12 border-t border-primary/5">
                                        <div className="text-center space-y-4">
                                            <h3 className="text-4xl font-black text-primary font-heading tracking-tight">Finalized Industrial Attachment Stream</h3>
                                            <p className="text-primary/40 text-lg">All professional benchmarks have been synchronized.</p>
                                        </div>
                                        <Button
                                            onClick={generatePDF}
                                            className="rounded-full bg-primary text-white px-24 h-24 font-black uppercase tracking-[0.6em] text-sm shadow-3xl hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <Download className="h-7 w-7 mr-6" /> Produce Official Portfolio
                                        </Button>
                                        <Button variant="ghost" onClick={() => setCurrentStep(4)} className="text-[10px] font-black uppercase tracking-widest text-primary/30">
                                            Revise Survey
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
