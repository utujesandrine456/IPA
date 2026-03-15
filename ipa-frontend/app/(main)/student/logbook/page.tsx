"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Plus, Loader2, FileText, CheckSquare, MessageSquare,
    Star, Building2, User, Calendar, ChevronDown,
    ChevronUp, Download, CheckCircle2, AlertCircle,
    ShieldCheck, LockKeyhole, Check
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast, Toaster } from "react-hot-toast";
import DOMPurify from "dompurify";

const sanitize = (html: string) => ({ __html: DOMPurify.sanitize(html) });

const formatDate = (date: string | null | undefined) => {
    if (!date) return "";
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split('T')[0];
    } catch {
        return "";
    }
};

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

function LogbookInput({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-semibold text-slate-500 group-hover:text-primary transition-colors">{label}</label>
            <input
                type={type}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm outline-none"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isCompleted = status === "COMPLETED";
    const isRejected = status === "REJECTED";
    const isSubmitted = status === "SUBMITTED";

    return (
        <div className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 transition-all border",
            isCompleted ? "bg-green-50 text-green-700 border-green-200" :
                isRejected ? "bg-red-50 text-red-700 border-red-200" :
                    isSubmitted ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
        )}>
            <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                isCompleted ? "bg-green-500" :
                    isRejected ? "bg-red-500" :
                        "bg-amber-500 animate-pulse"
            )} />
            {status}
        </div>
    );
}


function SurveCheckButton({ label, active, onClick, onDecline }: { label: string; active?: boolean; onClick: () => void; onDecline: () => void }) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-slate-700 leading-tight">{label}</span>
            <div className="flex gap-4">
                <button onClick={onClick} className="flex items-center gap-2 group">
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${active === true ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-primary/50'}`}>
                        {active === true && <CheckSquare className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Yes</span>
                </button>
                <button onClick={onDecline} className="flex items-center gap-2 group">
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${active === false ? 'bg-red-500 border-red-500' : 'border-slate-300 group-hover:border-red-400'}`}>
                        {active === false && <CheckSquare className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">No</span>
                </button>
            </div>
        </div>
    );
}

function SurveyButton({ label, active, onClick, onDecline }: { label: string; active?: boolean | string; onClick: () => void; onDecline: () => void }) {
    return (
        <div className="flex flex-col gap-3 group">
            <span className="text-xs font-semibold text-slate-500 text-center group-hover:text-primary transition-colors">{label}</span>
            <div className="flex gap-3">
                <button
                    onClick={onClick}
                    className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all border-2 ${active === true || active === "Excellent" || active === "YES" ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-primary/50 hover:text-primary'}`}
                >Yes</button>
                <button
                    onClick={onDecline}
                    className={`flex-1 h-12 rounded-lg font-bold text-sm transition-all border-2 ${active === false || active === "Poor" || active === "NO" ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-500'}`}
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
    status: 'DRAFT' | 'SUBMITTED' | 'COMPLETED' | 'REJECTED';
}

