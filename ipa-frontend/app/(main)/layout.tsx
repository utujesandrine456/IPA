"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [userId, setUserId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [role, setRole] = useState<"admin" | "supervisor" | "student" | "liaison">("student");

    useEffect(() => {
        const checkAuth = async () => {
            if (typeof window === "undefined") return;

            const storedUser = localStorage.getItem("user");
            const token = localStorage.getItem("token");

            if (!storedUser || !token) {
                if (!pathname.includes("/login") && pathname !== "/") {
                    router.replace("/login");
                } else {
                    setMounted(true);
                }
                return;
            }

            try {
                const user = JSON.parse(storedUser);
                const userRole = user.role?.toUpperCase();
                const sid = user.studentId || user.supervisorId || user.liaisonId || user.id;

                if (!userRole) {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    router.replace("/login");
                    return;
                }

                if (userRole === "ADMIN") setRole("admin");
                else if (userRole === "SUPERVISOR") setRole("supervisor");
                else if (userRole === "LIAISON") setRole("liaison");
                else setRole("student");

                if (pathname === "/") {
                    if (userRole === "ADMIN") router.replace("/admin");
                    else if (userRole === "SUPERVISOR") router.replace(`/supervisor/${sid}`);
                    else if (userRole === "LIAISON") router.replace(`/liaison/${sid}`);
                    else if (userRole === "STUDENT") {
                        if (user.profileCompleted || user.studentProfile?.profileCompleted) {
                            router.replace(`/student/${sid}`);
                        } else {
                            router.replace(`/complete-profile?token=login_${sid}`);
                        }
                    }
                    return;
                }


                const isAuthorized =
                    (pathname.startsWith("/admin") && userRole === "ADMIN") ||
                    (pathname.startsWith("/supervisor") && userRole === "SUPERVISOR") ||
                    (pathname.startsWith("/liaison") && userRole === "LIAISON") ||
                    (pathname.startsWith("/student") && userRole === "STUDENT") ||
                    pathname === "/settings" ||
                    pathname === "/login" ||
                    pathname === "/complete-profile" ||
                    pathname.startsWith("/reset-password") ||
                    pathname.startsWith("/forgot-password");

                if (!isAuthorized) {
                    if (userRole === "ADMIN") router.replace("/admin");
                    else if (userRole === "SUPERVISOR") router.replace(`/supervisor/${sid}`);
                    else if (userRole === "LIAISON") router.replace(`/liaison/${sid}`);
                    else if (userRole === "STUDENT") router.replace(`/student/${sid}`);
                    setMounted(true);
                    return;
                }

                setUserId(user.id);
                setMounted(true);

                // Background session verification (Silent sync)
                if (!pathname.includes("/login") && !pathname.includes("/complete-profile")) {
                    apiFetch('/auth/me').then(res => {
                        if (!res.ok && res.status === 401) {
                            localStorage.removeItem("user");
                            localStorage.removeItem("token");
                            router.replace("/login");
                        }
                    }).catch(() => { });
                }

            } catch (e) {
                console.error("Auth hydration failed", e);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                router.replace("/login");
            }
        };

        checkAuth();
    }, [pathname, router]);

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
