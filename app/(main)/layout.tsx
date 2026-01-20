"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { usePathname } from "next/navigation";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    let role: "admin" | "supervisor" | "student" = "student";
    if (pathname.startsWith("/admin")) role = "admin";
    else if (pathname.startsWith("/supervisor")) role = "supervisor";

    return (
        <div className="min-h-screen bg-background">
            <Sidebar role={role} />
            <TopBar />
            <main className="ml-64 pt-16 min-h-screen">
                <div className="p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