interface IapReport {
    nameOfUnit?: string;
    overviewGoals?: string;
    contentsTraining?: string;
    isUseful?: boolean;
    improvedUnderstanding?: boolean;
    providedExperiences?: boolean;
    loVisitCount?: number;
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
    const [report, setReport] = useState<IapReport>({
        programmeTypes: [],
        nameOfUnit: "",
        overviewGoals: "",
        contentsTraining: ""
    });

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
            mondayHours: 8,
            tuesdayTask: "",
            tuesdayHours: 8,
            wednesdayTask: "",
            wednesdayHours: 8,
            thursdayTask: "",
            thursdayHours: 8,
            fridayTask: "",
            fridayHours: 8,
            totalHours: 40,
            generalStatement: "",
            supervisorSignature: false,
            supervisorName: "",
            supervisorDate: "",
            status: "DRAFT"
        };

        const merged = existing ? { ...baseLog, ...existing } : baseLog;
        merged.mondayHours = merged.mondayHours || 8;
        merged.tuesdayHours = merged.tuesdayHours || 8;
        merged.wednesdayHours = merged.wednesdayHours || 8;
        merged.thursdayHours = merged.thursdayHours || 8;
        merged.fridayHours = merged.fridayHours || 8;

        merged.totalHours = (Number(merged.mondayHours)) + (Number(merged.tuesdayHours)) + (Number(merged.wednesdayHours)) + (Number(merged.thursdayHours)) + (Number(merged.fridayHours));

        return merged;
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const storedUserRaw = localStorage.getItem("user");
            if (!storedUserRaw || storedUserRaw === "{}") {
                return;
            }

            const storedUser = JSON.parse(storedUserRaw);
            const studentId = storedUser.studentProfile?.id || storedUser.id;

            if (!studentId) {
                return;
            }

            setUser(storedUser);

            console.log("Fetching data for studentId:", studentId);

            try {
                const result = await apiFetch(`/students/${studentId}`);
                if (result.ok && result.data) {
                    const studentData = result.data.student || result.data;
                    setStudent({
                        ...studentData,
                        ratings: studentData.ratings || []
                    });
                }
            } catch (e: any) {
                if (e.message !== 'Not Found' && e.message !== 'Student not found') {
                    console.error("Error fetching student:", e);
                    toast.error("Failed to load profile details");
                }
            }

            try {
                const result = await apiFetch(`/tasks?studentId=${studentId}`);
                if (result.ok) {
                    setTasks(result.data?.tasks || []);
                }
            } catch (e) {
                console.error("Error fetching tasks:", e);
            }

            try {
                const result = await apiFetch(`/weekly-logs?studentId=${studentId}`);
                if (result.ok) {
                    setWeeklyLogs(result.data?.logs || []);
                }
            } catch (e) {
                console.error("Error fetching weekly logs:", e);
            }

            try {
                const result = await apiFetch(`/iap-reports?studentId=${studentId}`);
                if (result.ok && result.data) {
                    setReport(result.data);
                }
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

        if (!student?.internshipStart || !student?.internshipEnd) {
            toast.error("Please provide both start and end dates");
            return;
        }

        setIsSaving(true);
        try {
            const result = await apiFetch(`/students/${student.id}`, {
                method: "PATCH",
                body: JSON.stringify(student)
            });
            if (result.ok) {
                toast.success("Profile details saved to database");

                // Update local storage to reflect completed profile
                try {
                    const storedUserRaw = localStorage.getItem("user");
                    if (storedUserRaw) {
                        const storedUser = JSON.parse(storedUserRaw);
                        storedUser.profileCompleted = true;
                        if (storedUser.studentProfile) {
                            storedUser.studentProfile.profileCompleted = true;
                        }
                        localStorage.setItem("user", JSON.stringify(storedUser));
                    }
                } catch (err) {
                    console.error("Local storage update failed", err);
                }

                fetchData();
            } else {
                toast.error(result.error || "Failed to save details");
            }
        } catch (error) {
            toast.error("An error occurred during save");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveWeeklyLog = async (log: WeeklyLog) => {
        setIsSaving(true);
        try {
            const result = await apiFetch("/weekly-logs", {
                method: "POST",
                body: JSON.stringify({ ...log, studentId: student.id })
            });
            if (result.ok) {
                toast.success(`Week ${log.weekNumber} activity synced`);
                fetchData();
            } else {
                toast.error(result.error || "Synchronization failed");
            }
        } catch (error) {
            toast.error("Synchronization failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitWeeklyLog = async (log: WeeklyLog) => {
        setIsSaving(true);
        try {
            const saveResult = await apiFetch("/weekly-logs", {
                method: "POST",
                body: JSON.stringify({ ...log, studentId: student.id })
            });

            if (!saveResult.ok) {
                toast.error("Failed to save log details before submission");
                setIsSaving(false);
                return;
            }

            const updatedLogId = log.id || saveResult.data?.id || saveResult.data?.log?.id;

            if (!updatedLogId) {
                toast.error("Could not verify log ID for submission. Save draft first.");
                setIsSaving(false);
                return;
            }

            const result = await apiFetch(`/weekly-logs/${updatedLogId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: "SUBMITTED" })
            });
            if (result.ok) {
                toast.success("Logbook submitted to supervisor");
                fetchData();
            } else {
                toast.error(result.error || "Submission failed");
            }
        } catch (error) {
            toast.error("Submission failed");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveReport = async () => {
        setIsSaving(true);
        try {
            const result = await apiFetch("/iap-reports", {
                method: "POST",
                body: JSON.stringify({ ...report, studentId: student.id })
            });
            if (result.ok) {
                toast.success("Final report encrypted and saved");
            } else {
                toast.error(result.error || "Analysis save failed");
            }
        } catch (error) {
            toast.error("Analysis save failed");
        } finally {
            setIsSaving(false);
        }
    };
    const generatePDF = () => {
        const doc = new jsPDF() as any;
        const fontName = "helvetica";
        const primaryColor: [number, number, number] = [26, 38, 74];
        const slateColor: [number, number, number] = [241, 245, 249];

        // ─── HELPERS ─────────────────────────────────────────────────────────────────
        const addHeader = (title: string, subtitle: string = "RCA Industrial Attachment Program") => {
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, 210, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(fontName, "bold");
            doc.setFontSize(14);
            doc.text(title, 105, 12, { align: "center" });
            doc.setFontSize(8);
            doc.setFont(fontName, "normal");
            doc.text(subtitle, 105, 18, { align: "center" });
            doc.setTextColor(0, 0, 0);
        };

        const drawCheckbox = (cx: number, cy: number, checked: boolean) => {
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.4);
            doc.rect(cx, cy - 3.5, 4, 4);
            if (checked) {
                doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setLineWidth(0.6);
                doc.line(cx + 0.8, cy - 1.5, cx + 1.8, cy - 0.5);
                doc.line(cx + 1.8, cy - 0.5, cx + 3.2, cy - 3);
            }
        };

        // ─── COVER PAGE ─────────────────────────────────────────────────────────────
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 15, 297, 'F');

        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont(fontName, "bold");
        doc.setFontSize(10);
        doc.text("RWANDA CODING ACADEMY", 30, 30);

        doc.setFontSize(48);
        doc.text("IAP", 30, 70);
        doc.setFontSize(24);
        doc.text("LOGBOOK", 30, 85);
        doc.setLineWidth(2);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.line(30, 95, 60, 95);

        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139);
        doc.setFont(fontName, "normal");
        doc.text("Institutional record for Industrial Attachment Program tracking", 30, 105);

        let y = 140;
        const drawSection = (title: string, items: { label: string, value: string }[]) => {
            doc.setFont(fontName, "bold");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text(title.toUpperCase(), 30, y);
            y += 8;
            doc.setLineWidth(0.1);
            doc.setDrawColor(226, 232, 240);
            doc.line(30, y - 4, 180, y - 4);

            doc.setFont(fontName, "normal");
            doc.setFontSize(10);
            items.forEach(item => {
                doc.setTextColor(100, 116, 139);
                doc.text(item.label + ":", 35, y);
                doc.setTextColor(15, 23, 42);
                doc.setFont(fontName, "bold");
                doc.text(item.value || "N/A", 85, y);
                doc.setFont(fontName, "normal");
                y += 7;
            });
            y += 10;
        };

        drawSection("Student Identity", [
            { label: "Full Name", value: student?.fullName || "" },
            { label: "Reg Number", value: student?.studentNumber || "" },
            { label: "ID/Passport", value: student?.idOrPassport || "" },
            { label: "Contact", value: student?.phone || "" }
        ]);

        drawSection("Placement Details", [
            { label: "Company", value: student?.companyName || "" },
            { label: "Location", value: student?.companyAddress || "" },
            { label: "Department", value: report.nameOfUnit || "" },
            { label: "Duration", value: `${formatDate(student?.internshipStart)} — ${formatDate(student?.internshipEnd)}` }
        ]);

        drawSection("Supervision", [
            { label: "Industry Supervisor", value: student?.supervisorName || "" },
            { label: "Designation", value: student?.supervisorDesignation || "" },
            { label: "Liaison Officer", value: student?.liaisonOfficerName || "" }
        ]);

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Generated via IPA Digital System • Confidential Institutional Document", 105, 285, { align: "center" });

        // ─── PAGE 2: OBJECTIVES ────────────────────────────
        doc.addPage();
        addHeader("IAP OBJECTIVES & GUIDELINES");
        let yPos = 40;

        const renderTextSection = (title: string, text: string[], type: 'bullet' | 'para' = 'bullet') => {
            doc.setFont(fontName, "bold");
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42);
            doc.text(title, 20, yPos);
            yPos += 8;

            doc.setFont(fontName, "normal");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);

            text.forEach(item => {
                const lines = doc.splitTextToSize(type === 'bullet' ? `\u2022  ${item}` : item, 170);
                if (yPos + (lines.length * 5) > 280) {
                    doc.addPage();
                    addHeader("IAP OBJECTIVES & GUIDELINES (CONTINUED)");
                    yPos = 40;
                }
                doc.text(lines, 25, yPos);
                yPos += (lines.length * 5) + 3;
            });
            yPos += 5;
        };

        renderTextSection("Program Objectives", [
            "To develop students and enhance their range of technical and transferable skills.",
            "To expose students to industry practices, trends, challenges, and opportunities.",
            "To bridge the gap between academic theory and real-world implementation.",
            "To foster professional networks and mentorship connections."
        ]);

        renderTextSection("Student Guidelines & Rules", [
            "Maintain punctuality and professional etiquette at all times.",
            "Complete logbook entries daily with detailed technical descriptions.",
            "Adhere to company rules and safety protocols strictly.",
            "Submit the finalized logbook within two weeks after IAP completion.",
            "Harassment and misconduct will result in immediate disciplinary action."
        ], 'para');

        // ─── WEEKLY LOGS ───────────────────────────────────
        generatedWeeksList.forEach((week) => {
            const log = getSafeLog(week.number);
            doc.addPage();
            addHeader(`WEEKLY PROGRESS REPORT • WEEK ${week.number}`, `${formatDate(week.start)} — ${formatDate(week.end)}`);

            doc.setFillColor(slateColor[0], slateColor[1], slateColor[2]);
            doc.roundedRect(20, 35, 170, 20, 2, 2, 'F');
            doc.setFont(fontName, "bold");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text("TOTAL LOGGED HOURS", 35, 47);
            doc.setFontSize(16);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(`${log.totalHours || 0} Professional Hours`, 100, 48);

            const days = [
                { name: 'Monday', task: log.mondayTask, hours: log.mondayHours },
                { name: 'Tuesday', task: log.tuesdayTask, hours: log.tuesdayHours },
                { name: 'Wednesday', task: log.wednesdayTask, hours: log.wednesdayHours },
                { name: 'Thursday', task: log.thursdayTask, hours: log.thursdayHours },
                { name: 'Friday', task: log.fridayTask, hours: log.fridayHours },
            ];

            autoTable(doc, {
                startY: 65,
                head: [['DAY', 'TECHNICAL DESCRIPTION OF ACTIVITIES', 'HRS']],
                body: days.map(d => [d.name.toUpperCase(), d.task?.trim() || 'No entry recorded.', d.hours || '0']),
                theme: 'grid',
                headStyles: { fillColor: primaryColor, fontSize: 8, fontStyle: 'bold', cellPadding: 4 },
                styles: { fontSize: 8.5, cellPadding: 4, font: fontName, textColor: [51, 65, 85] },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 30, fillColor: [248, 250, 252] },
                    2: { halign: 'center', cellWidth: 15, fontStyle: 'bold' }
                }
            });

            yPos = (doc as any).lastAutoTable.finalY + 12;

            doc.setFillColor(252, 252, 253);
            doc.setDrawColor(226, 232, 240);
            const stmtText = log.generalStatement || "No weekly summary provided by student.";
            const stmtLines = doc.splitTextToSize(stmtText, 160);
            const boxH = (stmtLines.length * 5) + 15;
            doc.roundedRect(20, yPos, 170, boxH, 1, 1, 'FD');
            doc.setFont(fontName, "bold");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("STUDENT'S GENERAL STATEMENT", 25, yPos + 6);
            doc.setFont(fontName, "normal");
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.text(stmtLines, 25, yPos + 12);

            yPos += boxH + 12;

            doc.setFont(fontName, "bold");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text("SUPERVISOR'S ASSESSMENT & SIGNATURE", 20, yPos);
            yPos += 6;

            const gradeScale = [
                { id: 'A', label: 'A - Excellent' },
                { id: 'B', label: 'B - Good' },
                { id: 'C', label: 'C - Satisfactory' },
                { id: 'D', label: 'D - Poor' },
                { id: 'E', label: 'E - Fail' }
            ];

            gradeScale.forEach((g, i) => {
                const xBase = 20 + (i * 35);
                drawCheckbox(xBase, yPos, log.grade === g.id);
                doc.setFont(fontName, log.grade === g.id ? "bold" : "normal");
                doc.setFontSize(8);
                doc.text(g.label, xBase + 6, yPos);
            });

            yPos += 15;
            doc.setLineWidth(0.2);
            doc.setDrawColor(203, 213, 225);
            doc.line(20, yPos, 80, yPos);
            doc.line(110, yPos, 145, yPos);
            doc.line(155, yPos, 190, yPos);

            doc.setFontSize(7);
            doc.setFont(fontName, "normal");
            doc.setTextColor(148, 163, 184);
            doc.text("NAME OF SUPERVISOR", 20, yPos + 4);
            doc.text("DATE", 110, yPos + 4);
            doc.text("SIGNATURE / STAMP", 155, yPos + 4);

            doc.setFont(fontName, "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(log.supervisorName || "........................", 20, yPos - 2);
            doc.text(log.supervisorDate ? new Date(log.supervisorDate).toLocaleDateString() : "..................", 110, yPos - 2);
            if (log.supervisorSignature) {
                doc.setTextColor(34, 197, 94);
                doc.text("SIGNED DIGITALLY", 155, yPos - 2);
            }
        });

        // ─── FINAL RESULT REPORT ───────────────────────────
        doc.addPage();
        addHeader("INDUSTRIAL ATTACHMENT RESULT REPORT", "Student Performance Summary");

        autoTable(doc, {
            startY: 40,
            body: [
                ['Student Full Name', student?.fullName || 'N/A'],
                ['Registration Number', student?.studentNumber || 'N/A'],
                ['Placement Company', student?.companyName || 'N/A'],
                ['Unit / Department', report.nameOfUnit || 'N/A'],
                ['Internship Period', `${formatDate(student?.internshipStart)} to ${formatDate(student?.internshipEnd)}`],
            ],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4, font: fontName },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        autoTable(doc, {
            startY: yPos,
            body: [
                [{ content: 'OVERVIEW & GOALS', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, report.overviewGoals || 'N/A'],
                [{ content: 'CONTENTS OF TRAINING', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, report.contentsTraining || 'N/A'],
                [{ content: 'NOTABLE ACHIEVEMENTS', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, report.notableAchievements || 'N/A'],
            ],
            theme: 'grid',
            styles: { fontSize: 8.5, cellPadding: 5, font: fontName, textColor: [30, 41, 59] },
            columnStyles: { 0: { cellWidth: 50 } }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
        doc.setFont(fontName, "bold");
        doc.setFontSize(10);
        doc.text("Institutional Verification", 20, yPos);
        yPos += 10;
        doc.setFontSize(9);
        doc.setFont(fontName, "normal");
        doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 20, yPos);
        doc.line(130, yPos, 180, yPos);
        doc.text("Seal of RCA / LO Signature", 130, yPos + 5);

        doc.save(`Logbook_${student?.fullName || "Student"}.pdf`);
        toast.success("Professional Logbook Generated!");
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

    const updateLogField = (weekNum: number, field: string, value: any) => {
        const nextLogs = [...weeklyLogs];
        const idx = nextLogs.findIndex(l => l.weekNumber === weekNum);
        const ent: WeeklyLog = getSafeLog(weekNum);
        ent[field] = value;

        if (field.endsWith("Hours")) {
            ent.totalHours =
                (Number(ent.mondayHours) || 8) +
                (Number(ent.tuesdayHours) || 8) +
                (Number(ent.wednesdayHours) || 8) +
                (Number(ent.thursdayHours) || 8) +
                (Number(ent.fridayHours) || 8);
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
                        disabled={!isAfterInternship && !student?.ratings?.[0]?.rating}
                        className={`rounded-xl h-12 px-6 font-semibold text-sm shadow-sm transition-all ${isAfterInternship || student?.ratings?.[0]?.rating ? 'bg-primary text-white hover:bg-primary/90' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                        {isAfterInternship || student?.ratings?.[0]?.rating
                            ? <><Download className="h-4 w-4 mr-2" /> Download Logbook PDF</>
                            : "PDF available after assessment"
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
                                    <CardTitle className="text-2xl font-bold text-slate-900">IAP Guidelines &amp; Instructions</CardTitle>
                                    <p className="text-slate-500 text-sm mt-2">Please read the following rules and objectives carefully before proceeding.</p>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10 text-slate-600 text-sm leading-relaxed">

                                    {/* OBJECTIVES */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                                            IAP Objectives
                                        </h3>
                                        <ul className="space-y-2 pl-8 list-disc">
                                            <li>To develop students and enhance their range of skills that are valuable for future careers, including technical skills and transferable skills such as communication, problem-solving, critical thinking, teamwork, adaptability, and time management.</li>
                                            <li>To expose students to the industry they are interested in or studying, allowing them to gain a deeper understanding of industry practices, trends, challenges, and opportunities.</li>
                                            <li>Opportunity for students to build professional networks and establish connections with industry professionals, facilitating future job opportunities, mentorship, and valuable industry contacts.</li>
                                            <li>Students can explore their career interests and clarify their goals by experiencing a real work environment and gaining insights into different roles, industries, and work cultures.</li>
                                            <li>To foster professional growth in students, challenging them, providing new experiences, and offering feedback to develop self-confidence, resilience, adaptability, and a growth mind-set.</li>
                                            <li>To integrate academic learning with practical application, helping students understand how theoretical concepts and classroom learning align with real-world scenarios, enhancing their overall educational experience.</li>
                                        </ul>
                                    </div>

                                    {/* KEY POINTS */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                                            Key Points to Keep in Mind (Compulsory)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                                <h4 className="font-bold text-blue-800 text-xs uppercase tracking-wider mb-3">Before IAP</h4>
                                                <p className="text-slate-700">1. Did you meet your IAP coordinator or any Liaison Officer (LO)?</p>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                                <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider mb-3">During IAP</h4>
                                                <p className="text-slate-700">2. Did your company supervisor assess you weekly and record on your Log Book?</p>
                                                <p className="text-slate-700 mt-2">3. Did your LO assess your Log Book when you are visited?</p>
                                            </div>
                                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                                <h4 className="font-bold text-green-800 text-xs uppercase tracking-wider mb-3">After IAP</h4>
                                                <p className="text-slate-700">4. Did you send a Thank You letter to your IAP Company/Institution and give a copy to your LO with a reception stamp &amp; signature? <span className="font-bold">(Compulsory)</span></p>
                                                <p className="text-slate-700 mt-2">5. Did you complete the Student&apos;s Report Form?</p>
                                                <p className="text-slate-700 mt-2">6. Did you submit your Log Book plus your IAP-Report to your LO for grading within TWO weeks after the completion of IAP?</p>
                                                <p className="text-slate-700 mt-2">7. Did the LO sign your Log Book pages?</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* IAP GUIDELINES */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                                            IAP Guidelines
                                        </h3>
                                        <p className="pl-8 mb-4 text-slate-600">Preparing for an IAP is crucial to ensure a successful and enriching experience. This guide presents instructions to students on how to make the most out of their placement, starting from the preparation phase, during the placement itself, and concluding with the post-placement phase.</p>
                                        <div className="pl-8 space-y-4">
                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">Prior to Placement</h4>
                                                </div>
                                                <ul className="p-5 space-y-2 list-disc pl-8">
                                                    <li>Research the Company/Institution where you will be placed and familiarize yourself with their mission, values, products/services, and any recent news or projects. This will help you align your expectations and demonstrate your interest during the placement.</li>
                                                    <li>Review Placement Objectives and understand the objectives of your placement as communicated by RCA. Review the specific skills and knowledge you are expected to gain and consider how you can actively work towards achieving those objectives during your placement.</li>
                                                    <li>Set personal goals that align with the placement objectives and always reflect on what you hope to achieve during the placement. This will provide a clear focus and direction for your efforts.</li>
                                                    <li>Familiarize yourself with professional etiquette and workplace norms. This includes appropriate behaviour, respect for colleagues and supervisors, confidentiality, punctuality, and a positive attitude. Prepare a professional-looking resume, if required, and bring any necessary identification or documentation requested by the placement host.</li>
                                                </ul>
                                            </div>
                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">During the Placement</h4>
                                                </div>
                                                <ul className="p-5 space-y-2 list-disc pl-8">
                                                    <li>Be proactive and eager to learn by taking initiative, ask questions, and seek opportunities to contribute to new tasks, projects, and responsibilities that align with your learning goals.</li>
                                                    <li>Observe and learn from your colleagues and supervisors by paying attention to their work practices, communication styles, and problem-solving approaches. Actively seek feedback to improve your performance and demonstrate your commitment to growth.</li>
                                                    <li>Take advantage of networking opportunities within the workplace by engaging with colleagues, attend company events, and seek mentorship from experienced professionals. Building relationships can open doors for future opportunities and provide valuable guidance.</li>
                                                    <li>Maintain a growth mind-set by embracing challenges and setbacks as learning opportunities. Be open to feedback, adapt to new situations, and continuously seek ways to improve your skills. Embody a growth mind-set that fosters resilience, adaptability, and a commitment to lifelong learning.</li>
                                                </ul>
                                            </div>
                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">After the Placement</h4>
                                                </div>
                                                <ul className="p-5 space-y-2 list-disc pl-8">
                                                    <li>Take time to reflect on your placement experience by evaluating your accomplishments, challenges faced, and lessons learned. Consider how the experience has contributed to your personal and professional growth.</li>
                                                    <li>Document your achievements, skills acquired, and projects completed during the placement. Update your resume or portfolio to reflect your new experiences and competencies. These will be valuable assets when pursuing future opportunities.</li>
                                                    <li>Seek feedback and recommendations by approaching your supervisors or mentors. Request their insights on your performance and areas for further development. These testimonials can be valuable additions to your professional profile.</li>
                                                    <li>Apply the knowledge, skills, and insights gained during the placement to your future academic pursuits or career endeavours. Leverage the experience to enhance your academic performance, shape your career path, and make informed decisions.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* IAP INSTRUCTIONS */}
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
                                            IAP Instructions
                                        </h3>
                                        <div className="pl-8 space-y-4">

                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">Meet Your LO</h4>
                                                </div>
                                                <p className="p-5">It is very important that you obtain the contact number of your LO where they can be contacted outside office hours in case you may need it. Please consult him or her if you have any problems.</p>
                                            </div>

                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">Rules and Regulations</h4>
                                                </div>
                                                <ul className="p-5 space-y-2 list-disc pl-8">
                                                    <li>Once your IAP placement has been confirmed, you are not permitted to change your attachment or withdraw from the program without obtaining approval from the RCA IAP coordinator.</li>
                                                    <li>It is mandatory for you to adhere to the rules and regulations that govern employees of the IAP company or institution to which you are attached.</li>
                                                    <li>Any instances of absenteeism, insubordination, tardiness, or misconduct reported against you will result in disciplinary action.</li>
                                                    <li>Direct negotiation with the company regarding matters such as the duration of your attachment, allowance, working hours, leave of absence, working conditions, and rules is strictly prohibited.</li>
                                                    <li>During your attachment, you are not entitled to any leave or days off, including returning to RCA or your home. However, in case of emergencies, please seek permission from your supervisor for a leave of absence. Your LO must also be notified.</li>
                                                    <li>For non-emergency situations, you must apply for a leave of absence from the company or institution&apos;s supervision and inform your LO. Please contact them during regular working hours, excluding weekends.</li>
                                                    <li>If you become ill, please inform your supervisor that you will be consulting a doctor. A Medical Certificate must be submitted to your supervisor on the day you return to work.</li>
                                                    <li>As an intern, you do not possess the authority to negotiate or influence company-wide decisions, such as changes to the organizational structure, budget allocations, or major strategic initiatives.</li>
                                                    <li>Harassment of any kind, including but not limited to sexual harassment, verbal abuse, or discrimination, will not be tolerated. If you experience or witness any form of harassment during your attachment, immediately report it to your supervisor or the designated authority within the company or institution. Confidentiality and appropriate action will be ensured in addressing such complaints.</li>
                                                </ul>
                                            </div>

                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">Allowance</h4>
                                                </div>
                                                <ul className="p-5 space-y-2 list-disc pl-8">
                                                    <li>The provision of an allowance by the company you are attached to is not guaranteed, unless specifically mentioned in your Placement Notice.</li>
                                                    <li>It is important to note that the allowance provided does not directly correspond to the productivity of your work. It is primarily intended as an out-of-pocket allowance.</li>
                                                    <li>In the event that the company fails to fulfil any officially agreed-upon arrangements at the conclusion of your attachment, please contact the designated person-in-charge within the IAP company or institution to address and resolve such matters.</li>
                                                    <li>If you encounter any difficulties or issues with your IAP company that you are unable to resolve independently, please consult your LO for assistance.</li>
                                                </ul>
                                            </div>

                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">Accident</h4>
                                                </div>
                                                <ul className="p-5 space-y-2 list-disc pl-8">
                                                    <li>Ensuring safety for yourself and others involved is of utmost importance. In the event of any injuries or hazards, promptly seek medical assistance or contact emergency services.</li>
                                                    <li>It is crucial to inform your supervisor at the IAP site about any accidents that occur, providing accurate details of the incident, including the date, time, location, and a description of what transpired.</li>
                                                    <li>Please be aware that you are covered under the RCA student&apos;s Accident Insurance Policy. If you require any necessary assistance, consult your IAP coordinator to ensure that you receive the appropriate support.</li>
                                                </ul>
                                            </div>

                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                                                    <h4 className="font-bold text-slate-800">Log Book</h4>
                                                </div>
                                                <ul className="p-5 space-y-2 list-disc pl-8">
                                                    <li>Please read the instructions given in this Log Book as well as those written on the forms before completing them. If in doubt, please consult your LO.</li>
                                                    <li>At the end of each day, take some time to reflect on your activities and write down a detailed account of what you worked on, including tasks, projects, meetings, and any notable accomplishments or challenges.</li>
                                                    <li>Use clear and concise language when describing your activities, focusing on key points and outcomes rather than excessive detail.</li>
                                                    <li>Treat your log book as a valuable resource for self-reflection and future reference, as it can help you track your progress, identify areas for growth, and serve as supporting evidence for any reports, presentations, or evaluations related to your IAP.</li>
                                                </ul>
                                            </div>

                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-200 flex justify-end">
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
                                            <LogbookInput label="Supervisor Department" value={student?.supervisorDepartment} onChange={(v) => setStudent({ ...student, supervisorDepartment: v })} />
                                            <LogbookInput label="Supervisor Tel No." value={student?.supervisorPhone} onChange={(v) => setStudent({ ...student, supervisorPhone: v })} />
                                            <LogbookInput label="Supervisor Email" value={student?.supervisorEmail} onChange={(v) => setStudent({ ...student, supervisorEmail: v })} />
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
                                                {generatedWeeksList.map((weekData, index) => {
                                                    const weekNum = weekData.number;
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
                                                                {log?.status === "COMPLETED" || log?.supervisorSignature ? (
                                                                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest px-2 py-1 bg-green-50 rounded">Signed & Approved</span>
                                                                ) : log?.status === "SUBMITTED" ? (
                                                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-50 rounded">Submitted</span>
                                                                ) : log?.status === "REJECTED" ? (
                                                                    <span className="text-xs font-bold text-red-600 uppercase tracking-widest px-2 py-1 bg-red-50 rounded">Rejected</span>
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
                                                            <div className="flex flex-col items-end gap-1">
                                                                {isFilled && <CheckCircle2 className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-green-500'}`} />}
                                                                {log?.status && log.status !== 'DRAFT' && (
                                                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${log.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                                        log.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-red-100 text-red-700'
                                                                        }`}>
                                                                        {log.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
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
                                                                        const isLocked = log.status === 'COMPLETED' || log.status === 'SUBMITTED';

                                                                        return (
                                                                            <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                                                                                <td className="p-4 font-medium text-slate-700">{day}</td>
                                                                                <td className="p-4">
                                                                                    <textarea
                                                                                        disabled={isLocked}
                                                                                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 resize-none min-h-[80px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 ${isLocked ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
                                                                                        placeholder={isLocked ? "Log is locked" : `Describe tasks performed on ${day}...`}
                                                                                        value={log[`${dayKey}Task`] || ""}
                                                                                        onChange={(e) => updateLogField(expandedWeek, `${dayKey}Task`, e.target.value)}
                                                                                    />
                                                                                </td>
                                                                                <td className="p-4">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="24"
                                                                                        disabled={isLocked}
                                                                                        className={`w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-center text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${isLocked ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''}`}
                                                                                        value={log[`${dayKey}Hours`] || 8}
                                                                                        onChange={(e) => updateLogField(expandedWeek, `${dayKey}Hours`, parseFloat(e.target.value) || 8)}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                                <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
                                                                    <tr>
                                                                        <td colSpan={2} className="p-4 text-right">Total Hours for the Week:</td>
                                                                        <td className="p-4 text-center">{getSafeLog(expandedWeek).totalHours || 40}</td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>

                                                        {/* Summary & Supervisor Area */}
                                                        <div className="p-6 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 text-primary" /> Student's General Statement on Attachment
                                                                    </h4>
                                                                </div>
                                                                <textarea
                                                                    disabled={getSafeLog(expandedWeek).status !== 'DRAFT' && getSafeLog(expandedWeek).status !== 'REJECTED'}
                                                                    className={`w-full h-48 bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-800 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400 ${(getSafeLog(expandedWeek).status !== 'DRAFT' && getSafeLog(expandedWeek).status !== 'REJECTED') ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}`}
                                                                    placeholder="(e.g. After learning the process of production along with an overview of the company's
                                                                        products in the second week of practice, I was able to understand the characteristics of
                                                                        company A's products anew. It was also a time to feel once again why production
                                                                        management is important in product production.)"
                                                                    value={getSafeLog(expandedWeek).generalStatement || ""}
                                                                    onChange={(e) => updateLogField(expandedWeek, 'generalStatement', e.target.value)}
                                                                />
                                                            </div>

                                                            {/* Supervisor Section */}
                                                            <div className="space-y-4 bg-amber-50/60 p-6 rounded-xl border border-amber-200">
                                                                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                                                                        <h4 className="font-bold text-slate-900 text-md">Supervisor&apos;s Grading</h4>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-amber-700/80">This section is completed by your company supervisor after reviewing your weekly log.</p>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs font-semibold text-slate-500">Grade Awarded</label>
                                                                        <select
                                                                            disabled={true}
                                                                            className="w-full h-10 border border-amber-200 rounded-md px-3 text-sm bg-white/70 cursor-not-allowed text-slate-600"
                                                                            value={getSafeLog(expandedWeek).grade || ""}
                                                                        >
                                                                            <option value="" disabled>Not yet graded</option>
                                                                            <option value="A">A - Excellent</option>
                                                                            <option value="B">B - Good</option>
                                                                            <option value="C">C - Satisfactory</option>
                                                                            <option value="D">D - Poor</option>
                                                                            <option value="E">E - Unacceptable</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-xs font-semibold text-slate-500">Date Signed</label>
                                                                        <input
                                                                            type="date"
                                                                            disabled={true}
                                                                            className="w-full h-10 border border-amber-200 rounded-md px-3 text-sm bg-white/70 cursor-not-allowed"
                                                                            value={formatDate(getSafeLog(expandedWeek).supervisorDate)}
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2 space-y-2">
                                                                        <label className="text-xs font-semibold text-slate-500">Supervisor Name</label>
                                                                        <input
                                                                            type="text"
                                                                            disabled={true}
                                                                            className="w-full h-10 border border-amber-200 rounded-md px-3 text-sm bg-white/70 cursor-not-allowed"
                                                                            value={getSafeLog(expandedWeek).supervisorName || ""}
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2 flex items-center justify-between mt-2 pt-4 border-t border-amber-200">
                                                                        <label className="text-sm font-semibold text-slate-700">Digital Signature</label>
                                                                        <button
                                                                            disabled={true}
                                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-not-allowed ${getSafeLog(expandedWeek).supervisorSignature ? 'bg-green-500' : 'bg-slate-200'}`}
                                                                        >
                                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${getSafeLog(expandedWeek).supervisorSignature ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
                                                            {getSafeLog(expandedWeek).status !== 'DRAFT' && (
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <StatusBadge status={getSafeLog(expandedWeek).status} />
                                                                        <span className="text-xs text-slate-500 font-medium">
                                                                            {getSafeLog(expandedWeek).status === 'COMPLETED'
                                                                                ? "This log has been approved and is locked for editing."
                                                                                : getSafeLog(expandedWeek).status === 'SUBMITTED'
                                                                                    ? "This log has been submitted and is locked for editing."
                                                                                    : "This log was rejected. Please address the feedback below and re-submit."}
                                                                        </span>
                                                                    </div>
                                                                    {getSafeLog(expandedWeek).status === 'REJECTED' && getSafeLog(expandedWeek).supervisorNote && (
                                                                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                                                                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                                                            <div className="space-y-1">
                                                                                <p className="text-[10px] font-black uppercase text-red-400 tracking-wider">Supervisor Feedback</p>
                                                                                <p className="text-xs text-red-700 font-medium leading-relaxed italic">&quot;{getSafeLog(expandedWeek).supervisorNote}&quot;</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-4 ml-auto">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleSaveWeeklyLog(getSafeLog(expandedWeek))}
                                                                    disabled={isSaving || (getSafeLog(expandedWeek).status === 'COMPLETED' || getSafeLog(expandedWeek).status === 'SUBMITTED')}
                                                                    className="h-12 px-8 rounded-lg border-primary text-primary hover:bg-primary/5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Save Draft
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleSubmitWeeklyLog(getSafeLog(expandedWeek))}
                                                                    disabled={isSaving || (getSafeLog(expandedWeek).status === 'COMPLETED' || getSafeLog(expandedWeek).status === 'SUBMITTED')}
                                                                    className="h-12 px-8 rounded-lg bg-primary text-white font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit</>}
                                                                </Button>
                                                            </div>
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
                                <CardHeader className="bg-white p-8 border-b border-slate-200">
                                    <div className="flex flex-col gap-2">
                                        <CardTitle className="text-2xl font-black text-slate-900 border-b-2 border-primary pb-2 w-fit">Industrial Attachment Result Report (for students)</CardTitle>
                                        <p className="text-slate-500 text-sm font-medium italic">Complete all sections of this final outcome report professionally.</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    {/* Identification Table */}
                                    <div className="border-2 border-slate-900 overflow-hidden rounded-sm">
                                        <div className="grid grid-cols-4 border-b border-slate-900">
                                            <div className="p-4 bg-slate-50 border-r border-slate-900 font-bold text-xs uppercase flex items-center">Name</div>
                                            <div className="p-4 border-r border-slate-900 text-sm font-medium flex items-center">{student?.fullName || "—"}</div>
                                            <div className="p-4 bg-slate-50 border-r border-slate-900 font-bold text-xs uppercase flex items-center">Name of Unit</div>
                                            <div className="p-4 flex items-center">
                                                <input
                                                    className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-primary outline-none py-1 text-sm"
                                                    value={report.nameOfUnit || ""}
                                                    onChange={(e) => setReport({ ...report, nameOfUnit: e.target.value })}
                                                    placeholder="Specify Unit..."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 border-b border-slate-900">
                                            <div className="p-4 bg-slate-50 border-r border-slate-900 font-bold text-xs uppercase flex items-center leading-tight">Name of<br />Company/Institution</div>
                                            <div className="p-4 border-r border-slate-900 text-sm font-medium flex items-center">{student?.companyName || "—"}</div>
                                            <div className="p-4 bg-slate-50 border-r border-slate-900 font-bold text-xs uppercase flex items-center text-center">Confirmation of Personnel-in-Charge in Company</div>
                                            <div className="p-4 text-xs italic text-slate-400 flex items-end justify-center">(signature)</div>
                                        </div>
                                        <div className="grid grid-cols-4 whitespace-normal">
                                            <div className="p-4 bg-slate-50 border-r border-slate-900 font-bold text-xs uppercase flex items-center">Training Period</div>
                                            <div className="p-4 border-r border-slate-900 text-sm font-medium flex items-center">
                                                {student?.internshipStart ? new Date(student.internshipStart).toLocaleDateString() : ""} ~ {student?.internshipEnd ? new Date(student.internshipEnd).toLocaleDateString() : ""}
                                            </div>
                                            <div className="col-span-2"></div>
                                        </div>
                                    </div>

                                    {/* Overview and Contents */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-3">
                                                <div className="h-6 w-1.5 bg-primary"></div> Overview and Goals of Placement
                                            </h3>
                                            <textarea
                                                className="w-full h-48 p-5 bg-white border-2 border-slate-900 rounded-sm text-sm resize-none focus:ring-0 focus:border-primary transition-colors"
                                                value={report.overviewGoals || ""}
                                                onChange={(e) => setReport({ ...report, overviewGoals: e.target.value })}
                                                placeholder="What were the main objectives of your industrial attachment?"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-3">
                                                <div className="h-6 w-1.5 bg-primary"></div> Contents of Training
                                            </h3>
                                            <textarea
                                                className="w-full h-48 p-5 bg-white border-2 border-slate-900 rounded-sm text-sm resize-none focus:ring-0 focus:border-primary transition-colors"
                                                value={report.contentsTraining || ""}
                                                onChange={(e) => setReport({ ...report, contentsTraining: e.target.value })}
                                                placeholder="Describe the technical workflows and systems you interacted with..."
                                            />
                                        </div>
                                    </div>

                                    {/* Satisfaction Matrix */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-3">
                                            <div className="h-6 w-1.5 bg-primary"></div> Satisfaction with Industrial Attachment
                                        </h3>
                                        <div className="border-2 border-slate-900">
                                            <div className="grid grid-cols-[1fr_100px_100px_100px] bg-slate-50 border-b border-slate-900">
                                                <div className="p-3 border-r border-slate-900"></div>
                                                {['Excellent', 'Average', 'Poor'].map(level => (
                                                    <div key={level} className="p-3 border-r last:border-0 border-slate-900 text-center font-bold text-[10px] uppercase tracking-wider">{level}</div>
                                                ))}
                                            </div>
                                            {[
                                                { label: 'Satisfaction with industry', key: 'satisfactionIndustry' },
                                                { label: 'Satisfaction with relevant major', key: 'satisfactionMajor' },
                                                { label: 'Satisfaction with practical work', key: 'satisfactionPractical' },
                                                { label: 'Satisfaction with instructors', key: 'satisfactionInstructors' }
                                            ].map(({ label, key }) => (
                                                <div key={key} className="grid grid-cols-[1fr_100px_100px_100px] border-b last:border-0 border-slate-900 group">
                                                    <div className="p-4 border-r border-slate-900 font-medium text-sm flex items-center group-hover:bg-slate-50 transition-colors">{label}</div>
                                                    {['Excellent', 'Average', 'Poor'].map((level) => (
                                                        <div
                                                            key={level}
                                                            onClick={() => setReport({ ...report, [key]: level })}
                                                            className={`p-4 border-r last:border-0 border-slate-900 flex items-center justify-center cursor-pointer transition-all ${report[key as keyof IapReport] === level ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${report[key as keyof IapReport] === level ? 'border-primary bg-primary shadow-sm' : 'border-slate-300'}`}>
                                                                {report[key as keyof IapReport] === level && <Check className="h-4 w-4 text-white" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notable Achievements and Career Plan */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-slate-900">
                                        <div className="border-b md:border-b-0 md:border-r border-slate-900 flex flex-col min-h-[250px]">
                                            <div className="p-3 bg-slate-50 border-b border-slate-900 font-bold text-[10px] uppercase tracking-widest text-center">Notable Achievements</div>
                                            <textarea
                                                className="flex-1 p-4 text-sm bg-transparent outline-none resize-none"
                                                value={report.notableAchievements || ""}
                                                onChange={(e) => setReport({ ...report, notableAchievements: e.target.value })}
                                                placeholder="Key milestones during training..."
                                            />
                                        </div>
                                        <div className="flex flex-col min-h-[250px]">
                                            <div className="p-3 bg-slate-50 border-b border-slate-900 font-bold text-[10px] uppercase tracking-widest text-center">Future Career Plan</div>
                                            <textarea
                                                className="flex-1 p-4 text-sm bg-transparent outline-none resize-none"
                                                value={report.futureCareerPlan || ""}
                                                onChange={(e) => setReport({ ...report, futureCareerPlan: e.target.value })}
                                                placeholder="Career trajectory and goals..."
                                            />
                                        </div>
                                    </div>

                                    <div className="border-2 border-slate-900">
                                        <div className="p-3 bg-slate-50 border-b border-slate-900 font-bold text-[10px] uppercase tracking-widest text-center">Suggestions</div>
                                        <textarea
                                            className="w-full h-32 p-4 text-sm bg-transparent outline-none resize-none"
                                            value={report.suggestions || ""}
                                            onChange={(e) => setReport({ ...report, suggestions: e.target.value })}
                                            placeholder="Feedback for the department or industry..."
                                        />
                                    </div>

                                    {/* Form Feedback from Image 5 */}
                                    <div className="pt-12 border-t-2 border-slate-900 space-y-8">
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                                            <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Programme Feedback Questions</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <SurveCheckButton label="Have the Programme been useful or relevant to you?" active={report.isUseful} onClick={() => setReport({ ...report, isUseful: true })} onDecline={() => setReport({ ...report, isUseful: false })} />
                                                <SurveCheckButton label="Have the Programme improved your understanding of your subjects of study?" active={report.improvedUnderstanding} onClick={() => setReport({ ...report, improvedUnderstanding: true })} onDecline={() => setReport({ ...report, improvedUnderstanding: false })} />
                                                <SurveCheckButton label="Have the Programme provided you with experiences about working life?" active={report.providedExperiences} onClick={() => setReport({ ...report, providedExperiences: true })} onDecline={() => setReport({ ...report, providedExperiences: false })} />
                                                <div className="space-y-4">
                                                    <label className="text-sm font-bold text-slate-700 block">Number of times an LO visited you:</label>
                                                    <input
                                                        type="number"
                                                        className="w-20 bg-white border border-slate-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                        value={report.loVisitCount || 0}
                                                        onChange={(e) => setReport({ ...report, loVisitCount: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-xs font-black text-slate-900 border-l-4 border-primary pl-3 uppercase mb-6 whitespace-normal leading-relaxed">Please tick the type of Programme you have been put through. (You can tick more than one box)</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {[
                                                    "Assisting in software development and coding tasks.",
                                                    "Participating in the design, implementation, and testing of SW systems.",
                                                    "Debugging and troubleshooting software issues.",
                                                    "Collaborating with the development team to enhance existing software applications.",
                                                    "Conducting research and feasibility studies for new SW features or technologies.",
                                                    "Writing and maintaining technical documentation and user manuals.",
                                                    "Participating in code reviews and providing feedback on code quality.",
                                                    "Assisting in the development of embedded systems firmware or software.",
                                                    "Testing and validating embedded systems functionality.",
                                                    "Collaborating with HW engineers in the integration of SW and HW components.",
                                                    "Conducting performance optimization and memory management for embedded systems."
                                                ].map((activity) => (
                                                    <label key={activity} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary/30 transition-all cursor-pointer group shadow-sm">
                                                        <div className="relative flex items-center h-5">
                                                            <input
                                                                type="checkbox"
                                                                checked={report.programmeTypes?.includes(activity)}
                                                                onChange={(e) => {
                                                                    const types = report.programmeTypes || [];
                                                                    if (e.target.checked) {
                                                                        setReport({ ...report, programmeTypes: [...types, activity] });
                                                                    } else {
                                                                        setReport({ ...report, programmeTypes: types.filter(t => t !== activity) });
                                                                    }
                                                                }}
                                                                className="h-5 w-5 rounded border-2 border-slate-300 text-primary accent-primary focus:ring-offset-0 focus:ring-primary/20 cursor-pointer"
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 leading-normal">{activity}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="mt-6">
                                                <LogbookInput label="Others (Please describe them below)" value={report.otherProgrammeDetails} onChange={(v) => setReport({ ...report, otherProgrammeDetails: v })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-200 flex justify-end">
                                        <Button onClick={handleSaveReport} disabled={isSaving} className="h-12 px-8 rounded-lg bg-primary text-white font-bold shadow-sm hover:bg-primary/90">
                                            {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Save Final Report"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {currentStep === 5 && (
                            <Card className="rounded-2xl border-2 border-primary shadow-xl bg-white overflow-hidden scroll-mt-20" id="assessment-vault">
                                <CardHeader className="bg-primary p-10 border-b border-primary/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ShieldCheck className="h-32 w-32 text-white" />
                                    </div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <LockKeyhole className="h-6 w-6 text-white" />
                                                </div>
                                                <span className="text-primary-foreground/80 font-black uppercase tracking-[0.2em] text-[10px]">Secure Documentation Vault</span>
                                            </div>
                                            <CardTitle className="text-3xl md:text-4xl font-black text-white leading-tight">Industrial Attachment Assessment</CardTitle>
                                            <p className="text-primary-foreground/70 text-sm font-medium italic">Standardized evaluation and final marking scheme from your host company.</p>
                                        </div>
                                        <div className="h-24 w-40 rounded-2xl bg-white flex flex-col items-center justify-center shadow-2xl border-4 border-primary/20">
                                            <span className="text-[13px] font-semibold text-slate-400">Final Weighted Grade</span>
                                            <span className="text-4xl font-black text-primary">
                                                {student?.ratings?.[0]?.rating !== undefined ? `${student.ratings[0].rating}` : "—"}
                                            </span>
                                            <span className="text-[16px] text-slate-400 font-semibold">/ 100</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-12 min-h-[400px]">
                                    {!student?.ratings?.[0] ? (
                                        <div className="py-24 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                            <div className="h-16 w-16 bg-white rounded-full border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                                                <LockKeyhole className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div className="max-w-xs mx-auto space-y-2">
                                                <h3 className="text-xl font-black text-slate-700 tracking-tight">Assessment Sealed</h3>
                                                <p className="text-sm text-slate-500 leading-relaxed">The industrial evaluation vault is currently locked. Records will appear here once the supervisor submits your formal rating.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {student?.ratings?.[0] ? (
                                                <div className="space-y-10">
                                                    {/* Student Report Summary Section */}
                                                    <div className="bg-slate-50 border-2 border-slate-900 overflow-hidden">
                                                        <div className="bg-slate-900 text-white p-4 font-black uppercase text-xs tracking-widest">
                                                            Student Training Summary
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-900">
                                                            <div className="p-6 space-y-3">
                                                                <h4 className="text-[10px] font-black uppercase text-primary tracking-tighter">Overview & Goals</h4>
                                                                <p className="text-sm text-slate-700 leading-relaxed italic">"{report.overviewGoals || "No overview provided."}"</p>
                                                            </div>
                                                            <div className="p-6 space-y-3">
                                                                <h4 className="text-[10px] font-black uppercase text-primary tracking-tighter">Key Training Contents</h4>
                                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{report.contentsTraining || "No training details provided."}</p>
                                                            </div>
                                                            <div className="p-6 space-y-3 bg-white">
                                                                <h4 className="text-[10px] font-black uppercase text-primary tracking-tighter">Notable Achievements</h4>
                                                                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                                                                    <p className="text-sm text-green-800 font-bold leading-tight">{report.notableAchievements || "N/A"}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white border-2 border-slate-900 p-0 overflow-hidden">
                                                        {/* header */}
                                                        <div className="border-b-2 border-slate-900 p-6 flex flex-col items-center justify-center space-y-4">
                                                            <div className="w-full space-y-4 pt-4 px-4">
                                                                <div className="flex gap-2 items-end">
                                                                    <span className="text-sm font-bold whitespace-nowrap">Student name:</span>
                                                                    <div className="flex-1 border-b border-black border-dotted h-5 text-sm uppercase px-2">{student?.fullName || "................................................................................................................................................"}</div>
                                                                </div>
                                                                <div className="flex gap-2 items-end">
                                                                    <span className="text-sm font-bold whitespace-nowrap">Department/Class:</span>
                                                                    <div className="flex-1 border-b border-black border-dotted h-5 text-sm uppercase px-2">{student?.studentProfile?.department || "................................................................................................................................................"}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* marking scheme title */}
                                                        <div className="bg-slate-50 border-b-2 border-slate-900 py-3 text-center">
                                                            <span className="text-sm font-black uppercase tracking-widest">Marking Scheme</span>
                                                        </div>

                                                        {/* main table */}
                                                        <div className="relative overflow-x-auto">
                                                            <table className="w-full border-collapse text-xs">
                                                                <thead>
                                                                    <tr className="border-b-2 border-slate-900">
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 py-4 h-32">Evaluation area</th>
                                                                        <th className="border-r border-slate-400 p-1 font-black w-8"></th>
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase text-center w-48">Evaluation item</th>
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase text-center w-16">Very High</th>
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase text-center w-16">High</th>
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase text-center w-16">Average</th>
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase text-center w-16">Low</th>
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase text-center w-16">Very Low</th>
                                                                        <th className="border-r border-slate-400 p-2 font-black uppercase text-center w-16">Score</th>
                                                                        <th className="p-4 text-[10px] w-48 align-top leading-relaxed italic bg-slate-50 font-medium">
                                                                            * Mark the score for each evaluation item and add up the total score and record it in the score column.
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {(() => {
                                                                        const assignmentRowConfig = [
                                                                            { id: 'knowledgeWirelessOps', key: 0 },
                                                                            { id: 'knowledgeWirelessEst', key: 1 },
                                                                            { id: 'knowledgeWirelessMaint', key: 2 },
                                                                            { id: 'knowledgeApplication', key: 3 },
                                                                        ];

                                                                        const displayRows = tasks.length > 0
                                                                            ? assignmentRowConfig.slice(0, Math.min(tasks.length, 4))
                                                                            : [assignmentRowConfig[0]];

                                                                        const assignmentsScore = displayRows.reduce((acc, row) => {
                                                                            return acc + (student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] || 0);
                                                                        }, 0);

                                                                        return displayRows.map((item, i) => {
                                                                            const task = tasks[item.key];
                                                                            const label = task ? task.title : "Related Knowledge";
                                                                            const savedScore = student?.ratings?.[0]?.[item.id as keyof typeof student.ratings[0]] as number;

                                                                            return (
                                                                                <tr key={item.id} className="border-b border-slate-300">
                                                                                    {i === 0 && (
                                                                                        <td rowSpan={displayRows.length} className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-50">
                                                                                            Assignments
                                                                                        </td>
                                                                                    )}
                                                                                    <td className="border-r border-slate-300 p-2 text-center font-bold">{i + 1}</td>
                                                                                    <td className="border-r border-slate-300 p-3 leading-tight min-w-[200px]">
                                                                                        {label}
                                                                                    </td>
                                                                                    {[10, 9, 8, 7, 6].map(val => (
                                                                                        <td key={val} className="border-r border-slate-300 p-2 text-center">
                                                                                            <div
                                                                                                className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg border-2 ${savedScore === val ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-md font-bold" : "border-transparent text-slate-300 font-bold"}`}
                                                                                            >
                                                                                                {val}
                                                                                            </div>
                                                                                        </td>
                                                                                    ))}
                                                                                    <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-50">
                                                                                        {i === 0 ? `/40` : ""}
                                                                                    </td>
                                                                                    {i === 0 && (
                                                                                        <td rowSpan={displayRows.length} className="p-4 align-middle bg-white">
                                                                                            <div className="h-20 w-full border-4 border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                                                                                                <span className="text-[10px] font-black uppercase text-slate-400">sum</span>
                                                                                                <span className="text-2xl font-black text-slate-900">{assignmentsScore}</span>
                                                                                            </div>
                                                                                        </td>
                                                                                    )}
                                                                                </tr>
                                                                            );
                                                                        });
                                                                    })()}

                                                                    {/* Attitude Area */}
                                                                    {[
                                                                        { id: 'responsibility', label: 'Responsibility', index: 1 },
                                                                        { id: 'cooperativeness', label: 'Cooperativeness', index: 2 },
                                                                        { id: 'complianceEtiquette', label: 'Compliance with company rules and workplace etiquette', index: 3 },
                                                                    ].map((item, i, arr) => {
                                                                        const attitudeScore = arr.reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);
                                                                        const savedScore = student?.ratings?.[0]?.[item.id as keyof typeof student.ratings[0]] as number;

                                                                        return (
                                                                            <tr key={item.id} className="border-b border-slate-300">
                                                                                {i === 0 && (
                                                                                    <td rowSpan={3} className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-50">
                                                                                        Attitude
                                                                                    </td>
                                                                                )}
                                                                                <td className="border-r border-slate-300 p-2 text-center font-bold">{item.index}</td>
                                                                                <td className="border-r border-slate-300 p-3 leading-tight">{item.label}</td>
                                                                                {[10, 9, 8, 7, 6].map(val => (
                                                                                    <td key={val} className="border-r border-slate-300 p-2 text-center">
                                                                                        <div
                                                                                            className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg border-2 ${savedScore === val ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-md font-bold" : "border-transparent text-slate-300 font-bold"}`}
                                                                                        >
                                                                                            {val}
                                                                                        </div>
                                                                                    </td>
                                                                                ))}
                                                                                <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-50">
                                                                                    {i === 0 ? `/30` : ""}
                                                                                </td>
                                                                                {i === 0 && (
                                                                                    <td rowSpan={3} className="p-4 align-middle bg-white">
                                                                                        <div className="h-20 w-full border-4 border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                                                                                            <span className="text-[10px] font-black uppercase text-slate-400">sum</span>
                                                                                            <span className="text-2xl font-black text-slate-900">{attitudeScore}</span>
                                                                                        </div>
                                                                                    </td>
                                                                                )}
                                                                            </tr>
                                                                        );
                                                                    })}

                                                                    {/* Safety Area */}
                                                                    {(() => {
                                                                        const assignmentsScore = [
                                                                            { id: 'knowledgeWirelessOps', key: 0 },
                                                                            { id: 'knowledgeWirelessEst', key: 1 },
                                                                            { id: 'knowledgeWirelessMaint', key: 2 },
                                                                            { id: 'knowledgeApplication', key: 3 },
                                                                        ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                        const attitudeScore = [
                                                                            { id: 'responsibility' },
                                                                            { id: 'cooperativeness' },
                                                                            { id: 'complianceEtiquette' }
                                                                        ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                        const safetyItems = [
                                                                            { id: 'safetyAwareness', label: 'Awareness of safety management', index: 1 },
                                                                            { id: 'safetyCompliance', label: 'Compliance with safety rules', index: 2 },
                                                                            { id: 'safetyArrangement', label: 'Arrangement of safety instruments', index: 3 },
                                                                        ];

                                                                        const safetyScore = safetyItems.reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                        return safetyItems.map((item, i) => {
                                                                            const savedScore = student?.ratings?.[0]?.[item.id as keyof typeof student.ratings[0]] as number;

                                                                            return (
                                                                                <tr key={item.id} className="border-b border-slate-300">
                                                                                    {i === 0 && (
                                                                                        <td rowSpan={3} className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-50">
                                                                                            Safety Management
                                                                                        </td>
                                                                                    )}
                                                                                    <td className="border-r border-slate-300 p-2 text-center font-bold">{item.index}</td>
                                                                                    <td className="border-r border-slate-300 p-3 leading-tight">{item.label}</td>
                                                                                    {[10, 9, 8, 7, 6].map(val => (
                                                                                        <td key={val} className="border-r border-slate-300 p-2 text-center">
                                                                                            <div className={`h-8 w-8 mx-auto flex items-center justify-center rounded-lg border-2 ${savedScore === val ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-md font-bold" : "border-transparent text-slate-300 font-bold"}`}>
                                                                                                {val}
                                                                                            </div>
                                                                                        </td>
                                                                                    ))}
                                                                                    <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-50">
                                                                                        {i === 0 ? `/30` : ""}
                                                                                    </td>
                                                                                    {i === 0 && (
                                                                                        <td rowSpan={3} className="p-4 align-middle bg-slate-50 border-l-4 border-slate-900">
                                                                                            <div className="text-center space-y-2">
                                                                                                <span className="text-[10px] font-black uppercase block">Total Score</span>
                                                                                                <div className="text-4xl font-black text-slate-900">{assignmentsScore + attitudeScore + safetyScore}/100</div>
                                                                                            </div>
                                                                                        </td>
                                                                                    )}
                                                                                </tr>
                                                                            );
                                                                        });
                                                                    })()}

                                                                    {/* Attendance Block */}
                                                                    {(() => {
                                                                        const absentDays = student?.absentDays || 0;
                                                                        const attendanceRaw = Math.max(0, 100 - (absentDays * 10));

                                                                        const assignmentsScore = [
                                                                            { id: 'knowledgeWirelessOps', key: 0 },
                                                                            { id: 'knowledgeWirelessEst', key: 1 },
                                                                            { id: 'knowledgeWirelessMaint', key: 2 },
                                                                            { id: 'knowledgeApplication', key: 3 },
                                                                        ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                        const attitudeScore = [
                                                                            { id: 'responsibility' },
                                                                            { id: 'cooperativeness' },
                                                                            { id: 'complianceEtiquette' }
                                                                        ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                        const safetyScore = [
                                                                            { id: 'safetyAwareness' },
                                                                            { id: 'safetyCompliance' },
                                                                            { id: 'safetyArrangement' }
                                                                        ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                        const rawScore = assignmentsScore + attitudeScore + safetyScore;
                                                                        const weightedPerformance = rawScore * 0.8;
                                                                        const attendanceWeighted = attendanceRaw * 0.2;
                                                                        const finalTotal = Math.round((weightedPerformance + attendanceWeighted) * 10) / 10;

                                                                        return (
                                                                            <tr className="border-b-2 border-slate-900">
                                                                                <td className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-900 text-white">
                                                                                    Attendance
                                                                                </td>
                                                                                <td colSpan={7} className="p-8 space-y-4">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <span className="text-sm font-black whitespace-nowrap uppercase">Days of Absence:</span>
                                                                                        <div className="w-24 border-b-2 border-black border-dotted focus:outline-none text-center font-black text-lg h-10 flex items-end justify-center pb-1">
                                                                                            {absentDays}
                                                                                        </div>
                                                                                        <span className="text-[11px] font-medium text-slate-400 italic leading-tight">
                                                                                            * 10 points are deducted for each absence from work per day. However, points will not be deducted for sick leave with supporting documents attached.
                                                                                            <br />
                                                                                            * Unauthorised late arrival, early departure without notice, 3 times of unauthorised results are treated as 1 day of absence from work
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-100">
                                                                                    {attendanceRaw}/100
                                                                                </td>
                                                                                <td className="p-4 align-middle bg-slate-900 text-white">
                                                                                    <div className="text-center space-y-1">
                                                                                        <span className="text-[10px] font-black uppercase block opacity-60">Final weighted</span>
                                                                                        <div className="text-5xl font-black tracking-tighter">{finalTotal}</div>
                                                                                        <span className="text-[10px] font-bold opacity-60">/ 100</span>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })()}

                                                                    {/* Marking Formula Row */}
                                                                    <tr className="bg-slate-50">
                                                                        <td className="border-r-2 border-slate-900 p-3 font-black text-center text-[10px] uppercase">Marking</td>
                                                                        <td colSpan={9} className="p-4 text-xs font-black text-center tracking-wide">
                                                                            (Doing Training assignments + Attitude + Safety management) score × 80% + Attendance (20%)
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* student attendance sheet footer */}
                                                        <div className="bg-white border-none mt-8 overflow-hidden">
                                                            <div className="p-3 bg-slate-50 border-y border-x-2 border-black">
                                                                <span className="text-sm font-black uppercase tracking-widest pl-2">Student attendance sheet</span>
                                                            </div>
                                                            {(() => {
                                                                const absentDays = student?.absentDays || 0;
                                                                const attendanceRaw = Math.max(0, 100 - (absentDays * 10));

                                                                const assignmentsScore = [
                                                                    { id: 'knowledgeWirelessOps', key: 0 },
                                                                    { id: 'knowledgeWirelessEst', key: 1 },
                                                                    { id: 'knowledgeWirelessMaint', key: 2 },
                                                                    { id: 'knowledgeApplication', key: 3 },
                                                                ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                const attitudeScore = [
                                                                    { id: 'responsibility' },
                                                                    { id: 'cooperativeness' },
                                                                    { id: 'complianceEtiquette' }
                                                                ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                const safetyScore = [
                                                                    { id: 'safetyAwareness' },
                                                                    { id: 'safetyCompliance' },
                                                                    { id: 'safetyArrangement' }
                                                                ].reduce((acc, row) => acc + ((student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] as number) || 0), 0);

                                                                const rawScore = assignmentsScore + attitudeScore + safetyScore;
                                                                const weightedPerformance = rawScore * 0.8;
                                                                const attendanceWeighted = attendanceRaw * 0.2;
                                                                const finalTotal = Math.round((weightedPerformance + attendanceWeighted) * 10) / 10;

                                                                return (
                                                                    <div className="grid grid-cols-1 md:grid-cols-4 border-b-2 border-x-2 border-slate-900">
                                                                        <div className="border-r border-slate-900 p-6 flex items-center justify-center bg-slate-50">
                                                                            <span className="text-sm font-black uppercase">Scheme</span>
                                                                        </div>
                                                                        <div className="col-span-3 p-6 flex flex-col gap-4">
                                                                            {/* Performance component */}
                                                                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                                                                <span className="font-bold text-slate-500 italic">performance score</span>
                                                                                <div className="border-b-2 border-black w-12 text-center font-black text-slate-900">{rawScore}</div>
                                                                                <span className="font-bold text-slate-500">× 80% =</span>
                                                                                <div className="border-b-2 border-black border-dotted w-14 text-center font-black text-slate-900">{Math.round(weightedPerformance * 10) / 10}</div>
                                                                            </div>
                                                                            {/* Attendance component */}
                                                                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                                                                <span className="font-bold text-slate-500 italic">attendance score</span>
                                                                                <div className="border-b-2 border-black w-12 text-center font-black text-slate-900">{attendanceRaw}</div>
                                                                                <span className="font-bold text-slate-500">× 20% =</span>
                                                                                <div className="border-b-2 border-black border-dotted w-14 text-center font-black text-slate-900">{Math.round(attendanceWeighted * 10) / 10}</div>
                                                                            </div>
                                                                            {/* Final total */}
                                                                            <div className="flex items-center gap-2 text-base border-t border-slate-200 pt-4 flex-wrap">
                                                                                <span className="font-black">Total</span>
                                                                                <div className="border-b-2 border-black w-14 text-center font-black text-slate-900 text-lg">{finalTotal}</div>
                                                                                <span className="font-black text-slate-500">/ 100</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                            <div className="p-8 border-b-2 border-x-2 border-slate-900 text-center">
                                                                {(() => {
                                                                    const fmt = (dateStr: string | null | undefined, part: 'dd' | 'mm' | 'yyyy') => {
                                                                        if (!dateStr) return part === 'yyyy' ? '202X' : part === 'mm' ? 'mm.' : 'dd.';
                                                                        const d = new Date(dateStr);
                                                                        if (isNaN(d.getTime())) return part === 'yyyy' ? '202X' : part === 'mm' ? 'mm.' : 'dd.';
                                                                        if (part === 'dd') return String(d.getDate()).padStart(2, '0') + '.';
                                                                        if (part === 'mm') return String(d.getMonth() + 1).padStart(2, '0') + '.';
                                                                        return String(d.getFullYear());
                                                                    };
                                                                    const start = student?.internshipStart;
                                                                    const end = student?.internshipEnd;
                                                                    return (
                                                                        <div className="flex items-center justify-center gap-3 text-sm font-bold flex-wrap">
                                                                            <span>Period</span>
                                                                            <div className={`border-b border-black border-dotted w-12 text-center ${start ? 'text-slate-900' : 'text-slate-400'}`}>{fmt(start, 'dd')}</div>
                                                                            <div className={`border-b border-black border-dotted w-12 text-center ${start ? 'text-slate-900' : 'text-slate-400'}`}>{fmt(start, 'mm')}</div>
                                                                            <div className={`border-b border-black border-dotted w-16 text-center ${start ? 'text-slate-900' : 'text-slate-400'}`}>{fmt(start, 'yyyy')}</div>
                                                                            <span>~</span>
                                                                            <div className={`border-b border-black border-dotted w-12 text-center ${end ? 'text-slate-900' : 'text-slate-400'}`}>{fmt(end, 'dd')}</div>
                                                                            <div className={`border-b border-black border-dotted w-12 text-center ${end ? 'text-slate-900' : 'text-slate-400'}`}>{fmt(end, 'mm')}</div>
                                                                            <div className={`border-b border-black border-dotted w-16 text-center ${end ? 'text-slate-900' : 'text-slate-400'}`}>{fmt(end, 'yyyy')}</div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-4 border-b-2 border-x-2 border-slate-900 min-h-[160px]">
                                                                <div className="border-r border-slate-900 p-6 flex items-center justify-center bg-slate-50 text-center">
                                                                    <span className="text-sm font-black uppercase">Overall<br />Review</span>
                                                                </div>
                                                                <div className="col-span-3 p-6 text-sm text-slate-700 whitespace-pre-wrap">
                                                                    {student?.ratings?.[0]?.comment || "No review provided."}
                                                                </div>
                                                            </div>
                                                            <div className="p-10 space-y-8 bg-slate-50 border-x-2 border-b-2 border-slate-900">
                                                                <div className="flex gap-4 items-end">
                                                                    <span className="text-sm font-bold uppercase w-48">Company Name:</span>
                                                                    <div className="flex-1 h-6 font-semibold px-4 border-b-2 border-black border-dotted">{student?.companyName || "................................................................................................................................"}</div>
                                                                </div>
                                                                <div className="flex gap-4 items-end">
                                                                    <span className="text-sm font-bold uppercase w-48">Evaluator's Position:</span>
                                                                    <div className="flex-1 h-6 font-semibold px-4 border-b-2 border-black border-dotted">
                                                                        {student?.supervisor?.role || "................................................................................................................................"}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-4 items-end">
                                                                    <span className="text-sm font-bold uppercase w-48">Evaluator's Name / Sign:</span>
                                                                    <div className="flex-1 h-6 font-semibold px-4 border-b-2 border-black border-dotted relative">
                                                                        <div className="absolute inset-0 flex items-center justify-between px-4">
                                                                            <span>{student?.supervisor?.user?.name || ""}</span>
                                                                            {student?.ratings?.[0] && <span className="font-[signature] text-2xl text-slate-800 -rotate-3">{student?.supervisor?.user?.name}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            ) : (
                                                <div className="p-6 text-center text-slate-500">
                                                    No ratings available.
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
} 