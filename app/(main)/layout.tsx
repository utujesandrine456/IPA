"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [userId, setUserId] = useState<number | null>(null);

    let role: "admin" | "supervisor" | "student" = "student";
    if (pathname.startsWith("/admin")) role = "admin";
    else if (pathname.startsWith("/supervisor")) role = "supervisor";

    useEffect(() => {
        // Extract user ID from pathname (e.g., /student/3 or /supervisor/2)
        const pathParts = pathname.split('/').filter(Boolean);

        if (pathParts.length >= 2) {
            const potentialId = Number(pathParts[1]);
            if (!isNaN(potentialId)) {
                setUserId(potentialId);
                return;
            }
        }

        // Fallback: try to get from localStorage for backward compatibility
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUserId(parsed.id);
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, [pathname]);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar role={role} userId={userId} />
            <TopBar role={role} userId={userId} />
            <main className="ml-64 pt-16 min-h-screen">
                <div className="p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
