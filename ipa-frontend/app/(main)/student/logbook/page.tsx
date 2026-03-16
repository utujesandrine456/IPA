"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    Plus, Loader2, FileText, CheckSquare, MessageSquare,
    Star, Building2, User, Calendar, ChevronDown,
    ChevronUp, Download, CheckCircle2, AlertCircle,
    ShieldCheck, LockKeyhole, Check, Zap
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast, Toaster } from "react-hot-toast";
import DOMPurify from "dompurify";
import { jostregular } from "@/lib/fonts/jost-regular";
import { jostbold } from "@/lib/fonts/jost-bold";

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

function LogbookSelect({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
    return (
        <div className="space-y-2 group">
            <label className="text-xs font-semibold text-slate-500 group-hover:text-primary transition-colors">{label}</label>
            <select
                className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm outline-none appearance-none"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" disabled>Select {label}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
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
    regNo?: string;
    phoneNo?: string;
    iapCompanyAttached?: string;
}

export default function StudentLogbookPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [user, setUser] = useState<any>(null);
    const [student, setStudent] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
    const [report, setReport] = useState<IapReport>({
        nameOfUnit: "",
        overviewGoals: "",
        contentsTraining: "",
        programmeTypes: [],
        regNo: "",
        phoneNo: "",
        iapCompanyAttached: "",
        loVisitCount: 0,
        otherProgrammeDetails: ""
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

    // Auto-refresh ratings when entering Step 5 (Assessment Vault)
    useEffect(() => {
        if (currentStep === 5) {
            fetchData();
        }
    }, [currentStep]);

    // Auto-fill logic when student data is available
    useEffect(() => {
        if (student) {
            // Auto-fill Report if it's empty
            setReport(prev => {
                const newReport = { ...prev };
                let changed = false;

                if (!newReport.nameOfUnit && student.firstName) {
                    newReport.nameOfUnit = `${student.firstName} ${student.lastName}`;
                    changed = true;
                }
                
                // Note: user said "once they must be filled automatically every-when they are need"
                // So we check if fields are empty and fill them from student profile
                if (!newReport.phoneNo && student.phone) {
                    newReport.phoneNo = student.phone;
                    changed = true;
                }
                
                if (!newReport.regNo && student.studentNumber) {
                    newReport.regNo = student.studentNumber;
                    changed = true;
                }

                if (!newReport.iapCompanyAttached && student.companyName) {
                    newReport.iapCompanyAttached = student.companyName;
                    changed = true;
                }

                return changed ? newReport : prev;
            });

            // Update weekly logs with dates and supervisor if they are missing
            if (student.internshipStart && student.internshipEnd) {
                setWeeklyLogs(prev => {
                    return prev.map(log => {
                        const weekData = generatedWeeksList.find(w => w.number === log.weekNumber);
                        const updated = { ...log };
                        let changed = false;

                        if (!updated.startDate && weekData) {
                            updated.startDate = weekData.start;
                            changed = true;
                        }
                        if (!updated.endDate && weekData) {
                            updated.endDate = weekData.end;
                            changed = true;
                        }
                        if (!updated.supervisorName && student.supervisorName) {
                            updated.supervisorName = student.supervisorName;
                            changed = true;
                        }

                        return changed ? updated : log;
                    });
                });
            }
        }
    }, [student]);

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
                        storedUser.name = student.fullName;
                        storedUser.profileCompleted = true;
                        if (storedUser.studentProfile) {
                            storedUser.studentProfile.fullName = student.fullName;
                            storedUser.studentProfile.profileCompleted = true;
                        }
                        localStorage.setItem("user", JSON.stringify(storedUser));
                        setUser(storedUser);
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
        let currentCoordinateY = 0;
        const doc = new jsPDF();

        // Add Jost Fonts
        doc.addFileToVFS("Jost-Regular.ttf", jostregular);
        doc.addFileToVFS("Jost-Bold.ttf", jostbold);
        doc.addFont("Jost-Regular.ttf", "Jost", "normal");
        doc.addFont("Jost-Bold.ttf", "Jost", "bold");

        const fontName = "Jost";
        const primaryColor: [number, number, number] = [26, 38, 74];

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
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.4);
            doc.rect(cx, cy - 3.5, 4, 4);
            if (checked) {
                doc.setLineWidth(0.6);
                doc.line(cx + 0.8, cy - 1.5, cx + 1.8, cy - 0.5);
                doc.line(cx + 1.8, cy - 0.5, cx + 3.2, cy - 3);
            }
        };

        const drawField = (label: string, value: string, x: number, y: number, fullWidth: boolean = false) => {
            doc.setFont(fontName, "normal");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const labelWidth = doc.getTextWidth(label + " ");
            doc.text(label, x, y);

            const lineY = y + 1;
            const lineXStart = x + labelWidth;
            const lineXEnd = fullWidth ? 190 : (x < 100 ? 100 : 190);

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.line(lineXStart, lineY, lineXEnd, lineY);

            if (value) {
                doc.setFont(fontName, "bold");
                doc.text(value, lineXStart + 2, y);
            }
            return lineXEnd;
        };

        doc.setTextColor(0, 0, 0);
        doc.setFont(fontName, "bold");
        doc.setFontSize(18);
        doc.text("RWANDA CODING ACADEMY", 105, 30, { align: "center" });
        doc.setFontSize(28);
        doc.text("IAP LOGBOOK", 105, 45, { align: "center" });

        let currentY = 65;
        doc.setFontSize(12);
        doc.setFont(fontName, "bold");
        doc.text("Student details:", 20, currentY);
        currentY += 10;
        drawField("Name of Student", student?.fullName || "", 20, currentY, true);
        currentY += 12;
        drawField("Date of Birth", student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "", 20, currentY);
        drawField("ID/Passport No.", student?.idOrPassport || "", 110, currentY);
        currentY += 12;
        drawField("Reg No.", student?.studentNumber || "", 20, currentY);
        drawField("Cell Phone No.", student?.phone || "", 110, currentY);

        currentY += 20;
        doc.setFont(fontName, "bold");
        doc.text("Company/Institution details:", 20, currentY);
        currentY += 10;
        drawField("Name", student?.companyName || "", 20, currentY, true);
        currentY += 12;
        drawField("Address/Location", student?.companyAddress || "", 20, currentY, true);
        currentY += 12;
        drawField("Tel No.", student?.companyPhone || "", 20, currentY);
        drawField("Email", student?.companyEmail || "", 110, currentY);
        currentY += 12;
        drawField("P.O.Box", student?.companyPOBox || "", 20, currentY);

        currentY += 20;
        doc.setFont(fontName, "bold");
        doc.text("Supervisor details:", 20, currentY);
        currentY += 10;
        drawField("IAP Company Supervisor Name", student?.supervisorName || "", 20, currentY, true);
        currentY += 12;
        drawField("Designation/Title", student?.supervisorDesignation || "", 20, currentY, true);
        currentY += 12;
        drawField("Tel No.", student?.supervisorPhone || "", 20, currentY);
        drawField("Email", student?.supervisorEmail || "", 110, currentY);

        doc.addPage();
        addHeader("IAP OBJECTIVES");
        currentCoordinateY = 40;

        const objectives = [
            "To develop students and enhance their range of skills that are valuable for future careers, including technical skills and transferable skills such as communication, problem-solving, critical thinking, teamwork, adaptability, and time management.",
            "To expose students to the industry they are interested in or studying, allowing them to gain a deeper understanding of industry practices, trends, challenges, and opportunities.",
            "Opportunity for students to build professional networks and establish connections with industry professionals, facilitating future job opportunities, mentorship, and valuable industry contacts.",
            "Students can explore their career interests and clarify their goals by experiencing a real work environment and gaining insights into different roles, industries, and work cultures.",
            "To foster professional growth in students, challenging them, providing new experiences, and offering feedback to develop self-confidence, resilience, adaptability, and a growth mind-set.",
            "To integrate academic learning with practical application, helping students understand how theoretical concepts and classroom learning align with real-world scenarios, enhancing their overall educational experience."
        ];

        objectives.forEach(obj => {
            const lines = doc.splitTextToSize(obj, 160);
            drawCheckbox(20, currentCoordinateY, true); // Objectives are implicitly "met" or just shown with a checkmark in the logbook
            doc.text(lines, 27, currentCoordinateY);
            currentCoordinateY += (lines.length * 6) + 4;
        });

        currentCoordinateY += 10;
        doc.setFont(fontName, "bold");
        doc.text("Key points to keep in mind on a daily basis (Compulsory by the student).", 20, currentCoordinateY);
        currentCoordinateY += 8;
        doc.setFont(fontName, "normal");

        const keyPoints = [
            { section: "Before IAP", points: ["1. Did you meet your IAP coordinator or any Liaison Officer (LO)?"] },
            { section: "During IAP", points: ["2. Did your company supervisor assess you weekly and record on your Log Book?", "3. Did your LO assess your Log Book when you are visited?"] },
            {
                section: "After IAP", points: [
                    "4. Did you send a Thank You letter to your IAP Company/Institution and give a copy to your LO with a reception stamp & signature? (Compulsory)",
                    "5. Did you complete the Student's Report Form?",
                    "6. Did you submit your Log Book plus your IAP-Report to your LO for grading within TWO weeks after the completion of IAP?",
                    "7. Did the LO sign your Log Book pages?"
                ]
            }
        ];

        keyPoints.forEach(kp => {
            doc.setFont(fontName, "bold");
            doc.text(kp.section, 25, currentCoordinateY);
            currentCoordinateY += 6;
            doc.setFont(fontName, "normal");
            kp.points.forEach(p => {
                const lines = doc.splitTextToSize(p, 160);
                doc.text(lines, 30, currentCoordinateY);
                currentCoordinateY += (lines.length * 5) + 2;
            });
            currentCoordinateY += 3;
        });

        doc.addPage();
        addHeader("IAP GUIDELINES");
        currentCoordinateY = 40;

        const guidelines = [
            { title: "1. Introduction", content: "Preparing for an IAP is crucial to ensure a successful and enriching experience. This guide presents instructions to students on how to make the most out of their placement, starting from the preparation phase, during the placement itself, and concluding with the post placement phase. Follow these guidelines to maximize your learning, professional growth, and overall experience." },
            {
                title: "2. Prior to Placement", content: [
                    "Research the Company/Institution where you will be placed and familiarize yourself with it by understand their mission, values, products/services, and any recent news or projects. This will help you align your expectations and demonstrate your interest during the placement.",
                    "Review Placement Objectives and understand the objectives of your placement as communicated by RCA. Review the specific skills and knowledge you are expected to gain and consider how you can actively work towards achieving those objectives during your placement.",
                    "Set personal goals that align with the placement objectives and always reflect on what you hope to achieve during the placement. This will provide a clear focus and direction for your efforts.",
                    "Familiarize yourself with professional etiquette and workplace norms. This includes appropriate behaviour, respect for colleagues and supervisors, confidentiality, punctuality, and a positive attitude. Prepare a professional-looking resume, if required, and bring any necessary identification or documentation requested by the placement host."
                ]
            },
            {
                title: "3. During the Placement", content: [
                    "Be proactive and eager to learn by taking initiative, ask questions, and seek opportunities to contribute to new tasks, projects, and responsibilities that align with your learning goals.",
                    "Observe and learn from your colleagues and supervisors by paying attention to their work practices, communication styles, and problem-solving approaches. Actively seek feedback to improve your performance and demonstrate your commitment to growth.",
                    "Take advantage of networking opportunities within the workplace by engaging with colleagues, attend company events, and seek mentorship from experienced professionals. Building relationships can open your doors for future opportunities and provide valuable guidance.",
                    "Maintain a growth mind-set by embracing challenges and setbacks as learning opportunities. Be open to feedback, adapt to new situations, and continuously seek ways to improve your skills. Embody a growth mind-set that fosters resilience, adaptability, and a commitment to lifelong learning."
                ]
            },
            {
                title: "4. After the Placement", content: [
                    "Take time to reflect on your placement experience by evaluating your accomplishments, challenges faced, and lessons learned. Consider how the experience has contributed to your personal and professional growth.",
                    "Document your achievements, skills acquired, and projects completed during the placement. Update your resume or portfolio to reflect your new experiences and competencies. These will be valuable assets when pursuing future opportunities.",
                    "Seek feedback and recommendations by approaching your supervisors or mentors. Request their insights on your performance and areas for further development. These testimonials can be valuable additions to your professional profile.",
                    "Apply the knowledge, skills, and insights gained during the placement to your future academic pursuits or career endeavours. Leverage the experience to enhance your academic performance, shape your career path, and make informed decisions."
                ]
            }
        ];

        guidelines.forEach(g => {
            if (currentCoordinateY > 260) { doc.addPage(); addHeader("IAP GUIDELINES (CONTINUED)"); currentCoordinateY = 40; }
            doc.setFont(fontName, "bold");
            doc.setFontSize(11);
            doc.text(g.title, 20, currentCoordinateY);
            currentCoordinateY += 8;
            doc.setFont(fontName, "normal");
            doc.setFontSize(10);
            if (Array.isArray(g.content)) {
                g.content.forEach(c => {
                    const lines = doc.splitTextToSize(c, 165);
                    if (currentCoordinateY + (lines.length * 5) > 280) { doc.addPage(); addHeader("IAP GUIDELINES (CONTINUED)"); currentCoordinateY = 40; }

                    // Small square bullet
                    doc.setDrawColor(0, 0, 0);
                    doc.rect(25, currentCoordinateY - 3, 2, 2, 'F');

                    doc.text(lines, 30, currentCoordinateY);
                    currentCoordinateY += (lines.length * 6) + 3;
                });
            } else {
                const lines = doc.splitTextToSize(g.content, 170);
                doc.text(lines, 25, currentCoordinateY);
                currentCoordinateY += (lines.length * 6) + 5;
            }
        });

        doc.addPage();
        addHeader("IAP INSTRUCTIONS");
        currentCoordinateY = 40;

        const instructions = [
            { title: "Meet your LO", content: "It is very important that you obtain the contact number of your LO where they can be contacted outside office hours in case you may need it. Please consult him or her if you have any problems." },
            {
                title: "Rules and Regulations", content: [
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
                title: "Allowance", content: [
                    "The provision of an allowance by the company you are attached to is not guaranteed, unless specifically mentioned in your Placement Notice.",
                    "It is important to note that the allowance provided does not directly correspond to the productivity of your work. It is primarily intended as an out-of-pocket allowance.",
                    "In the event that the company fails to fulfil any officially agreed-upon arrangements at the conclusion of your attachment, please contact the designated person-in-charge within the IAP company or institution to address and resolve such matters.",
                    "If you encounter any difficulties or issues with your IAP company that you are unable to resolve independently, please consult your LO for assistance."
                ]
            },
            {
                title: "Accident", content: [
                    "Ensuring safety for yourself and others involved is of utmost importance. In the event of any injuries or hazards, promptly seek medical assistance or contact emergency services.",
                    "It is crucial to inform your supervisor at the IAP site about any accidents that occur, providing accurate details of the incident, including the date, time, location, and a description of what transpired.",
                    "Please be aware that you are covered under the RCA student's Accident Insurance Policy. If you require any necessary assistance, consult your IAP coordinator to ensure that you receive the appropriate support."
                ]
            },
            {
                title: "Log book", content: [
                    "Please read the instructions given in this Log Book as well as those written on the forms before completing them. If in doubt, please consult your LO.",
                    "At the end of each day, take some time to reflect on your activities and write down a detailed account of what you worked on, including tasks, projects, meetings, and any notable accomplishments or challenges.",
                    "Use clear and concise language when describing your activities, focusing on key points and outcomes rather than excessive detail.",
                    "Treat your log book as a valuable resource for self-reflection and future reference, as it can help you track your progress, identify areas for growth, and serve as supporting evidence for any reports, presentations, or evaluations related to your IAP"
                ]
            }
        ];

        instructions.forEach(inst => {
            if (currentCoordinateY > 260) { doc.addPage(); addHeader("IAP INSTRUCTIONS (CONTINUED)"); currentCoordinateY = 40; }
            doc.setFont(fontName, "bold");
            doc.setFontSize(11);
            doc.text(inst.title, 20, currentCoordinateY);
            currentCoordinateY += 8;
            doc.setFont(fontName, "normal");
            doc.setFontSize(10);
            if (Array.isArray(inst.content)) {
                inst.content.forEach(c => {
                    const lines = doc.splitTextToSize(c, 165);
                    if (currentCoordinateY + (lines.length * 5) > 280) { doc.addPage(); addHeader("IAP INSTRUCTIONS (CONTINUED)"); currentCoordinateY = 40; }

                    // Small square bullet
                    doc.setDrawColor(0, 0, 0);
                    doc.rect(25, currentCoordinateY - 3, 2, 2, 'F');

                    doc.text(lines, 30, currentCoordinateY);
                    currentCoordinateY += (lines.length * 6) + 3;
                });
            } else {
                const lines = doc.splitTextToSize(inst.content, 170);
                doc.text(lines, 25, currentCoordinateY);
                currentCoordinateY += (lines.length * 6) + 5;
            }
        });

        generatedWeeksList.forEach((week) => {
            const log = getSafeLog(week.number);
            doc.addPage();

            doc.setFont(fontName, "bold");
            doc.setFontSize(12);
            doc.text(`Student Log for Industrial Attachment (Week ${week.number})`, 105, 15, { align: 'center' });

            doc.setFont(fontName, "normal");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);

            currentCoordinateY = 30;
            const fromStr = formatDate(week.start).split('-').join(' / ');
            const toStr = formatDate(week.end).split('-').join(' / ');

            doc.text(`From  ${fromStr || '......... / ......... / ...........'}`, 15, currentCoordinateY);
            doc.text(`To  ${toStr || '......... / ......... / ...........'}`, 85, currentCoordinateY);
            doc.text(`Student signature: .......................................`, 140, currentCoordinateY);

            currentCoordinateY += 10;

            const daysData = [
                ['MON', log.mondayTask || '', log.mondayHours || ''],
                ['TUE', log.tuesdayTask || '', log.tuesdayHours || ''],
                ['WED', log.wednesdayTask || '', log.wednesdayHours || ''],
                ['THU', log.thursdayTask || '', log.thursdayHours || ''],
                ['FRI', log.fridayTask || '', log.fridayHours || ''],
            ];

            autoTable(doc, {
                startY: currentCoordinateY,
                head: [['Days', 'Brief description of tasks', 'Working hours/day']],
                body: daysData,
                theme: 'grid',
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    font: fontName,
                    fontStyle: 'bold',
                    halign: 'center',
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0]
                },
                styles: {
                    font: fontName,
                    textColor: [0, 0, 0],
                    fontSize: 10,
                    cellPadding: 5,
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0],
                    minCellHeight: 20
                },
                columnStyles: {
                    0: { halign: 'center', fontStyle: 'bold', cellWidth: 30, valign: 'middle' },
                    1: { valign: 'middle' },
                    2: { halign: 'center', cellWidth: 35, valign: 'middle' }
                },
                margin: { left: 15, right: 15 }
            });

            currentCoordinateY = (doc as any).lastAutoTable.finalY + 10;

            doc.setFont(fontName, "bold");
            doc.text(`Total hours per week: ...........................................................................................................................................................`, 15, currentCoordinateY);
            doc.text(`${log.totalHours || 0}`, 57, currentCoordinateY);

            currentCoordinateY += 10;

            const stmtY = currentCoordinateY;
            const stmtBoxH = 50;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.rect(15, stmtY, 180, stmtBoxH);
            doc.line(45, stmtY, 45, stmtY + stmtBoxH);

            doc.setFontSize(9);
            const labelLines = doc.splitTextToSize("Student's General Statement on Attachment", 25);
            doc.text(labelLines, 30, stmtY + 15, { align: 'center' });

            const stmtLines = doc.splitTextToSize(log.generalStatement || "", 140);
            doc.setFont(fontName, "normal");
            doc.text(stmtLines, 50, stmtY + 8);

            currentCoordinateY += stmtBoxH + 10;

            doc.rect(15, currentCoordinateY, 180, 50);

            doc.setFontSize(9);
            const gradingInstruction = doc.splitTextToSize("Indicate the appropriate grade by ticking the corresponding box based on the general observations of the student activities performance.", 170);
            doc.text(gradingInstruction, 20, currentCoordinateY + 8);

            const gradeOptions = [
                { id: 'A', label: 'A (Excellent)' },
                { id: 'B', label: 'B (Good)' },
                { id: 'C', label: 'C (Average)' },
                { id: 'D', label: 'D (Pass)' },
                { id: 'E', label: 'E (Fail)' }
            ];

            gradeOptions.forEach((g, i) => {
                const gx = 20 + (i * 35);
                const gy = currentCoordinateY + 18;
                doc.setFont(fontName, "bold");
                doc.text(g.label, gx, gy);

                if (log.grade === g.id) {
                    doc.setFontSize(14);
                    doc.text("✓", gx - 4, gy);
                    doc.setFontSize(9);
                }
            });

            doc.setFont(fontName, "bold");
            doc.text(`Name of Supervisor .......................................................................................................................................................`, 20, currentCoordinateY + 28);
            doc.text(log.supervisorName || "", 55, currentCoordinateY + 28);

            doc.text(`Date: .......................................................................................................................................................................................`, 20, currentCoordinateY + 38);
            doc.text(log.supervisorDate ? new Date(log.supervisorDate).toLocaleDateString() : "", 32, currentCoordinateY + 38);

            doc.text(`Signature ...............................................................................................................................................................................`, 20, currentCoordinateY + 48);
            if (log.supervisorSignature) {
                doc.setFontSize(7);
                doc.text("SIGNED DIGITALLY", 40, currentCoordinateY + 48);
            }
        });

        // INDUSTRIAL ATTACHMENT RESULT REPORT (for students)
        doc.addPage();
        addHeader("INDUSTRIAL ATTACHMENT RESULT REPORT", "(for students)");

        currentCoordinateY = 35;
        doc.setLineWidth(0.2);
        doc.setDrawColor(0, 0, 0);

        autoTable(doc, {
            startY: currentCoordinateY,
            body: [
                [
                    { content: 'Name', styles: { font: fontName, fontStyle: 'bold' as any } },
                    student?.fullName || '',
                    { content: 'Name of Unit', styles: { font: fontName, fontStyle: 'bold' as any } },
                    report.nameOfUnit || ''
                ],
                [
                    { content: 'Name of\nCompany/Institution', styles: { font: fontName, fontStyle: 'bold' as any } },
                    student?.companyName || '',
                    { content: 'Confirmation of\nPersonnel-in-Charge in\nCompany', rowSpan: 2, styles: { font: fontName, fontStyle: 'bold' as any, halign: 'center' as any, valign: 'middle' as any } },
                    { content: '(signature)', rowSpan: 2, styles: { minCellHeight: 25, valign: 'middle' as any, halign: 'center' as any } }
                ],
                [
                    { content: 'Training Period', styles: { font: fontName, fontStyle: 'bold' as any } },
                    `${formatDate(student?.internshipStart)} — ${formatDate(student?.internshipEnd)}`,
                ]
            ],
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4, font: fontName, lineColor: [0, 0, 0], lineWidth: 0.1 },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 60 },
                2: { cellWidth: 40 }
            }
        });

        currentCoordinateY = (doc as any).lastAutoTable.finalY;

        const renderSurveyRow = (label: string, value: string) => {
            autoTable(doc, {
                startY: currentCoordinateY,
                body: [[{ content: label, styles: { font: fontName, fontStyle: 'bold' as any, cellWidth: 35 } }, value || '']],
                theme: 'grid',
                styles: { font: fontName, fontSize: 9, cellPadding: 4, lineColor: [0, 0, 0], lineWidth: 0.1, minCellHeight: 25 },
                margin: { left: 15, right: 15 }
            });
            currentCoordinateY = (doc as any).lastAutoTable.finalY;
        };

        renderSurveyRow('Overview and Goals of\nTraining', report.overviewGoals || '');
        renderSurveyRow('Contents of Training', report.contentsTraining || '');

        // Satisfaction Table
        const satisfactionCategories = [
            { label: 'Satisfaction with industry', key: 'satisfactionIndustry' },
            { label: 'Satisfaction with relevant major', key: 'satisfactionMajor' },
            { label: 'Satisfaction with practical work', key: 'satisfactionPractical' },
            { label: 'Satisfaction with instructors', key: 'satisfactionInstructors' }
        ];

        const satisfactionBody = satisfactionCategories.map((cat, i) => {
            const row = [];
            if (i === 0) {
                row.push({ content: 'Satisfaction with\nIndustrial Attachment', rowSpan: 4, styles: { fontStyle: 'bold' as any, halign: 'center' as any, valign: 'middle' as any, cellWidth: 35 } });
            }
            row.push({ content: cat.label, styles: { fontStyle: 'bold' as any } });
            ['Excellent', 'Average', 'Poor'].forEach(level => {
                row.push(report[cat.key as keyof IapReport] === level ? '✓' : '');
            });
            return row;
        });

        autoTable(doc, {
            startY: currentCoordinateY,
            head: [['', '', 'Excellent', 'Average', 'Poor']],
            body: satisfactionBody,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4, font: fontName, lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'center' as any, valign: 'middle' as any },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' as any },
            columnStyles: {
                1: { halign: 'left' as any, cellWidth: 60 }
            }
        });
        currentCoordinateY = (doc as any).lastAutoTable.finalY;

        renderSurveyRow('Notable Achievements', report.notableAchievements || '');
        renderSurveyRow('Future Career Plan', report.futureCareerPlan || '');
        renderSurveyRow('Suggestions', report.suggestions || '');

        doc.addPage();
        addHeader("INDUSTRIAL ATTACHMENT ASSESSMENT", "(for Companies)");

        currentCoordinateY = 35;
        doc.setFontSize(10);
        doc.setFont(fontName, "normal");
        doc.text(`Student name: ${student?.fullName || '.........................................................................................'}`, 15, currentCoordinateY);
        doc.text(`Department/Class: ${student?.year || '.........................................................................................'}`, 120, currentCoordinateY);

        currentCoordinateY += 10;
        doc.setFont(fontName, "bold");
        doc.text("Marking Scheme", 15, currentCoordinateY);
        currentCoordinateY += 5;

        const ratings = student?.ratings?.[0] || {};

        autoTable(doc, {
            startY: currentCoordinateY,
            head: [['Evaluation area', 'Evaluation item', 'Very High', 'High', 'Average', 'Low', 'Very Low', 'Score']],
            body: [
                [{ content: 'Assignments', rowSpan: 4, styles: { valign: 'middle' as any, font: fontName, fontStyle: 'bold' as any } }, 'Related knowledge', '10', '9', '8', '7', '6', (ratings.knowledgeApplication || '').toString()],
                ['Support for operation of wireless net', '10', '9', '8', '7', '6', (ratings.knowledgeWirelessOps || '').toString()],
                ['Establishment of wireless network', '10', '9', '8', '7', '6', (ratings.knowledgeWirelessEst || '').toString()],
                ['Maintenance of wireless room', '10', '9', '8', '7', '6', (ratings.knowledgeWirelessMaint || '').toString()],
                [{ content: 'Attitude', rowSpan: 3, styles: { valign: 'middle' as any, font: fontName, fontStyle: 'bold' as any } }, 'Responsibility', '10', '9', '8', '7', '6', (ratings.responsibility || '').toString()],
                ['Cooperativeness', '10', '9', '8', '7', '6', (ratings.cooperativeness || '').toString()],
                ['Compliance with rules & etiquette', '10', '9', '8', '7', '6', (ratings.complianceEtiquette || '').toString()],
                [{ content: 'Safety Management', rowSpan: 3, styles: { valign: 'middle' as any, font: fontName, fontStyle: 'bold' as any } }, 'Awareness of safety mgmt', '10', '9', '8', '7', '6', (ratings.safetyAwareness || '').toString()],
                ['Compliance with safety rules', '10', '9', '8', '7', '6', (ratings.safetyCompliance || '').toString()],
                ['Arrangement of safety instruments', '10', '9', '8', '7', '6', (ratings.safetyArrangement || '').toString()],
            ],
            theme: 'grid',
            styles: { fontSize: 8, font: fontName, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { font: fontName, fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' as any },
        });

        currentCoordinateY = (doc as any).lastAutoTable.finalY + 5;

        const assignmentsSum =
            (ratings.knowledgeApplication || 0) +
            (ratings.knowledgeWirelessOps || 0) +
            (ratings.knowledgeWirelessEst || 0) +
            (ratings.knowledgeWirelessMaint || 0) +
            (ratings.responsibility || 0) +
            (ratings.cooperativeness || 0) +
            (ratings.complianceEtiquette || 0) +
            (ratings.safetyAwareness || 0) +
            (ratings.safetyCompliance || 0) +
            (ratings.safetyArrangement || 0);

        const safetySubtotal =
            (ratings.safetyAwareness || 0) +
            (ratings.safetyCompliance || 0) +
            (ratings.safetyArrangement || 0);

        const attendanceScore = 100 - ((student?.absentDays || 0) * 10);
        const finalScore = (assignmentsSum * 0.8) + (attendanceScore * 0.2);

        doc.setFontSize(9);
        doc.text(`Safety Subtotal: ( ${safetySubtotal} )/30`, 15, currentCoordinateY);
        doc.text(`Sum: ( ${assignmentsSum} )/100`, 160, currentCoordinateY);
        currentCoordinateY += 8;

        doc.setFont(fontName, "bold");
        doc.text("Attendance", 15, currentCoordinateY);
        currentCoordinateY += 5;
        doc.setFont(fontName, "normal");
        doc.text(`Days of Absence: ${student?.absentDays || 0}   / 100 Total Score: ${attendanceScore}/100`, 15, currentCoordinateY);
        currentCoordinateY += 10;

        doc.setFont(fontName, "bold");
        doc.text(`Marking Scheme score: ( ${finalScore.toFixed(1)} )/100`, 15, currentCoordinateY);
        currentCoordinateY += 10;

        doc.text("Overall Review", 15, currentCoordinateY);
        currentCoordinateY += 5;
        doc.rect(15, currentCoordinateY, 180, 25);
        doc.setFont(fontName, "normal");
        doc.text(ratings.comment || "", 20, currentCoordinateY + 8);
        currentCoordinateY += 35;

        doc.text(`Company Name: ................................................................... Evaluator's Position: ...................................................................`, 15, currentCoordinateY);
        doc.text(student?.companyName || "", 45, currentCoordinateY);
        doc.text(ratings.evaluatorPosition || "", 145, currentCoordinateY);
        currentCoordinateY += 10;
        doc.text(`Name: ................................................................... (signature) ...................................................................`, 15, currentCoordinateY);
        doc.text(ratings.evaluatorName || "", 30, currentCoordinateY);


        doc.addPage();
        addHeader("INDUSTRIAL ATTACHMENT REPORT");
        currentCoordinateY = 35;

        doc.setFont(fontName, "bold");
        doc.setFontSize(14);
        doc.text("PART A: NARRATIVE SUMMARY", 15, currentCoordinateY);
        currentCoordinateY += 10;

        const narrativeFields = [
            { label: "Overview and Goals of Training", value: report.overviewGoals },
            { label: "Contents of Training", value: report.contentsTraining },
            { label: "Notable Achievements", value: report.notableAchievements },
            { label: "Future Career Plan", value: report.futureCareerPlan },
            { label: "Suggestions", value: report.suggestions }
        ];

        narrativeFields.forEach(field => {
            if (currentCoordinateY > 250) { doc.addPage(); addHeader("NARRATIVE SUMMARY (CONT.)"); currentCoordinateY = 35; }
            doc.setFont(fontName, "bold");
            doc.setFontSize(10);
            doc.text(field.label, 15, currentCoordinateY);
            currentCoordinateY += 6;
            doc.setFont(fontName, "normal");
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(field.value || "No information provided.", 180);
            doc.text(lines, 15, currentCoordinateY);
            currentCoordinateY += (lines.length * 5) + 8;
        });

        if (currentCoordinateY > 200) { doc.addPage(); addHeader("INDUSTRIAL ATTACHMENT REPORT"); currentCoordinateY = 35; }
        doc.setFont(fontName, "bold");
        doc.text("Satisfaction Evaluation", 15, currentCoordinateY);
        currentCoordinateY += 6;

        const satisfactionData = [
            ['Category', 'Level'],
            ['Industry', report.satisfactionIndustry || 'N/A'],
            ['Relevant Major', report.satisfactionMajor || 'N/A'],
            ['Practical Work', report.satisfactionPractical || 'N/A'],
            ['Instructors', report.satisfactionInstructors || 'N/A']
        ];

        autoTable(doc, {
            startY: currentCoordinateY,
            body: satisfactionData,
            theme: 'grid',
            styles: { fontSize: 8, font: fontName, cellPadding: 3, lineColor: [0, 0, 0], lineWidth: 0.1 },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        });

        currentCoordinateY = (doc as any).lastAutoTable.finalY + 15;

        // Student's report - PART B: FORMAL QUESTIONNAIRE
        doc.addPage();
        addHeader("STUDENT'S REPORT");
        currentCoordinateY = 35;
        doc.setFontSize(10);
        doc.setFont(fontName, "bold");
        doc.text("PART B: FORMAL PROGRAM EVALUATION", 15, currentCoordinateY);
        currentCoordinateY += 8;

        doc.setFont(fontName, "normal");
        doc.setFontSize(9);
        doc.text("Please return the filled Log book and IAP Report with this completed form to RCA within Two Weeks after the end of your industrial attachment", 15, currentCoordinateY, { maxWidth: 180 });
        currentCoordinateY += 12;

        const surveyFields = [
            { label: "Name of Student", value: student?.fullName || "" },
            { label: "Reg No.", value: report.regNo || "" },
            { label: "Phone No", value: report.phoneNo || "" },
            { label: "IAP Company attached to", value: student?.companyName || "" },
            { label: "Number of times an LO visited you", value: (report.loVisitCount || 0).toString() },
        ];

        surveyFields.forEach(f => {
            doc.text(`${f.label}: ...........................................................................................................................................................`, 15, currentCoordinateY);
            doc.text(f.value, 65, currentCoordinateY);
            currentCoordinateY += 8;
        });

        currentCoordinateY += 5;
        const checkBoxes = [
            { label: "Have the Programme been useful or relevant to you?", value: report.isUseful },
            { label: "Have the Programme improved your understanding of subjects?", value: report.improvedUnderstanding },
            { label: "Have the Programme provided you with experiences about working life?", value: report.providedExperiences },
        ];

        checkBoxes.forEach(cb => {
            doc.text(cb.label, 15, currentCoordinateY);
            drawCheckbox(160, currentCoordinateY - 3, cb.value === true);
            doc.text("Yes", 165, currentCoordinateY);
            drawCheckbox(175, currentCoordinateY - 3, cb.value === false);
            doc.text("No", 180, currentCoordinateY);
            currentCoordinateY += 8;
        });

        currentCoordinateY += 5;
        doc.setFont(fontName, "bold");
        doc.text("Please tick the type of Programme you have been put through (You can tick more than one box):", 15, currentCoordinateY);
        currentCoordinateY += 8;
        doc.setFont(fontName, "normal");

        const progTypes = [
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
            "Conducting performance optimization and memory management for embedded systems.",
            "Others (Please describe them below)"
        ];

        progTypes.forEach(pt => {
            if (currentCoordinateY > 275) { doc.addPage(); addHeader("QUESTIONNAIRE (CONT.)"); currentCoordinateY = 35; }
            drawCheckbox(15, currentCoordinateY - 3, (report.programmeTypes || []).includes(pt));
            const lines = doc.splitTextToSize(pt, 170);
            doc.text(lines, 22, currentCoordinateY);
            currentCoordinateY += (lines.length * 5) + 3;
        });

        currentCoordinateY += 5;
        doc.rect(15, currentCoordinateY, 180, 25);
        if (report.otherProgrammeDetails) {
            const lines = doc.splitTextToSize(report.otherProgrammeDetails, 175);
            doc.text(lines, 18, currentCoordinateY + 8);
        }
        currentCoordinateY += 35;

        doc.text(`Date: ......................................................................... Signature of Student: .........................................................................`, 15, currentCoordinateY);
        doc.text(new Date().toLocaleDateString(), 25, currentCoordinateY);
        doc.setFontSize(12);
        doc.text(student?.fullName || "Digitally Verified", 145, currentCoordinateY - 1);
        doc.setFontSize(9);

        currentCoordinateY += 12;
        doc.setFont(fontName, "italic");
        doc.text("Please make a photocopy of this form for your own retention before submitting to IAP coordinator.", 105, currentCoordinateY, { align: "center" });

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

                        {currentStep === 2 && (
                            <div className="space-y-8">
                                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                                        <CardTitle className="text-2xl font-bold text-slate-900">Student Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <LogbookInput label="First Name" value={student?.firstName} onChange={(v) => setStudent({ ...student, firstName: v })} />
                                            <LogbookInput label="Last Name" value={student?.lastName} onChange={(v) => setStudent({ ...student, lastName: v })} />
                                            <LogbookInput label="Date of Birth" type="date" value={student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(v) => setStudent({ ...student, dateOfBirth: v })} />
                                            <LogbookSelect 
                                                label="Sex" 
                                                value={student?.sex} 
                                                onChange={(v) => setStudent({ ...student, sex: v })} 
                                                options={[
                                                    { label: "Male", value: "Male" },
                                                    { label: "Female", value: "Female" }
                                                ]}
                                            />
                                            <LogbookInput label="ID/Passport No." value={student?.idOrPassport} onChange={(v) => setStudent({ ...student, idOrPassport: v })} />
                                            <LogbookInput label="Reg No." value={student?.studentNumber} onChange={(v) => setStudent({ ...student, studentNumber: v })} />
                                            <LogbookSelect 
                                                label="Intake Year" 
                                                value={student?.intakeYear} 
                                                onChange={(v) => setStudent({ ...student, intakeYear: v })} 
                                                options={Array.from({ length: 10 }, (_, i) => ({ label: String(new Date().getFullYear() - i), value: String(new Date().getFullYear() - i) }))}
                                            />
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
                                    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
                                        <div className="w-full lg:w-1/4 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2 pb-4">
                                            {generatedWeeksList.map(w => {
                                                const log = weeklyLogs.find(l => l.weekNumber === w.number);
                                                const isFilled = !!(log?.mondayTask || log?.tuesdayTask || log?.wednesdayTask || log?.thursdayTask || log?.fridayTask);
                                                const isSelected = expandedWeek === w.number;

                                                return (
                                                    <button
                                                        key={w.number}
                                                        onClick={() => setExpandedWeek(w.number)}
                                                        className={`flex items-center justify-between p-4 rounded-xl transition-all border text-left ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-md' : isFilled ? 'bg-green-50/50 border-green-200 hover:bg-green-50' : 'bg-white border-slate-200 hover:border-slate-900/30 hover:bg-slate-50'}`}
                                                    >
                                                        <div>
                                                            <div className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>Week {w.number}</div>
                                                            <div className={`text-xs mt-1 ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                                                                {new Date(w.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(w.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </div>
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
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="w-full lg:w-3/4">
                                            {expandedWeek ? (
                                                (() => {
                                                    const currentLog = getSafeLog(expandedWeek);
                                                    const isLocked = currentLog.status === 'COMPLETED' || currentLog.status === 'SUBMITTED';
                                                    const weekData = generatedWeeksList.find(w => w.number === expandedWeek);

                                                    return (
                                                        <div className="bg-white border-[1.5px] border-slate-900 text-sm overflow-hidden font-(--font-jost)">
                                                            <div className="bg-white p-8 border-b border-slate-900 text-center space-y-6">
                                                                <h3 className="text-xl font-bold text-slate-900 uppercase">Student Log for Industrial Attachment (Week {expandedWeek})</h3>

                                                                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-bold text-slate-800">
                                                                    <div className="flex items-center gap-2">
                                                                        <span>From</span>
                                                                        <div className="border-b border-slate-900 border-dotted min-w-[150px] px-2">
                                                                            {weekData?.start ? new Date(weekData.start).toLocaleDateString().split('/').join(' / ') : "......... / ......... / ..........."}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>To</span>
                                                                        <div className="border-b border-slate-900 border-dotted min-w-[150px] px-2">
                                                                            {weekData?.end ? new Date(weekData.end).toLocaleDateString().split('/').join(' / ') : "......... / ......... / ..........."}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>Student signature:</span>
                                                                        <div className="border-b border-slate-900 border-dotted min-w-[150px]"></div>
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="sm" onClick={() => setExpandedWeek(null)} className="text-slate-500 hover:text-slate-900 lg:hidden absolute top-4 right-4">
                                                                    Close
                                                                </Button>
                                                            </div>

                                                            <table className="w-full border-collapse">
                                                                <thead className="bg-white border-b border-slate-900 text-slate-900">
                                                                    <tr>
                                                                        <th className="p-4 font-bold border-r border-slate-900 w-24 text-center">DAY</th>
                                                                        <th className="p-4 font-bold border-r border-slate-900">BRIEF DESCRIPTION OF TASKS</th>
                                                                        <th className="p-4 font-bold w-32 text-center leading-tight">WORKING HOURS / DAY</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-900">
                                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                                                        const dayKey = day.toLowerCase();

                                                                        return (
                                                                            <tr key={day}>
                                                                                <td className="p-4 font-bold text-slate-900 border-r border-slate-900 text-center bg-white">{day.toUpperCase().slice(0, 3)}</td>
                                                                                <td className="p-0 border-r border-slate-900">
                                                                                    <textarea
                                                                                        disabled={isLocked}
                                                                                        className={`w-full bg-white p-4 text-sm text-slate-800 resize-none min-h-[100px] outline-none transition-all placeholder:text-slate-300 ${isLocked ? 'bg-white opacity-60 cursor-not-allowed' : ''}`}
                                                                                        placeholder={isLocked ? "Log is locked" : `Describe technical activities performed...`}
                                                                                        value={currentLog[`${dayKey}Task` as keyof WeeklyLog] as string || ""}
                                                                                        onChange={(e) => updateLogField(expandedWeek, `${dayKey}Task`, e.target.value)}
                                                                                    />
                                                                                </td>
                                                                                <td className="p-0">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="24"
                                                                                        disabled={isLocked}
                                                                                        className={`w-full h-full bg-white p-4 text-sm text-center text-slate-800 outline-none ${isLocked ? 'bg-white opacity-60 cursor-not-allowed' : ''}`}
                                                                                        value={currentLog[`${dayKey}Hours` as keyof WeeklyLog] as number || 8}
                                                                                        onChange={(e) => updateLogField(expandedWeek, `${dayKey}Hours`, parseFloat(e.target.value) || 8)}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                                <tfoot className="border-t border-slate-900 font-bold bg-white text-slate-900">
                                                                    <tr>
                                                                        <td colSpan={2} className="p-4 text-right border-r border-slate-900">TOTAL HOURS PER WEEK:</td>
                                                                        <td className="p-4 text-center underline decoration-dotted underline-offset-4">{currentLog.totalHours || 40}</td>
                                                                    </tr>
                                                                </tfoot>
                                                            </table>

                                                            <div className="border-t border-slate-900 grid grid-cols-[1fr_3fr]">
                                                                <div className="p-4 border-r border-slate-900 font-bold bg-white flex items-center justify-center text-center leading-tight uppercase text-[10px]">Student&apos;s General<br />Statement on Attachment</div>
                                                                <div className="p-0 bg-white">
                                                                    <textarea
                                                                        disabled={currentLog.status !== 'DRAFT' && currentLog.status !== 'REJECTED'}
                                                                        className={`w-full h-32 p-4 text-sm text-slate-800 outline-none resize-none ${(currentLog.status !== 'DRAFT' && currentLog.status !== 'REJECTED') ? 'bg-white cursor-not-allowed opacity-75' : ''}`}
                                                                        placeholder="Student's general reflection on the week's attachment..."
                                                                        value={currentLog.generalStatement || ""}
                                                                        onChange={(e) => updateLogField(expandedWeek, 'generalStatement', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Supervisor Section Area */}
                                                            <div className="border-t border-slate-900 grid grid-cols-[1fr_3fr]">
                                                                <div className="p-4 border-r border-slate-900 font-bold bg-white flex items-center justify-center text-center leading-tight uppercase">Supervisor<br />Evaluation</div>
                                                                <div className="p-6 bg-white space-y-6">
                                                                    <p className="text-[11px] font-medium text-slate-500 leading-tight">
                                                                        Indicate the appropriate grade by ticking the corresponding box based on the general observations of the student activities performance.
                                                                    </p>

                                                                    <div className="flex flex-wrap items-center gap-6">
                                                                        {[
                                                                            { id: 'A', label: 'A (Excellent)' },
                                                                            { id: 'B', label: 'B (Good)' },
                                                                            { id: 'C', label: 'C (Average)' },
                                                                            { id: 'D', label: 'D (Pass)' },
                                                                            { id: 'E', label: 'E (Fail)' }
                                                                        ].map((g) => (
                                                                            <div key={g.id} className="flex items-center gap-2">
                                                                                <div className={cn(
                                                                                    "h-6 w-6 border-2 border-slate-900 rounded-sm flex items-center justify-center transition-all",
                                                                                    currentLog.grade === g.id ? "bg-slate-900" : "bg-white"
                                                                                )}>
                                                                                    {currentLog.grade === g.id && <Check className="h-4 w-4 text-white" />}
                                                                                </div>
                                                                                <span className="text-sm font-bold text-slate-800">{g.label}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                                            <div className="flex-1 flex items-center gap-2">
                                                                                <span className="text-sm font-bold whitespace-nowrap">Name of Supervisor:</span>
                                                                                <div className="flex-1 border-b border-dotted border-slate-400 font-bold text-slate-800">{currentLog.supervisorName || "—"}</div>
                                                                            </div>
                                                                            <div className="w-48 flex items-center gap-2">
                                                                                <span className="text-sm font-bold">Date:</span>
                                                                                <div className="flex-1 border-b border-dotted border-slate-400 font-bold text-slate-800">
                                                                                    {currentLog.supervisorDate ? new Date(currentLog.supervisorDate).toLocaleDateString() : "—"}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-bold">Signature:</span>
                                                                            <div className="flex-1 border-b border-dotted border-slate-400 font-bold text-green-600 italic">
                                                                                {currentLog.supervisorSignature ? "SIGNED DIGITALLY" : "—"}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="p-6 bg-slate-50 border-t border-slate-900 flex items-center justify-between gap-4">
                                                                {currentLog.status !== 'DRAFT' && (
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <StatusBadge status={currentLog.status} />
                                                                        </div>
                                                                        {currentLog.status === 'REJECTED' && currentLog.supervisorNote && (
                                                                            <p className="text-xs text-red-700 font-medium italic">&quot;{currentLog.supervisorNote}&quot;</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <div className="flex gap-4 ml-auto">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => handleSaveWeeklyLog(currentLog)}
                                                                        disabled={isSaving || (currentLog.status === 'COMPLETED' || currentLog.status === 'SUBMITTED')}
                                                                        className="h-10 px-6 rounded-lg border-slate-900 text-slate-900 hover:bg-slate-50 font-bold disabled:opacity-50"
                                                                    >
                                                                        Save Draft
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleSubmitWeeklyLog(currentLog)}
                                                                        disabled={isSaving || (currentLog.status === 'COMPLETED' || currentLog.status === 'SUBMITTED')}
                                                                        className="h-10 px-6 rounded-lg bg-slate-900 text-white font-bold disabled:opacity-50"
                                                                    >
                                                                        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Submit Log"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-12 text-center">
                                                    <FileText className="h-12 w-12 text-slate-300 mb-4" />
                                                    <h3 className="text-xl font-bold text-slate-700">Select a Week</h3>
                                                    <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                                                        Choose a week from the sidebar to view or edit your daily technical logs.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-8">
                                <div className="bg-white p-4 md:p-10 space-y-12 max-w-5xl mx-auto border border-slate-200 rounded-2xl shadow-xl font-(--font-jost)">
                                    <div className="space-y-10">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col gap-2">
                                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Industrial Attachment Result Report (for students)</h2>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-4 border-b-2 border-slate-900">
                                                    <div className="p-5 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center">Name of Student</div>
                                                    <div className="p-5 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 bg-white flex items-center font-medium text-slate-700">{student?.fullName || "—"}</div>
                                                    <div className="p-5 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center leading-tight">Name of<br />Academic Unit</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 border-b-2 border-slate-900 last:border-b-0">
                                                    <div className="md:col-span-2 flex flex-col border-r-2 border-slate-900">
                                                        <div className="grid grid-cols-2 border-b-2 border-slate-900">
                                                            <div className="p-5 border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center leading-tight">Name of<br />Company/Institution</div>
                                                            <div className="p-5 bg-white flex items-center font-medium text-slate-700">{student?.companyName || "—"}</div>
                                                        </div>
                                                        <div className="grid grid-cols-2">
                                                            <div className="p-5 border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center">Training Period</div>
                                                            <div className="p-5 bg-white flex items-center font-medium text-slate-700">
                                                                {student?.internshipStart ? new Date(student.internshipStart).toLocaleDateString() : ""} ~ {student?.internshipEnd ? new Date(student.internshipEnd).toLocaleDateString() : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-5 border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center leading-tight">Confirmation of<br />Personnel-in-Charge in<br />Company</div>
                                                    <div className="bg-white flex items-center justify-center text-slate-300 italic text-[10px] uppercase font-semibold tracking-widest">(signature)</div>
                                                </div>

                                                {[
                                                    { label: "Overview and Goals of Training", key: "overviewGoals" },
                                                    { label: "Contents of Training", key: "contentsTraining" }
                                                ].map((field) => (
                                                    <div key={field.key} className="grid grid-cols-1 md:grid-cols-[1fr_3fr] border-t-2 border-slate-900">
                                                        <div className="p-5 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center leading-tight">{field.label}</div>
                                                        <div className="bg-white">
                                                            <textarea
                                                                className="w-full h-32 p-5 bg-transparent outline-none resize-none font-medium text-slate-700 focus:bg-slate-50 transition-colors"
                                                                placeholder={`Describe ${field.label.toLowerCase()}...`}
                                                                value={report[field.key as keyof IapReport] as string || ""}
                                                                onChange={(e) => setReport({ ...report, [field.key]: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Satisfaction Table */}
                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] border-t-2 border-slate-900">
                                                    <div className="p-5 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center leading-tight">Satisfaction with<br />Industrial Attachment</div>
                                                    <div className="p-0 bg-white overflow-x-auto">
                                                        <table className="w-full text-center border-collapse">
                                                            <thead>
                                                                <tr className="border-b-2 border-slate-900 font-bold text-slate-800">
                                                                    <th className="p-4 border-r-2 border-slate-900">Category</th>
                                                                    <th className="p-4 border-r-2 border-slate-900">Excellent</th>
                                                                    <th className="p-4 border-r-2 border-slate-900">Average</th>
                                                                    <th className="p-4">Poor</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {[
                                                                    { label: 'Satisfaction with industry', key: 'satisfactionIndustry' },
                                                                    { label: 'Satisfaction with relevant major', key: 'satisfactionMajor' },
                                                                    { label: 'Satisfaction with practical work', key: 'satisfactionPractical' },
                                                                    { label: 'Satisfaction with instructors', key: 'satisfactionInstructors' }
                                                                ].map((item, idx) => (
                                                                    <tr key={item.key} className={idx < 3 ? "border-b-2 border-slate-900" : ""}>
                                                                        <td className="p-4 text-left border-r-2 border-slate-900 font-medium text-slate-700">{item.label}</td>
                                                                        {['Excellent', 'Average', 'Poor'].map((level) => (
                                                                            <td
                                                                                key={level}
                                                                                className="p-4 border-r-2 border-slate-900 last:border-r-0 cursor-pointer hover:bg-slate-50"
                                                                                onClick={() => setReport({ ...report, [item.key]: level as 'Excellent' | 'Average' | 'Poor' })}
                                                                            >
                                                                                <div className="flex items-center justify-center">
                                                                                    <div className={`h-6 w-6 rounded-full border-2 border-slate-900 flex items-center justify-center transition-all ${report[item.key as keyof IapReport] === level ? 'bg-slate-900' : 'bg-white'}`}>
                                                                                        {report[item.key as keyof IapReport] === level && <Check className="h-4 w-4 text-white" />}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {[
                                                    { label: "Notable Achievements", key: "notableAchievements" },
                                                    { label: "Future Career Plan", key: "futureCareerPlan" },
                                                    { label: "Suggestions", key: "suggestions" }
                                                ].map((field) => (
                                                    <div key={field.key} className="grid grid-cols-1 md:grid-cols-[1fr_3fr] border-t-2 border-slate-900">
                                                        <div className="p-5 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 font-bold bg-slate-50 flex items-center justify-center text-center leading-tight">{field.label}</div>
                                                        <div className="bg-white">
                                                            <textarea
                                                                className="w-full h-32 p-5 bg-transparent outline-none resize-none font-medium text-slate-700 focus:bg-slate-50 transition-colors"
                                                                placeholder={`Describe ${field.label.toLowerCase()}...`}
                                                                value={report[field.key as keyof IapReport] as string || ""}
                                                                onChange={(e) => setReport({ ...report, [field.key]: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* PART B: FORMAL QUESTIONNAIRE */}
                                        <div className="space-y-10 pt-10 border-t-2 border-slate-900 border-dashed">
                                            <div className="text-center space-y-2">
                                                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">STUDENT'S REPORT</h2>
                                                <p className="text-xs font-bold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                                                    Please return the filled Log book and IAP Report with this completed form to RCA within Two Weeks after the end of your industrial attachment
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 bg-white p-2">
                                                {[
                                                    { label: "Name of Student", value: student?.fullName || "", isControlled: false },
                                                    { label: "Reg No.", value: report.regNo || "", key: "regNo", isControlled: true },
                                                    { label: "Phone No", value: report.phoneNo || "", key: "phoneNo", isControlled: true },
                                                    { label: "IAP Company attached to", value: student?.companyName || "", isControlled: false },
                                                    { label: "Number of times an LO visited you", value: report.loVisitCount || 0, key: "loVisitCount", isControlled: true, isNumber: true }
                                                ].map((f, i) => (
                                                    <div key={i} className={`flex flex-col gap-1 ${f.label === "IAP Company attached to" ? "md:col-span-2" : ""}`}>
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-sm font-bold text-slate-900 shrink-0">{f.label}:</span>
                                                            <div className="flex-1 border-b-2 border-slate-900 border-dotted min-h-6 relative">
                                                                {f.isControlled ? (
                                                                    <input
                                                                        type={f.isNumber ? "number" : "text"}
                                                                        className="w-full bg-transparent outline-none font-medium text-slate-800 px-2"
                                                                        value={f.value}
                                                                        onChange={(e) => setReport({ ...report, [f.key!]: f.isNumber ? parseInt(e.target.value) || 0 : e.target.value })}
                                                                    />
                                                                ) : (
                                                                    <span className="px-2 font-medium text-slate-800">{f.value}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-4">
                                                {[
                                                    { label: "Have the Programme been useful or relevant to you?", key: "isUseful" },
                                                    { label: "Have the Programme improved your understanding of you subjects of study?", key: "improvedUnderstanding" },
                                                    { label: "Have the Programme provided you with experiences about working life, human relationship skills etc.", key: "providedExperiences" }
                                                ].map((q) => (
                                                    <div key={q.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                                                        <span className="text-sm font-bold text-slate-800 leading-tight">{q.label}</span>
                                                        <div className="flex gap-8 shrink-0">
                                                            {['Yes', 'No'].map((opt) => {
                                                                const val = opt === 'Yes';
                                                                const isChecked = report[q.key as keyof IapReport] === val;
                                                                return (
                                                                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                                        <div
                                                                            onClick={() => setReport({ ...report, [q.key]: val })}
                                                                            className={`h-5 w-5 border-2 border-slate-900 flex items-center justify-center transition-all ${isChecked ? 'bg-slate-900' : 'bg-white'}`}
                                                                        >
                                                                            {isChecked && <Check className="h-4 w-4 text-white" />}
                                                                        </div>
                                                                        <span className="text-sm font-medium text-slate-900">{opt}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-bold text-slate-900 uppercase">Please tick the type of Programme you have been put through:</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 italic">(You can tick more than one box)</p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
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
                                                        "Conducting performance optimization and memory management for embedded systems.",
                                                        "Others (Please describe them below)"
                                                    ].map((type) => {
                                                        const isActive = (report.programmeTypes || []).includes(type);
                                                        return (
                                                            <div
                                                                key={type}
                                                                className="flex items-start gap-4 py-1 cursor-pointer group"
                                                                onClick={() => {
                                                                    const newTypes = isActive
                                                                        ? report.programmeTypes.filter(t => t !== type)
                                                                        : [...(report.programmeTypes || []), type];
                                                                    setReport({ ...report, programmeTypes: newTypes });
                                                                }}
                                                            >
                                                                <div className={`mt-0.5 h-5 w-5 border-2 border-slate-900 flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-slate-900' : 'bg-white'}`}>
                                                                    {isActive && <Check className="h-4 w-4 text-white" />}
                                                                </div>
                                                                <span className="text-xs font-medium text-slate-800 leading-relaxed">{type}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold uppercase text-slate-500">Other Details / Comments (Describe them below)</label>
                                                    <div className="border-2 border-slate-900 p-1 bg-white">
                                                        <textarea
                                                            className="w-full h-32 p-4 bg-transparent outline-none resize-none font-medium text-slate-800 border-b border-slate-200 border-dotted"
                                                            placeholder="..."
                                                            value={report.otherProgrammeDetails || ""}
                                                            onChange={(e) => setReport({ ...report, otherProgrammeDetails: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-10 space-y-8">
                                                <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                                                    <div className="flex-1 flex flex-col gap-1 w-full">
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-sm font-bold text-slate-900 shrink-0">Date:</span>
                                                            <div className="flex-1 border-b-2 border-slate-900 border-dotted h-8 px-4 font-medium flex items-center">
                                                                {new Date().toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-2 flex flex-col gap-1 w-full">
                                                        <div className="flex items-end gap-2">
                                                            <span className="text-sm font-bold text-slate-900 shrink-0">Signature of Student:</span>
                                                            <div className="flex-1 border-b-2 border-slate-900 border-dotted h-12 flex items-center justify-center relative">
                                                                <span className="font-[signature] text-2xl text-slate-800 -rotate-2">{student?.fullName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 italic text-center">
                                                    Please make a photocopy of this form for your own retention before submitting to IAP coordinator.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="text-[10px] font-semibold uppercase text-slate-400">Full Legal Signature of Student</label>
                                        <div className="h-14 border-b-2 border-slate-900 flex items-center px-6 bg-slate-50/50 rounded-t-xl group">
                                            <span className="font-[signature] text-3xl text-slate-900 select-none opacity-80 group-hover:opacity-100 transition-opacity -rotate-1">{student?.fullName || "Digitally Verified"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end pt-8 border-t-2 border-slate-100">
                                    <Button
                                        onClick={handleSaveReport}
                                        disabled={isSaving}
                                        className="h-12 px-8 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : "Finalize & Seal Report"}
                                    </Button>
                                </div>
                            </div>
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
                                                <span className="text-primary-foreground/80 font-black uppercase text-[10px]">Secure Documentation Vault</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fetchData()}
                                                    disabled={loading}
                                                    className="h-6 px-2 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-md text-[9px] font-black uppercase inline-flex items-center gap-1.5 transition-all ml-2"
                                                >
                                                    <Zap className={cn("h-2.5 w-2.5", loading && "animate-spin")} />
                                                    {loading ? "Syncing..." : "Check for Updates"}
                                                </Button>
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
                                                                    { id: 'knowledgeWirelessOps', label: 'Knowledge in Wireless Operations' },
                                                                    { id: 'knowledgeWirelessEst', label: 'Knowledge in Wireless Establishment' },
                                                                    { id: 'knowledgeWirelessMaint', label: 'Knowledge in Wireless Maintenance' },
                                                                    { id: 'knowledgeApplication', label: 'Application of Knowledge' },
                                                                ];

                                                                const assignmentsScore = assignmentRowConfig.reduce((acc, row) => {
                                                                    return acc + (student?.ratings?.[0]?.[row.id as keyof typeof student.ratings[0]] || 0);
                                                                }, 0);

                                                                return assignmentRowConfig.map((item, i) => {
                                                                    const savedScore = student?.ratings?.[0]?.[item.id as keyof typeof student.ratings[0]] as number;

                                                                    return (
                                                                        <tr key={item.id} className="border-b border-slate-300 hover:bg-slate-50/50 transition-colors">
                                                                            {i === 0 && (
                                                                                <td rowSpan={assignmentRowConfig.length} className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-100 text-slate-800">
                                                                                    Related Knowledge
                                                                                </td>
                                                                            )}
                                                                            <td className="border-r border-slate-300 p-2 text-center font-bold text-slate-500">{i + 1}</td>
                                                                            <td className="border-r border-slate-300 p-3 leading-tight min-w-[200px] font-semibold text-slate-700">
                                                                                {item.label}
                                                                            </td>
                                                                            {[10, 9, 8, 7, 6].map(val => (
                                                                                <td key={val} className="border-r border-slate-300 p-2 text-center">
                                                                                    <div
                                                                                        className={cn(
                                                                                            "h-8 w-8 mx-auto flex items-center justify-center rounded-lg border-2 transition-all duration-300",
                                                                                            savedScore === val
                                                                                                ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-lg font-black ring-4 ring-slate-900/10"
                                                                                                : "border-transparent text-slate-200 font-bold opacity-40"
                                                                                        )}
                                                                                    >
                                                                                        {val}
                                                                                    </div>
                                                                                </td>
                                                                            ))}
                                                                            <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-50 text-slate-400">
                                                                                {i === 0 ? `/40` : ""}
                                                                            </td>
                                                                            {i === 0 && (
                                                                                <td rowSpan={assignmentRowConfig.length} className="p-4 align-middle bg-white group">
                                                                                    <div className="h-24 w-full border-4 border-slate-100 group-hover:border-primary/20 rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-50/30">
                                                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1">Subtotal</span>
                                                                                        <span className="text-3xl font-black text-slate-900">{assignmentsScore}</span>
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
                                                                    <tr key={item.id} className="border-b border-slate-300 hover:bg-slate-50/50 transition-colors">
                                                                        {i === 0 && (
                                                                            <td rowSpan={3} className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-100 text-slate-800">
                                                                                Attitude
                                                                            </td>
                                                                        )}
                                                                        <td className="border-r border-slate-300 p-2 text-center font-bold text-slate-500">{item.index}</td>
                                                                        <td className="border-r border-slate-300 p-3 leading-tight font-semibold text-slate-700">{item.label}</td>
                                                                        {[10, 9, 8, 7, 6].map(val => (
                                                                            <td key={val} className="border-r border-slate-300 p-2 text-center">
                                                                                <div
                                                                                    className={cn(
                                                                                        "h-8 w-8 mx-auto flex items-center justify-center rounded-lg border-2 transition-all duration-300",
                                                                                        savedScore === val
                                                                                            ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-lg font-black ring-4 ring-slate-900/10"
                                                                                            : "border-transparent text-slate-200 font-bold opacity-40"
                                                                                    )}
                                                                                >
                                                                                    {val}
                                                                                </div>
                                                                            </td>
                                                                        ))}
                                                                        <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-50 text-slate-400">
                                                                            {i === 0 ? `/30` : ""}
                                                                        </td>
                                                                        {i === 0 && (
                                                                            <td rowSpan={3} className="p-4 align-middle bg-white group">
                                                                                <div className="h-24 w-full border-4 border-slate-100 group-hover:border-primary/20 rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-50/30">
                                                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1">Subtotal</span>
                                                                                    <span className="text-3xl font-black text-slate-900">{attitudeScore}</span>
                                                                                </div>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            })}

                                                            {/* Safety Area */}
                                                            {(() => {
                                                                const assignmentsScore = [
                                                                    { id: 'knowledgeWirelessOps' },
                                                                    { id: 'knowledgeWirelessEst' },
                                                                    { id: 'knowledgeWirelessMaint' },
                                                                    { id: 'knowledgeApplication' },
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
                                                                        <tr key={item.id} className="border-b border-slate-300 hover:bg-slate-50/50 transition-colors">
                                                                            {i === 0 && (
                                                                                <td rowSpan={3} className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-100 text-slate-800">
                                                                                    Safety
                                                                                </td>
                                                                            )}
                                                                            <td className="border-r border-slate-300 p-2 text-center font-bold text-slate-500">{item.index}</td>
                                                                            <td className="border-r border-slate-300 p-3 leading-tight font-semibold text-slate-700">{item.label}</td>
                                                                            {[10, 9, 8, 7, 6].map(val => (
                                                                                <td key={val} className="border-r border-slate-300 p-2 text-center">
                                                                                    <div
                                                                                        className={cn(
                                                                                            "h-8 w-8 mx-auto flex items-center justify-center rounded-lg border-2 transition-all duration-300",
                                                                                            savedScore === val
                                                                                                ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-lg font-black ring-4 ring-slate-900/10"
                                                                                                : "border-transparent text-slate-200 font-bold opacity-40"
                                                                                        )}
                                                                                    >
                                                                                        {val}
                                                                                    </div>
                                                                                </td>
                                                                            ))}
                                                                            <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-50 text-slate-400">
                                                                                {i === 0 ? `/30` : ""}
                                                                            </td>
                                                                            {i === 0 && (
                                                                                <td rowSpan={3} className="p-4 align-middle bg-white group">
                                                                                    <div className="h-24 w-full border-4 border-slate-100 group-hover:border-primary/20 rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-50/30">
                                                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1">Subtotal</span>
                                                                                        <span className="text-3xl font-black text-slate-900">{safetyScore}</span>
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
                                                                    <tr className="border-b-2 border-slate-900 border-t-2">
                                                                        <td className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-900 text-white">
                                                                            Attendance
                                                                        </td>
                                                                        <td colSpan={7} className="p-10 space-y-6 bg-white">
                                                                            <div className="flex items-center gap-6">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Days of Absence</span>
                                                                                    <div className="w-32 border-b-4 border-slate-900 text-center font-black text-3xl h-14 flex items-center justify-center bg-slate-50 rounded-t-xl">
                                                                                        {absentDays}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-1 space-y-2">
                                                                                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed max-w-xl">
                                                                                        <span className="text-primary font-black">* DEDUCTION RULE:</span> 10 points are deducted for each unauthorized absence. Sick leave with documentation is exempt.
                                                                                    </p>
                                                                                    <p className="text-[11px] font-medium text-slate-400 italic leading-relaxed max-w-xl">
                                                                                        * 3 instances of unauthorized late arrival or early departure equal 1 day of absence.
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="border-r-2 border-slate-900 p-2 text-center font-black bg-slate-50 text-slate-900">
                                                                            <div className="flex flex-col items-center">
                                                                                <span className="text-[9px] uppercase opacity-40 mb-1">Score</span>
                                                                                <span className="text-xl">{attendanceRaw}</span>
                                                                                <span className="text-[9px] opacity-40">/ 100</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-6 align-middle bg-slate-900 text-white relative overflow-hidden group">
                                                                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                                <Zap className="h-12 w-12 text-white" />
                                                                            </div>
                                                                            <div className="text-center space-y-1 relative z-10">
                                                                                <span className="text-[10px] font-black uppercase block opacity-60 tracking-widest">Final Weighted</span>
                                                                                <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-br from-white to-white/70">{finalTotal}</div>
                                                                                <div className="h-1 w-12 bg-primary mx-auto my-2" />
                                                                                <span className="text-[10px] font-bold opacity-40">OVERALL GRADE</span>
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
                                                            <div className="grid grid-cols-1 md:grid-cols-4 border-b-2 border-x-2 border-slate-900 bg-white">
                                                                <div className="border-r border-slate-900 p-8 flex items-center justify-center bg-slate-50">
                                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 [writing-mode:vertical-rl] rotate-180">Summary Scheme</span>
                                                                </div>
                                                                <div className="col-span-3 p-10 flex flex-col gap-6">
                                                                    {/* Performance component */}
                                                                    <div className="flex items-center gap-4 text-sm flex-wrap">
                                                                        <div className="h-10 px-4 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-3">
                                                                            <span className="font-bold text-slate-500 italic">performance score</span>
                                                                            <div className="w-12 text-center font-black text-slate-900 text-lg">{rawScore}</div>
                                                                        </div>
                                                                        <span className="font-black text-slate-300">×</span>
                                                                        <div className="h-10 px-4 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-3">
                                                                            <span className="font-bold text-slate-500">80%</span>
                                                                            <span className="text-slate-300">=</span>
                                                                            <div className="w-16 text-center font-black text-primary text-lg">{Math.round(weightedPerformance * 10) / 10}</div>
                                                                        </div>
                                                                    </div>
                                                                    {/* Attendance component */}
                                                                    <div className="flex items-center gap-4 text-sm flex-wrap">
                                                                        <div className="h-10 px-4 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-3">
                                                                            <span className="font-bold text-slate-500 italic">attendance score</span>
                                                                            <div className="w-12 text-center font-black text-slate-900 text-lg">{attendanceRaw}</div>
                                                                        </div>
                                                                        <span className="font-black text-slate-300">×</span>
                                                                        <div className="h-10 px-4 rounded-full bg-slate-50 border border-slate-200 flex items-center gap-3">
                                                                            <span className="font-bold text-slate-500">20%</span>
                                                                            <span className="text-slate-300">=</span>
                                                                            <div className="w-16 text-center font-black text-primary text-lg">{Math.round(attendanceWeighted * 10) / 10}</div>
                                                                        </div>
                                                                    </div>
                                                                    {/* Final total */}
                                                                    <div className="flex items-center gap-6 border-t-2 border-slate-100 pt-8 mt-2 flex-wrap">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Final Result</span>
                                                                            <div className="flex items-baseline gap-2">
                                                                                <div className="text-5xl font-black text-slate-900 tracking-tighter">{finalTotal}</div>
                                                                                <span className="text-sm font-bold text-slate-400">/ 100</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="hidden md:block h-12 w-px bg-slate-200 mx-4" />
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Grade Status</span>
                                                                            <span className={cn(
                                                                                "text-sm font-black uppercase px-3 py-1 rounded-full border-2",
                                                                                finalTotal >= 50 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                                                                            )}>
                                                                                {finalTotal >= 50 ? "PASSED" : "RE-EVALUATION REQUIRED"}
                                                                            </span>
                                                                        </div>
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
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div >
    );
}
