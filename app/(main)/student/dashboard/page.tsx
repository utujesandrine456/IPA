"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText, User } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentDashboard() {
    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm border border-neutral/10"
            >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-green-500/10 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-primary mb-2">Student Dashboard</h1>
                    <p className="text-primary/70">Welcome to your internship portal.</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">My Supervisor</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">Unassigned</div>
                        <p className="text-xs text-muted-foreground">Contact Admin if incorrect</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Logbook Entries</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Total submissions</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
