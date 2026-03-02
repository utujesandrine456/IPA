"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { FileText } from "lucide-react";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">System Reports</h1>
                <p className="text-primary/60">Generate and view system activity reports</p>
            </div>

            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="text-center">
                    <div className="h-16 w-16 bg-neutral/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary">No Reports Generated</h3>
                    <p className="text-primary/60 max-w-sm mt-2">
                        There are no reports available at this time. Reports will appear here once system activity increases.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
