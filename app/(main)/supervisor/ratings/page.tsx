"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Star } from "lucide-react";

export default function RatingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Student Ratings</h1>
                <p className="text-primary/60">Rate student performance</p>
            </div>

            <Card className="min-h-[400px] flex items-center justify-center border-dashed">
                <CardContent className="text-center">
                    <div className="h-16 w-16 bg-neutral/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-primary/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary">Ratings Module</h3>
                    <p className="text-primary/60 max-w-sm mt-2">
                        Select a student from the "My Students" page to submit a final rating at the end of the term.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
