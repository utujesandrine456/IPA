import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    FileText,
    MapPin,
    Settings,
    LogOut,
} from "lucide-react";

import { useEffect, useState } from "react";

interface SidebarProps {
    role: "admin" | "supervisor" | "student";
    userId: number | null;
}

interface User {
    id: number;
    name: string;
    role: string;
    email: string;
    studentProfile?: {
        id: number;
    };
    supervisorProfile?: {
        id: number;
    };
}

export function Sidebar({ role, userId: propUserId }: SidebarProps) {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (propUserId) {
            fetchCurrentUser(propUserId);
        }
    }, [propUserId]);

    const fetchCurrentUser = async (id: number) => {
        try {
            const res = await fetch(`/api/user/current?userId=${id}`);
            const data = await res.json();

            if (data.user) {
                setUser(data.user);
            }
        } catch (error) {
            console.error("Error fetching current user:", error);
        } finally {
            setLoading(false);
        }
    };

    const userId = user?.id;

    const links = {
        admin: [
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/users", label: "Manage Users", icon: Users },
            { href: "/admin/reports", label: "Reports", icon: FileText },
            { href: "/admin/visits", label: "LO Visits", icon: MapPin },
        ],
        supervisor: [
            { href: `/supervisor/${userId}`, label: "Dashboard", icon: LayoutDashboard },
            { href: "/supervisor/students", label: "My Students", icon: Users },
            { href: "/supervisor/chat", label: "Chats", icon: Users },
            { href: "/supervisor/ratings", label: "Ratings", icon: FileText },
        ],
        student: [
            { href: `/student/${userId}`, label: "Dashboard", icon: LayoutDashboard },
            { href: "/student/logbook", label: "Logbook", icon: FileText },
            { href: "/student/chat", label: "Chats", icon: Users },
        ],
    };

    const currentLinks = links[role] || [];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-neutral/10 bg-white transition-transform">
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-8 flex items-center pl-2.5">
                    <span className="self-center whitespace-nowrap text-3xl font-bold text-primary font-heading">
                        IPA System
                    </span>
                </div>

                <ul className="space-y-2 font-medium flex-1">
                    {currentLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "flex items-center rounded-lg p-2 text-neutral-dark hover:bg-neutral/5 group transition-colors",
                                        isActive && "bg-primary/10 text-primary"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5 transition duration-75", isActive ? "text-primary" : "text-neutral group-hover:text-primary")} />
                                    <span className="ml-3">{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-auto space-y-2">
                    <Link
                        href="/help"
                        className="flex items-center rounded-lg p-2 text-neutral-dark hover:bg-neutral/5 group"
                    >
                        <Settings className="h-5 w-5 text-neutral group-hover:text-primary transition duration-75" />
                        <span className="ml-3">Settings</span>
                    </Link>
                    <button className="flex w-full items-center rounded-lg p-2 text-neutral-dark hover:bg-error/5 group text-left">
                        <LogOut className="h-5 w-5 text-neutral group-hover:text-error transition duration-75" />
                        <span className="ml-3 group-hover:text-error">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
