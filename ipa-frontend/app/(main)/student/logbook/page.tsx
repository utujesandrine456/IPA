"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Plus, Loader2, FileText, CheckSquare, MessageSquare,
    Star, Building2, User, Calendar, ChevronDown,
    ChevronUp, Download, CheckCircle2, AlertCircle,
    ShieldCheck, LockKeyhole
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast, Toaster } from "react-hot-toast";
import DOMPurify from "dompurify";

const sanitize = (html: string) => ({ __html: DOMPurify.sanitize(html) });

// Subcomponents
function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-semibold text-slate-500 group-hover:text-primary transition-colors">{label}</label>
            <div className="h-12 w-full rounded-lg bg-white border border-slate-200 flex items-center px-4 text-sm font-medium text-slate-800 shadow-sm transition-all group-hover:border-primary/30">
                {value || "—"}
            </div>
        </div>
    );
}

function LogbookInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-semibold text-slate-500 group-hover:text-primary transition-colors">{label}</label>
            <input
                type={type}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm outline-none"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isApproved = status === "APPROVED";
    return (
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 transition-all ${isApproved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${isApproved ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
            {status}
        </div>
    );
}

function SurveyButton({ label, active, onClick, onDecline }: { label: string; active?: boolean; onClick: () => void; onDecline: () => void }) {
    return (
        <div className="flex flex-col gap-3 group">
            <span className="text-xs font-semibold text-slate-500 text-center group-hover:text-primary transition-colors">{label}</span>
            <div className="flex gap-3">
                <button
                    onClick={onClick}
                    className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all border-2 ${active === true ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-primary/50 hover:text-primary'}`}
                >Yes</button>
                <button
                    onClick={onDecline}
                    className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all border-2 ${active === false ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-500'}`}
                >No</button>
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

// FIX 1: index signature first, startDate/endDate optional
interface WeeklyLog {
    [key: string]: any;
    id?: number;
    weekNumber: number;
    studentId?: number;
    startDate?: string;
    endDate?: string;
    mondayTask?: string;
    mondayHours?: number;
    tuesdayTask?: string;
    tuesdayHours?: number;
    wednesdayTask?: string;
    wednesdayHours?: number;
    thursdayTask?: string;
    thursdayHours?: number;
    fridayTask?: string;
    fridayHours?: number;
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
        { id: 1, title: "Guidelines", icon: FileText },
        { id: 2, title: "Details & Attendance", icon: User },
        { id: 3, title: "Weekly Logs", icon: Calendar },
        { id: 4, title: "Result Report", icon: Building2 },
        { id: 5, title: "Assessment Vault", icon: CheckSquare }
    ];

    // FIX 2: explicit return type + fully-typed baseLog with all required fields
    const getSafeLog = (weekNum: number): WeeklyLog => {
        const weekData = generatedWeeksList.find(w => w.number === weekNum);
        const existing = weeklyLogs.find(l => l.weekNumber === weekNum);

        const baseLog: WeeklyLog = {
            weekNumber: weekNum,
            studentId: student?.id ?? 0,
            startDate: weekData?.start ?? "",
            endDate: weekData?.end ?? "",
            mondayTask: "",
            mondayHours: 0,
            tuesdayTask: "",
            tuesdayHours: 0,
            wednesdayTask: "",
            wednesdayHours: 0,
            thursdayTask: "",
            thursdayHours: 0,
            fridayTask: "",
            fridayHours: 0,
            totalHours: 0,
            generalStatement: "",
            supervisorSignature: false,
            supervisorName: "",
            supervisorDate: "",
        };

        return existing ? { ...baseLog, ...existing } : baseLog;
    };

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

            console.log("Fetching data for studentId:", studentId);

            try {
                const studentData = await apiFetch(`/students/${studentId}`);
                setStudent(studentData);
            } catch (e) {
                console.error("Error fetching student:", e);
                toast.error("Failed to load profile details");
            }

            try {
                const tasksData = await apiFetch(`/tasks?studentId=${studentId}`);
                setTasks(tasksData.tasks || []);
            } catch (e) {
                console.error("Error fetching tasks:", e);
            }

            try {
                const weeklyData = await apiFetch(`/weekly-logs?studentId=${studentId}`);
                setWeeklyLogs(weeklyData.logs || []);
            } catch (e) {
                console.error("Error fetching weekly logs:", e);
            }

            try {
                const reportData = await apiFetch(`/iap-reports?studentId=${studentId}`);
                if (reportData) setReport(reportData);
            } catch (e) {
                console.warn("No prior report found or fetch failed");
            }

        } catch (error) {
            console.error("General sync error:", error);
            toast.error("Failed to synchronize with server");
        } finally {
            setLoading(false);
        }
    };

    const calculateWeeks = () => {
        if (!student?.internshipStart || !student?.internshipEnd) return [];
        const start = new Date(student.internshipStart);
        const end = new Date(student.internshipEnd);

        const firstMonday = new Date(start);
        while (firstMonday.getDay() !== 1) {
            firstMonday.setDate(firstMonday.getDate() + 1);
        }

        const weeks: { number: number; start: string; end: string }[] = [];
        let currentMonday = new Date(firstMonday);
        let weekNum = 1;

        while (currentMonday < end) {
            const currentFriday = new Date(currentMonday);
            currentFriday.setDate(currentFriday.getDate() + 4);

            weeks.push({
                number: weekNum++,
                start: currentMonday.toISOString().split('T')[0],
                end: currentFriday.toISOString().split('T')[0]
            });

            currentMonday.setDate(currentMonday.getDate() + 7);
        }
        return weeks;
    };

    const generatedWeeksList = calculateWeeks();

    const handleSaveStudentInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiFetch(`/students/${student.id}`, {
                method: "PATCH",
                body: JSON.stringify(student)
            });
            toast.success("Profile records updated");
            // Refresh data to ensure internships dates are updated in the UI
            fetchData();
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
        const primaryColor = [26, 38, 74];

        // PAGE 1: COVER
        doc.setFillColor(250, 248, 240);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(2);
        doc.rect(10, 10, 190, 277);
        doc.setFontSize(28);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("INDUSTRIAL ATTACHMENT", 105, 80, { align: "center" });
        doc.setFontSize(36);
        doc.text("LOGBOOK", 105, 100, { align: "center" });
        doc.setFontSize(16);
        doc.text(student?.fullName?.toUpperCase() || "STUDENT NAME", 105, 150, { align: "center" });
        doc.setFontSize(14);
        doc.text(`Reg No: ${student?.studentNumber || "N/A"}`, 105, 160, { align: "center" });
        doc.setFontSize(12);
        doc.text("Professional Internship Portfolio", 105, 250, { align: "center" });

        // PAGE 2: STUDENT & COMPANY DETAILS
        doc.addPage();
        doc.setFillColor(250, 248, 240);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setFontSize(18);
        doc.text("Student Information", 20, 30);
        doc.autoTable({
            startY: 35,
            body: [
                ['Full Name', student?.fullName || 'N/A'],
                ['Student Number', student?.studentNumber || 'N/A'],
                ['Email', student?.email || 'N/A'],
                ['Phone', student?.phone || 'N/A'],
                ['Internship Period', `${student?.internshipStart ? new Date(student.internshipStart).toLocaleDateString() : 'N/A'} - ${student?.internshipEnd ? new Date(student.internshipEnd).toLocaleDateString() : 'N/A'}`],
            ],
            theme: 'grid',
            styles: { fillColor: [255, 255, 255], fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50, fillColor: [240, 240, 240] } }
        });

        const y2 = (doc as any).lastAutoTable.finalY + 15;
        doc.text("Placement Information", 20, y2);
        doc.autoTable({
            startY: y2 + 5,
            body: [
                ['Company Name', student?.companyName || 'N/A'],
                ['Address', student?.companyAddress || 'N/A'],
                ['Supervisor', student?.supervisorName || 'N/A'],
                ['Supervisor Email', student?.supervisorEmail || 'N/A'],
            ],
            theme: 'grid',
            styles: { fillColor: [255, 255, 255], fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold', width: 50, fillColor: [240, 240, 240] } }
        });

        // WEEKLY LOGS
        generatedWeeksList.forEach((w) => {
            doc.addPage();
            doc.setFillColor(250, 248, 240);
            doc.rect(0, 0, 210, 297, 'F');
            doc.setFontSize(16);
            doc.text(`WEEK ${w.number} ACTIVITY LOG`, 105, 20, { align: "center" });
            doc.setFontSize(10);
            doc.text(`${new Date(w.start).toLocaleDateString()} to ${new Date(w.end).toLocaleDateString()}`, 105, 27, { align: "center" });

            const log = getSafeLog(w.number);

            doc.autoTable({
                startY: 35,
                head: [['DAY', 'NATURE OF WORK / TASKS PERFORMED', 'HRS']],
                body: [
                    ['MON', log.mondayTask || '', log.mondayHours || '0'],
                    ['TUE', log.tuesdayTask || '', log.tuesdayHours || '0'],
                    ['WED', log.wednesdayTask || '', log.wednesdayHours || '0'],
                    ['THU', log.thursdayTask || '', log.thursdayHours || '0'],
                    ['FRI', log.fridayTask || '', log.fridayHours || '0'],
                ],
                theme: 'grid',
                headStyles: { fillColor: primaryColor },
                styles: { fontSize: 9, minCellHeight: 20 },
                columnStyles: { 0: { fontStyle: 'bold', width: 15 }, 2: { width: 15, halign: 'center' } }
            });

            const ySum = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(11);
            doc.text("Weekly Summary Statement:", 20, ySum);
            doc.setFontSize(10);
            const splitSummary = doc.splitTextToSize(log.generalStatement || "No summary provided.", 170);
            doc.text(splitSummary, 20, ySum + 8);
        });

        // PAGE: RESULT REPORT
        doc.addPage();
        doc.setFillColor(250, 248, 240);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setFontSize(18);
        doc.text("Industrial Engagement Analysis", 20, 30);

        doc.autoTable({
            startY: 40,
            body: [
                ['Was the IAP useful?', report.isUseful ? 'YES' : 'NO'],
                ['Improved understanding of theory?', report.improvedUnderstanding ? 'YES' : 'NO'],
                ['Provided practical experiences?', report.providedExperiences ? 'YES' : 'NO'],
            ],
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 5 }
        });

        const yAchievement = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text("Notable Achievements:", 20, yAchievement);
        doc.setFontSize(10);
        const splitAchievements = doc.splitTextToSize(report.notableAchievements || "N/A", 170);
        doc.text(splitAchievements, 20, yAchievement + 7);

        const yCareer = yAchievement + 10 + (splitAchievements.length * 5);
        doc.setFontSize(12);
        doc.text("Future Career Plans:", 20, yCareer);
        doc.setFontSize(10);
        const splitCareer = doc.splitTextToSize(report.futureCareerPlan || "N/A", 170);
        doc.text(splitCareer, 20, yCareer + 7);

        // FINAL PAGE: ASSESSMENT
        doc.addPage();
        doc.setFillColor(250, 248, 240);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setFontSize(18);
        doc.text("Final Evaluation & Assessment", 20, 30);

        doc.autoTable({
            startY: 40,
            body: [
                ['Final Performance Grade', student?.grade || 'PENDING'],
                ['Supervisor Verification', student?.supervisorSignature ? 'AUTHENTICATED' : 'PENDING'],
                ['Verification Date', student?.supervisorDate ? new Date(student.supervisorDate).toLocaleDateString() : 'N/A'],
            ],
            theme: 'striped',
            styles: { fontSize: 11, cellPadding: 8 }
        });

        const ySig = 240;
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.line(20, ySig, 90, ySig);
        doc.line(120, ySig, 190, ySig);
        doc.setFontSize(10);
        doc.text("Student Signature", 55, ySig + 7, { align: "center" });
        doc.text("Supervisor Seal & Signature", 155, ySig + 7, { align: "center" });

        doc.save(`Complete_Logbook_${student?.fullName?.replace(/\s+/g, '_')}.pdf`);
        toast.success("Comprehensive Logbook Portfolio Generated!");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 bg-slate-50">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-primary font-semibold text-sm">Loading Records...</p>
            </div>
        );
    }

    const isAfterInternship = student?.internshipEnd ? new Date() > new Date(student.internshipEnd) : false;

    // FIX 3: helper to update a log field, used to reduce repetition and avoid inline type issues
    const updateLogField = (weekNum: number, field: string, value: any) => {
        const nextLogs = [...weeklyLogs];
        const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
        const ent: WeeklyLog = getSafeLog(weekNum);
        ent[field] = value;

        if (field.endsWith("Hours")) {
            ent.totalHours =
                (ent.mondayHours ?? 0) +
                (ent.tuesdayHours ?? 0) +
                (ent.wednesdayHours ?? 0) +
                (ent.thursdayHours ?? 0) +
                (ent.fridayHours ?? 0);
        }

        if (idx >= 0) nextLogs[idx] = ent;
        else nextLogs.push(ent);
        setWeeklyLogs(nextLogs);
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 min-h-screen bg-slate-50 font-sans">
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-primary/10 pb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Industrial Attachment Logbook</h1>
                    <p className="text-slate-500 text-sm font-medium">Official student placement records and evaluation</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button
                        onClick={generatePDF}
                        disabled={!isAfterInternship}
                        className={`rounded-xl h-12 px-6 font-semibold text-sm shadow-sm transition-all ${isAfterInternship ? 'bg-primary text-white hover:bg-primary/90' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isAfterInternship
                            ? <><Download className="h-4 w-4 mr-2" /> Download Logbook PDF</>
                            : "PDF available after internship ends"
                        }
                    </Button>
                </div>
            </div>

            {/* Step Navigation */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
                {steps.map((step) => (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all border ${currentStep === step.id ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                        <step.icon className={`h-4 w-4 ${currentStep === step.id ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-sm font-semibold whitespace-nowrap">{step.title}</span>
                    </button>
                ))}
            </div>

            <main className="relative min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* STEP 1: GUIDELINES */}
                        {currentStep === 1 && (
                            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                    <CardTitle className="text-2xl font-bold text-slate-900">IAP Guidelines & Instructions</CardTitle>
                                    <p className="text-slate-500 text-sm mt-2">Please read the following rules and objectives carefully.</p>
                                </CardHeader>
                                <CardContent className="p-8 prose prose-sm max-w-none text-slate-600">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">IAP Objectives</h3>
                                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                                <li>To develop students and enhance their range of skills that are valuable for future careers, including technical skills and transferable skills such as communication, problem-solving, critical thinking, teamwork, adaptability, and time management.</li>
                                                <li>To expose students to the industry they are interested in or studying, allowing them to gain a deeper understanding of industry practices, trends, challenges, and opportunities.</li>
                                                <li>Opportunity for students to build professional networks and establish connections with industry professionals, facilitating future job opportunities, mentorship, and valuable industry contacts.</li>
                                                <li>Students can explore their career interests and clarify their goals by experiencing a real work environment and gaining insights into different roles, industries, and work cultures.</li>
                                                <li>To foster professional growth in students, challenging them, providing new experiences, and offering feedback to develop self-confidence, resilience, adaptability, and a growth mind-set.</li>
                                                <li>To integrate academic learning with practical application, helping students understand how theoretical concepts and classroom learning align with real-world scenarios, enhancing their overall educational experience.</li>
                                            </ul>

                                            <h3 className="text-lg font-bold text-slate-900 mt-8">Key Points (Compulsory)</h3>
                                            <div className="space-y-4 mt-4">
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                    <h4 className="font-semibold text-slate-900 text-sm mb-2">Before IAP</h4>
                                                    <p>1. Did you meet your IAP coordinator or any Liaison Officer (LO)?</p>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                    <h4 className="font-semibold text-slate-900 text-sm mb-2">During IAP</h4>
                                                    <p>2. Did your company supervisor assess you weekly and record on your Log Book?</p>
                                                    <p>3. Did your LO assess your Log Book when you are visited?</p>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                    <h4 className="font-semibold text-slate-900 text-sm mb-2">After IAP</h4>
                                                    <p>4. Did you send a Thank You letter to your IAP Company/Institution and give a copy to your LO with a reception stamp & signature? (Compulsory)</p>
                                                    <p>5. Did you complete the Student&apos;s Report Form?</p>
                                                    <p>6. Did you submit your Log Book plus your IAP-Report to your LO for grading within TWO weeks after the completion of IAP?</p>
                                                    <p>7. Did the LO sign your Log Book pages?</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-slate-900">IAP Instructions</h3>
                                            <div>
                                                <h4 className="font-bold text-slate-800">1. Rules and Regulations</h4>
                                                <ul className="list-disc pl-5 space-y-2 mt-2 text-sm">
                                                    <li>Once your IAP placement has been confirmed, you are not permitted to change your attachment or withdraw from the program without obtaining approval from the RCA IAP coordinator.</li>
                                                    <li>It is mandatory for you to adhere to the rules and regulations that govern employees of the IAP company or institution to which you are attached.</li>
                                                    <li>Any instances of absenteeism, insubordination, tardiness, or misconduct reported against you will result in disciplinary action.</li>
                                                    <li>Direct negotiation with the company regarding matters such as the duration of your attachment, allowance, working hours, leave of absence, working conditions, and rules is strictly prohibited.</li>
                                                    <li>During your attachment, you are not entitled to any leave or days off, including returning to RCA or your home. However, in case of emergencies, please seek permission from your supervisor for a leave of absence. Your LO must also be notified.</li>
                                                    <li>For non-emergency situations, you must apply for a leave of absence from the company or institution&apos;s supervision and inform your LO. Please contact them during regular working hours, excluding weekends.</li>
                                                    <li>If you become ill, please inform your supervisor that you will be consulting a doctor. A Medical Certificate must be submitted to your supervisor on the day you return to work.</li>
                                                    <li>As an intern, you do not possess the authority to negotiate or influence company-wide decisions, such as changes to the organizational structure, budget allocations, or major strategic initiatives.</li>
                                                    <li>Harassment of any kind, including but not limited to sexual harassment, verbal abuse, or discrimination, will not be tolerated.</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">2. Allowance & Accident</h4>
                                                <ul className="list-disc pl-5 space-y-2 mt-2 text-sm">
                                                    <li>The provision of an allowance by the company you are attached to is not guaranteed, unless specifically mentioned in your Placement Notice.</li>
                                                    <li>In the event of any injuries or hazards, promptly seek medical assistance or contact emergency services.</li>
                                                    <li>It is crucial to inform your supervisor at the IAP site about any accidents that occur.</li>
                                                    <li>Please be aware that you are covered under the RCA student&apos;s Accident Insurance Policy.</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">3. Log Book</h4>
                                                <ul className="list-disc pl-5 space-y-2 mt-2 text-sm">
                                                    <li>Please read the instructions given in this Log Book as well as those written on the forms before completing them. If in doubt, please consult your LO.</li>
                                                    <li>At the end of each day, take some time to reflect on your activities and write down a detailed account of what you worked on.</li>
                                                    <li>Use clear and concise language when describing your activities, focusing on key points and outcomes rather than excessive detail.</li>
                                                    <li>Treat your log book as a valuable resource for self-reflection and future reference.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-12 pt-8 border-t border-slate-200 flex justify-end">
                                        <Button onClick={() => setCurrentStep(2)} className="h-12 px-8 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-primary/90">
                                            I have read and understood
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 2: DETAILS & ATTENDANCE */}
                        {currentStep === 2 && (
                            <div className="space-y-8">
                                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                        <CardTitle className="text-2xl font-bold text-slate-900">Student Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <LogbookInput label="Name of Student" value={student?.fullName} onChange={(v) => setStudent({ ...student, fullName: v })} />
                                            <LogbookInput label="Date of Birth" type="date" value={student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(v) => setStudent({ ...student, dateOfBirth: v })} />
                                            <LogbookInput label="Sex" value={student?.sex} onChange={(v) => setStudent({ ...student, sex: v })} />
                                            <LogbookInput label="ID/Passport No." value={student?.idOrPassport} onChange={(v) => setStudent({ ...student, idOrPassport: v })} />
                                            <LogbookInput label="Reg No." value={student?.studentNumber} onChange={(v) => setStudent({ ...student, studentNumber: v })} />
                                            <LogbookInput label="Graduation Year" value={student?.graduationYear} onChange={(v) => setStudent({ ...student, graduationYear: v })} />
                                            <LogbookInput label="Cell Phone No." value={student?.phone} onChange={(v) => setStudent({ ...student, phone: v })} />
                                            <LogbookInput label="Internship Start Date" type="date" value={student?.internshipStart ? new Date(student.internshipStart).toISOString().split('T')[0] : ''} onChange={(v) => setStudent({ ...student, internshipStart: v })} />
                                            <LogbookInput label="Internship End Date" type="date" value={student?.internshipEnd ? new Date(student.internshipEnd).toISOString().split('T')[0] : ''} onChange={(v) => setStudent({ ...student, internshipEnd: v })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                        <CardTitle className="text-2xl font-bold text-slate-900">Company/Institution Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <LogbookInput label="Name" value={student?.companyName} onChange={(v) => setStudent({ ...student, companyName: v })} />
                                            <LogbookInput label="Address/Location" value={student?.companyAddress} onChange={(v) => setStudent({ ...student, companyAddress: v })} />
                                            <LogbookInput label="Tel No." value={student?.companyPhone} onChange={(v) => setStudent({ ...student, companyPhone: v })} />
                                            <LogbookInput label="Email" value={student?.companyEmail} onChange={(v) => setStudent({ ...student, companyEmail: v })} />
                                            <LogbookInput label="P.O.Box" value={student?.companyPOBox} onChange={(v) => setStudent({ ...student, companyPOBox: v })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                        <CardTitle className="text-2xl font-bold text-slate-900">Supervisor Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <LogbookInput label="IAP Company Supervisor Name" value={student?.supervisorName} onChange={(v) => setStudent({ ...student, supervisorName: v })} />
                                            <LogbookInput label="Department" value={student?.supervisorDepartment} onChange={(v) => setStudent({ ...student, supervisorDepartment: v })} />
                                            <LogbookInput label="Tel/Mob No." value={student?.supervisorPhone} onChange={(v) => setStudent({ ...student, supervisorPhone: v })} />
                                            <LogbookInput label="RCA Liaison Officer Name" value={student?.liaisonOfficerName} onChange={(v) => setStudent({ ...student, liaisonOfficerName: v })} />
                                            <LogbookInput label="Tel/Mob No." value={student?.liaisonOfficerPhone} onChange={(v) => setStudent({ ...student, liaisonOfficerPhone: v })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                        <div className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle className="text-2xl font-bold text-slate-900">Trainee&apos;s Attendance Matrix</CardTitle>
                                                <p className="text-slate-500 text-sm mt-1">15-week presence and absence tracker</p>
                                            </div>
                                            <div className="flex gap-4 text-xs font-semibold">
                                                <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Present</span>
                                                <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> Absent</span>
                                                <span className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Blank</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 overflow-x-auto">
                                        <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr>
                                                    <th className="border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700 w-24">Week</th>
                                                    <th className="border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700 w-32">Date From</th>
                                                    <th className="border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700 w-32">Date To</th>
                                                    <th className="border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700">Days Present</th>
                                                    <th className="border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700">Days Absent</th>
                                                    <th className="border border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700">Supervisor Signature</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 15 }).map((_, index) => {
                                                    const weekNum = index + 1;
                                                    const weekData = generatedWeeksList.find(w => w.number === weekNum);
                                                    const log = weeklyLogs.find(l => l.weekNumber === weekNum);

                                                    const filledDaysCount = [
                                                        log?.mondayTask, log?.tuesdayTask, log?.wednesdayTask,
                                                        log?.thursdayTask, log?.fridayTask
                                                    ].filter(t => t && t.trim().length > 0).length;

                                                    return (
                                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                            <td className="border border-slate-200 p-3 font-medium text-slate-900 text-center">Wk {weekNum}</td>
                                                            <td className="border border-slate-200 p-3 text-slate-600">{weekData ? new Date(weekData.start).toLocaleDateString() : '—'}</td>
                                                            <td className="border border-slate-200 p-3 text-slate-600">{weekData ? new Date(weekData.end).toLocaleDateString() : '—'}</td>
                                                            <td className="border border-slate-200 p-3 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                        <div key={i} className={`w-4 h-4 rounded-sm border ${i < filledDaysCount ? 'bg-green-500 border-green-600' : 'bg-slate-100 border-slate-200'}`}></div>
                                                                    ))}
                                                                    <span className="font-bold text-slate-700 ml-2 w-4">{filledDaysCount}</span>
                                                                </div>
                                                            </td>
                                                            <td className="border border-slate-200 p-3 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {Array.from({ length: 5 - filledDaysCount }).map((_, i) => (
                                                                        <div key={i} className="w-4 h-4 rounded-sm border bg-red-400 border-red-500"></div>
                                                                    ))}
                                                                    <span className="font-bold text-slate-700 ml-2 w-4">{5 - filledDaysCount}</span>
                                                                </div>
                                                            </td>
                                                            <td className="border border-slate-200 p-3 text-center">
                                                                {log?.supervisorSignature ? (
                                                                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest px-2 py-1 bg-green-50 rounded">Signed</span>
                                                                ) : (
                                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                    <div className="p-8 border-t border-slate-200 bg-slate-50 flex justify-end">
                                        <Button onClick={handleSaveStudentInfo} disabled={isSaving} className="h-12 px-8 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-primary/90">
                                            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save Details & Attendance"}
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* STEP 3: WEEKLY LOGS */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                {generatedWeeksList.length === 0 ? (
                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
                                        <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                        <h2 className="text-xl font-bold text-slate-700">No Schedule Defined</h2>
                                        <p className="text-slate-500 mt-2 text-sm">Update your profile with internship dates to generate your weekly schedule.</p>
                                        <Button onClick={() => setCurrentStep(2)} className="mt-6">Go to Details</Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Sidebar: Week List */}
                                        <div className="w-full lg:w-1/4 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2 pb-4">
                                            {generatedWeeksList.map(w => {
                                                const log = weeklyLogs.find(l => l.weekNumber === w.number);
                                                const isFilled = !!(log?.mondayTask || log?.tuesdayTask || log?.wednesdayTask || log?.thursdayTask || log?.fridayTask);
                                                const isSelected = expandedWeek === w.number;

                                                return (
                                                    <button
                                                        key={w.number}
                                                        onClick={() => setExpandedWeek(w.number)}
                                                        className={`flex items-center justify-between p-4 rounded-xl transition-all border text-left ${isSelected ? 'bg-primary border-primary text-white shadow-md' : isFilled ? 'bg-green-50/50 border-green-200 hover:bg-green-50' : 'bg-white border-slate-200 hover:border-primary/30 hover:bg-slate-50'}`}
                                                    >
                                                        <div>
                                                            <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>Week {w.number}</div>
                                                            <div className={`text-xs mt-1 ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                                                                {new Date(w.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(w.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </div>
                                                        </div>
                                                        {isFilled && <CheckCircle2 className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-green-500'}`} />}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Main Area: Log Details */}
                                        <div className="w-full lg:w-3/4">
                                            {expandedWeek ? (
                                                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                                    <CardHeader className="bg-slate-50 p-6 border-b border-slate-200">
                                                        <div className="flex flex-row items-center justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <CardTitle className="text-xl font-bold text-slate-900">Week {expandedWeek} Log</CardTitle>
                                                                    <span className="text-xs font-semibold text-slate-500 px-2 py-1 bg-slate-200 rounded-md">
                                                                        {new Date(generatedWeeksList.find(w => w.number === expandedWeek)?.start || "").toLocaleDateString()} — {new Date(generatedWeeksList.find(w => w.number === expandedWeek)?.end || "").toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-500 text-sm">Record your daily technical activities and hours below.</p>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => setExpandedWeek(null)} className="text-slate-500 hover:text-slate-900 lg:hidden">
                                                                Close
                                                            </Button>
                                                        </div>
                                                    </CardHeader>

                                                    <CardContent className="p-0">
                                                        {/* Daily Logs Table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm text-left">
                                                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                                                    <tr>
                                                                        <th className="p-4 font-semibold w-24">Day</th>
                                                                        <th className="p-4 font-semibold">Description of Work / Activity</th>
                                                                        <th className="p-4 font-semibold w-24 text-center">Hours</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                                                        const dayKey = day.toLowerCase();
                                                                        const log = getSafeLog(expandedWeek);

                                                                        return (
                                                                            <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                                                                                <td className="p-4 font-medium text-slate-700">{day}</td>
                                                                                <td className="p-4">
                                                                                    <textarea
                                                                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none min-h-[80px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                                                                                        placeholder={`Describe tasks performed on ${day}...`}
                                                                                        value={log[`${dayKey}Task`] || ""}
                                                                                        onChange={(e) => updateLogField(expandedWeek, `${dayKey}Task`, e.target.value)}
                                                                                    />
                                                                                </td>
                                                                                <td className="p-4">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="24"
                                                                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-center text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                                                        value={log[`${dayKey}Hours`] || ""}
                                                                                        onChange={(e) => updateLogField(expandedWeek, `${dayKey}Hours`, parseFloat(e.target.value) || 0)}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                                <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                                                                    <tr>
                                                                        <td colSpan={2} className="p-4 text-right">Total Hours for the Week:</td>
                                                                        <td className="p-4 text-center">{getSafeLog(expandedWeek).totalHours || 0}</td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>

                                                        {/* Summary & Supervisor Area */}
                                                        <div className="p-6 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-primary" /> General Statement
                                                                    </h4>
                                                                    <p className="text-xs text-slate-500 mt-1">Brief summary of the week&apos;s overall progress and learnings.</p>
                                                                </div>
                                                                <textarea
                                                                    className="w-full h-32 bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-800 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                                                                    placeholder="Summarize your week here..."
                                                                    value={getSafeLog(expandedWeek).generalStatement || ""}
                                                                    onChange={(e) => updateLogField(expandedWeek, 'generalStatement', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                                <div className="w-full">
                                                                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                                                        <CheckSquare className="h-4 w-4 text-primary" /> Supervisor&apos;s Grading
                                                                    </h4>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-semibold text-slate-500">Grade Awarded</label>
                                                                            <select
                                                                                className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm bg-white"
                                                                                value={getSafeLog(expandedWeek).grade || ""}
                                                                                onChange={(e) => updateLogField(expandedWeek, 'grade', e.target.value)}
                                                                            >
                                                                                <option value="" disabled>Select A-E...</option>
                                                                                <option value="A">A - Excellent</option>
                                                                                <option value="B">B - Good</option>
                                                                                <option value="C">C - Satisfactory</option>
                                                                                <option value="D">D - Poor</option>
                                                                                <option value="E">E - Unacceptable</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="text-xs font-semibold text-slate-500">Date</label>
                                                                            <input
                                                                                type="date"
                                                                                className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm bg-white"
                                                                                value={getSafeLog(expandedWeek).supervisorDate || ""}
                                                                                onChange={(e) => updateLogField(expandedWeek, 'supervisorDate', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-2 space-y-2">
                                                                            <label className="text-xs font-semibold text-slate-500">Supervisor Name</label>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm bg-white placeholder:text-slate-300"
                                                                                placeholder="Print Name"
                                                                                value={getSafeLog(expandedWeek).supervisorName || ""}
                                                                                onChange={(e) => updateLogField(expandedWeek, 'supervisorName', e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-2 flex items-center justify-between mt-2 pt-4 border-t border-slate-200">
                                                                            <label className="text-sm font-semibold text-slate-700">Digital Signature</label>
                                                                            <button
                                                                                onClick={() => updateLogField(expandedWeek, 'supervisorSignature', !getSafeLog(expandedWeek).supervisorSignature)}
                                                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${getSafeLog(expandedWeek).supervisorSignature ? 'bg-green-500' : 'bg-slate-200'}`}
                                                                            >
                                                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getSafeLog(expandedWeek).supervisorSignature ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                                                            <Button
                                                                onClick={() => handleSaveWeeklyLog(getSafeLog(expandedWeek))}
                                                                disabled={isSaving}
                                                                className="h-12 px-8 rounded-lg bg-primary text-white font-bold shadow-sm"
                                                            >
                                                                {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save Weekly Log"}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                                                    <FileText className="h-12 w-12 text-slate-300 mb-4" />
                                                    <h3 className="text-xl font-bold text-slate-700">Select a Week</h3>
                                                    <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                                                        Choose a week from the sidebar to view, edit, or submit your daily technical logs.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 4: RESULT REPORT */}
                        {currentStep === 4 && (
                            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                    <CardTitle className="text-2xl font-bold text-slate-900">Engagement Analysis</CardTitle>
                                    <p className="text-slate-500 text-sm mt-1">Final outcome reporting and suggestion vault</p>
                                </CardHeader>
                                <CardContent className="p-8 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <SurveyButton label="IAP was useful?" active={report.isUseful} onClick={() => setReport({ ...report, isUseful: true })} onDecline={() => setReport({ ...report, isUseful: false })} />
                                        <SurveyButton label="Improved Understanding?" active={report.improvedUnderstanding} onClick={() => setReport({ ...report, improvedUnderstanding: true })} onDecline={() => setReport({ ...report, improvedUnderstanding: false })} />
                                        <SurveyButton label="Provided Experience?" active={report.providedExperiences} onClick={() => setReport({ ...report, providedExperiences: true })} onDecline={() => setReport({ ...report, providedExperiences: false })} />
                                    </div>

                                    <div className="space-y-8 pt-8 border-t border-slate-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Notable Achievements</label>
                                                <textarea
                                                    value={report.notableAchievements || ""}
                                                    onChange={(e) => setReport({ ...report, notableAchievements: e.target.value })}
                                                    className="w-full h-40 rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                                    placeholder="List your key achievements here..."
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Future Career Plans</label>
                                                <textarea
                                                    value={report.futureCareerPlan || ""}
                                                    onChange={(e) => setReport({ ...report, futureCareerPlan: e.target.value })}
                                                    className="w-full h-40 rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                                    placeholder="Detail your career trajectory here..."
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Suggestions to Department</label>
                                            <textarea
                                                value={report.suggestions || ""}
                                                onChange={(e) => setReport({ ...report, suggestions: e.target.value })}
                                                className="w-full h-32 rounded-xl bg-white border border-slate-200 p-4 text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300"
                                                placeholder="Any feedback for the department..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-200 flex justify-end">
                                        <Button onClick={handleSaveReport} disabled={isSaving} className="h-12 px-8 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-primary/90">
                                            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save Report"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 5: ASSESSMENT VAULT */}
                        {currentStep === 5 && (
                            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div>
                                            <CardTitle className="text-2xl font-bold text-slate-900">Assessment Vault</CardTitle>
                                            <p className="text-slate-500 text-sm mt-1">Protected supervisor evaluations and final grading</p>
                                        </div>
                                        <div className="h-20 w-24 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grade</span>
                                            <span className="text-3xl font-black text-primary">{student?.grade || "—"}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                                                <div className="h-px w-8 bg-slate-200"></div> Industrial Status
                                            </h4>
                                            <div className="flex items-center justify-between p-6 rounded-xl bg-slate-50 border border-slate-200">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-full flex shrink-0 items-center justify-center ${student?.supervisorSignature ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                                        <CheckSquare className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Supervisor Verification</p>
                                                        <p className={`text-xs font-semibold uppercase tracking-wider ${student?.supervisorSignature ? 'text-green-600' : 'text-slate-500'}`}>
                                                            {student?.supervisorSignature ? 'Authenticated' : 'Pending Review'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                                                <div className="h-px w-8 bg-slate-200"></div> Administrative Status
                                            </h4>
                                            <div className="flex items-center justify-between p-6 rounded-xl bg-slate-50 border border-slate-200">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-full flex shrink-0 items-center justify-center ${student?.loAssigned ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                                        <ShieldCheck className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Liaison Officer</p>
                                                        <p className={`text-xs font-semibold uppercase tracking-wider ${student?.loAssigned ? 'text-blue-600' : 'text-slate-500'}`}>
                                                            {student?.loAssigned ? 'Assigned & Reviewing' : 'Unassigned'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-4">
                                        <LockKeyhole className="h-6 w-6 text-amber-500 shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-amber-900">Secure Environment</h4>
                                            <p className="text-amber-800/80 text-sm mt-1 leading-relaxed">
                                                Final grades and assessments in this vault are strictly imported from sealed supervisor documentation. Direct modifications by students are logged and heavily monitored. Discrepancies may result in immediate placement termination.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}