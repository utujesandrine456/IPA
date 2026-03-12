"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface RatingData {
    knowledgeWirelessOps: number;
    knowledgeWirelessEst: number;
    knowledgeWirelessMaint: number;
    knowledgeApplication: number;
    responsibility: number;
    cooperativeness: number;
    complianceEtiquette: number;
    safetyAwareness: number;
    safetyCompliance: number;
    safetyArrangement: number;
    absentDays: number;
    comment: string;
    evaluatorPosition: string;
    evaluatorName: string;
}

export default function StudentRatingPage() {
    const params = useParams();
    const router = useRouter();
    const supervisorId = params.id as string;
    const studentId = params.studentId as string;

    const [student, setStudent] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [rating, setRating] = useState<RatingData>({
        knowledgeWirelessOps: 0,
        knowledgeWirelessEst: 0,
        knowledgeWirelessMaint: 0,
        knowledgeApplication: 0,
        responsibility: 0,
        cooperativeness: 0,
        complianceEtiquette: 0,
        safetyAwareness: 0,
        safetyCompliance: 0,
        safetyArrangement: 0,
        absentDays: 0,
        comment: "",
        evaluatorPosition: "",
        evaluatorName: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentRes, tasksRes] = await Promise.all([
                    apiFetch(`/students/${studentId}`),
                    apiFetch(`/tasks?studentId=${studentId}`)
                ]);

                if (studentRes.ok) {
                    const studentData = studentRes.data.student || studentRes.data;
                    setStudent(studentData);
                    setRating(prev => ({
                        ...prev,
                        absentDays: (studentData.absentDays !== undefined && studentData.absentDays !== null) ? studentData.absentDays : 0
                    }));
                }

                if (tasksRes.ok) {
                    setTasks(tasksRes.data.tasks || []);
                }
            } catch (error) {
                console.error("error fetching data:", error);
                toast.error("failed to load assessment data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const assignmentsScore = rating.knowledgeWirelessOps + rating.knowledgeWirelessEst + rating.knowledgeWirelessMaint + rating.knowledgeApplication;
    const attitudeScore = rating.responsibility + rating.cooperativeness + rating.complianceEtiquette;
    const safetyScore = rating.safetyAwareness + rating.safetyCompliance + rating.safetyArrangement;

    const rawScore = assignmentsScore + attitudeScore + safetyScore;
    const weightedPerformance = rawScore * 0.8;

    const attendanceRaw = Math.max(0, 100 - (rating.absentDays * 10));
    const attendanceWeighted = attendanceRaw * 0.2;

    const finalTotal = Math.round((weightedPerformance + attendanceWeighted) * 10) / 10;

    const handleSaveAssessment = async () => {
        setIsSaving(true);
        try {
            await apiFetch(`/students/${studentId}`, {
                method: "PATCH",
                body: JSON.stringify({ absentDays: rating.absentDays })
            });

            await apiFetch("/ratings", {
                method: "POST",
                body: JSON.stringify({
                    studentId: Number(studentId),
                    supervisorId: Number(supervisorId),
                    rating: finalTotal,
                    comment: rating.comment,
                    knowledgeWirelessOps: rating.knowledgeWirelessOps,
                    knowledgeWirelessEst: rating.knowledgeWirelessEst,
                    knowledgeWirelessMaint: rating.knowledgeWirelessMaint,
                    knowledgeApplication: rating.knowledgeApplication,
                    responsibility: rating.responsibility,
                    cooperativeness: rating.cooperativeness,
                    complianceEtiquette: rating.complianceEtiquette,
                    safetyAwareness: rating.safetyAwareness,
                    safetyCompliance: rating.safetyCompliance,
                    safetyArrangement: rating.safetyArrangement,
                }),
            });

            toast.success("assessment submitted successfully");
            setTimeout(() => router.push(`/supervisor/${supervisorId}/ratings`), 1500);
        } catch (error) {
            console.error(error);
            toast.error("submission failed");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
                    <p className="text-slate-400 font-medium">Loading assessment form...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans selection:bg-slate-200 selection:text-slate-900">
            <Toaster position="top-right" />

            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors group cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Industrial attachment assessment (for companies)</h1>
                            <p className="text-[11px] text-slate-400">supervisor portal • institutional assessment record</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveAssessment}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-10 rounded text-sm font-medium shadow-sm transition-all cursor-pointer"
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                        Finalize Assessment
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* student details header */}
                <div className="bg-white border-2 border-slate-900 p-0 overflow-hidden">
                    {/* header */}
                    <div className="border-b-2 border-slate-900 p-6 flex flex-col items-center justify-center space-y-4">
                        <div className="w-full space-y-4 pt-4 px-4">
                            <div className="flex gap-2 items-end">
                                <span className="text-sm font-bold whitespace-nowrap">Student name:</span>
                                <div className="flex-1 border-b border-black border-dotted h-5 text-sm uppercase px-2">{student?.user?.name || "................................................................................................................................................"}</div>
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

                                    // show only as many rows as there are tasks, or at least 1 if none
                                    const displayRows = tasks.length > 0
                                        ? assignmentRowConfig.slice(0, Math.min(tasks.length, 4))
                                        : [assignmentRowConfig[0]];

                                    return displayRows.map((item, i) => {
                                        const task = tasks[item.key];
                                        const label = task ? task.title : "Related Knowledge";

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
                                                            onClick={() => setRating(prev => ({ ...prev, [item.id]: val }))}
                                                            className={cn(
                                                                "h-8 w-8 mx-auto flex items-center justify-center rounded-lg cursor-pointer transition-all border-2",
                                                                rating[item.id as keyof RatingData] === val
                                                                    ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-md"
                                                                    : "border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600 font-bold"
                                                            )}
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
                                ].map((item, i) => (
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
                                                    onClick={() => setRating(prev => ({ ...prev, [item.id]: val }))}
                                                    className={cn(
                                                        "h-8 w-8 mx-auto flex items-center justify-center rounded-lg cursor-pointer transition-all border-2",
                                                        rating[item.id as keyof RatingData] === val
                                                            ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-md"
                                                            : "border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600 font-bold"
                                                    )}
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
                                ))}

                                {/* Safety Area */}
                                {[
                                    { id: 'safetyAwareness', label: 'Awareness of safety management', index: 1 },
                                    { id: 'safetyCompliance', label: 'Compliance with safety rules', index: 2 },
                                    { id: 'safetyArrangement', label: 'Arrangement of safety instruments', index: 3 },
                                ].map((item, i) => (
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
                                                <div
                                                    onClick={() => setRating(prev => ({ ...prev, [item.id]: val }))}
                                                    className={cn(
                                                        "h-8 w-8 mx-auto flex items-center justify-center rounded-lg cursor-pointer transition-all border-2",
                                                        rating[item.id as keyof RatingData] === val
                                                            ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-md"
                                                            : "border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600 font-bold"
                                                    )}
                                                >
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
                                ))}

                                {/* Attendance Block */}
                                <tr className="border-b-2 border-slate-900">
                                    <td className="border-r-2 border-slate-900 p-2 font-black uppercase [writing-mode:vertical-rl] rotate-180 text-center w-12 tracking-widest bg-slate-900 text-white">
                                        Attendance
                                    </td>
                                    <td colSpan={7} className="p-8 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black whitespace-nowrap uppercase">Days of Absence:</span>
                                            <input
                                                type="number"
                                                className="w-24 border-b-2 border-black border-dotted focus:outline-none text-center font-black text-lg h-10"
                                                value={rating.absentDays}
                                                onChange={(e) => setRating(prev => ({ ...prev, absentDays: Number(e.target.value) || 0 }))}
                                            />
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
                </div>

                {/* student attendance sheet footer */}
                <div className="bg-white border-2 border-slate-900 mt-8 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-black">
                        <span className="text-sm font-black uppercase tracking-widest pl-2">Student attendance sheet</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-900">
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
                    <div className="p-8 border-b border-slate-900 text-center">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-900 h-40">
                        <div className="border-r border-slate-900 p-6 flex items-center justify-center bg-slate-50 text-center">
                            <span className="text-sm font-black uppercase">Overall<br />Review</span>
                        </div>
                        <div className="col-span-3 p-0">
                            <textarea
                                className="w-full h-full p-6 text-sm resize-none focus:outline-none placeholder:text-slate-200"
                                placeholder="Write overall student performance review here..."
                                value={rating.comment}
                                onChange={(e) => setRating(prev => ({ ...prev, comment: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="p-10 space-y-8 bg-slate-50">
                        <div className="flex gap-4 items-end">
                            <span className="text-sm font-bold uppercase w-48">Company Name:</span>
                            <div className="flex-1 h-6 font-semibold px-4 border-b-2 border-black border-dotted">{student?.companyName || "................................................................................................................................"}</div>
                        </div>
                        <div className="flex gap-4 items-end">
                            <span className="text-sm font-bold uppercase w-48">Evaluator's Position:</span>
                            <Input
                                className="flex-1 bg-transparent border-b-2 border-black border-dotted rounded-none shadow-none h-6 p-0 text-md font-semibold focus-visible:ring-0"
                                value={rating.evaluatorPosition}
                                onChange={(e) => setRating(prev => ({ ...prev, evaluatorPosition: e.target.value }))}
                                placeholder="................................................................................................................................"
                            />
                        </div>
                        <div className="flex gap-4 items-end relative">
                            <span className="text-sm font-bold uppercase w-48">Name:</span>
                            <Input
                                className="flex-1 bg-transparent border-b-2 border-black border-dotted rounded-none shadow-none h-6 p-0 text-md font-semibold focus-visible:ring-0"
                                value={rating.evaluatorName}
                                onChange={(e) => setRating(prev => ({ ...prev, evaluatorName: e.target.value }))}
                                placeholder="................................................................................................................................"
                            />
                            <span className="absolute right-0 bottom-1 text-[10px] font-bold italic opacity-40">(signature)</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
