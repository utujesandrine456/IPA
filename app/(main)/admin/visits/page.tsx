"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { MapPin } from "lucide-react";

export default function VisitsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">LO Visits</h1>
                <p className="text-primary/60">Track Liaison Officer visits and outcomes</p>
            </div>

            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="text-center">
                    <div className="h-16 w-16 bg-neutral/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="h-8 w-8 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary">No Visits Recorded</h3>
                    <p className="text-primary/60 max-w-sm mt-2">
                        No field visits have been recorded yet. Visit logs will appear here when LOs submit their reports.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
