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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    let role: "admin" | "supervisor" | "student" = "student";

    // Detect role from localStorage FIRST for consistency
    if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                const lowerRole = parsed.role?.toLowerCase();
                if (lowerRole === "admin" || lowerRole === "supervisor" || lowerRole === "student") {
                    role = lowerRole;
                }
            } catch (e) {
                console.error("Layout role recovery failed", e);
            }
        }
    }

    // Pathname overrides localStorage if it's an explicit dashboard path
    if (pathname.startsWith("/admin")) role = "admin";
    else if (pathname.startsWith("/supervisor")) role = "supervisor";
    else if (pathname.startsWith("/student")) role = "student";

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

    // Simple loading state or empty shell during SSR to prevent hydration issues
    if (!mounted) return <div className="min-h-screen bg-background" />;

    return (
        <div className="flex min-h-screen bg-background overflow-hidden w-full">
            <Sidebar role={role} userId={userId} />
            <div className="flex flex-col w-full pl-64 h-screen">
                <TopBar role={role} userId={userId} />
                <main className="pt-16 flex-1 overflow-y-auto w-full">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
