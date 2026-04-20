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
    Check,
    Bell
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

interface SidebarProps {
    role: "admin" | "supervisor" | "student" | "liaison";
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
    studentId?: number;
    supervisorId?: number;
    liaisonId?: number;
    liaisonProfile?: {
        id: number;
    };
}

export function Sidebar({ role, userId: propUserId }: SidebarProps) {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                    const result = await apiFetch('/notifications');
                    if (result.ok && Array.isArray(result.data)) {
                        const unread = result.data.filter((n: any) => !n.read).length;
                        setUnreadCount(unread);
                    }
                } catch (e) {
                    console.error("Sidebar: Local storage parse failed", e);
                }
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 15000); 
        return () => clearInterval(interval);
    }, [propUserId]);

    const handleSignOut = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    const links = {
        admin: [
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/users", label: "Manage Users", icon: Users },
            { href: "/admin/reports", label: "Reports", icon: FileText },
            { href: "/admin/visits", label: "LO Visits", icon: MapPin },
            { href: "/notifications", label: "Notifications", icon: Bell },
        ],
        supervisor: [
            { href: `/supervisor/${user?.supervisorId || user?.supervisorProfile?.id || user?.id || propUserId}`, label: "Dashboard", icon: LayoutDashboard },
            { href: `/supervisor/${user?.supervisorId || user?.supervisorProfile?.id || user?.id || propUserId}/ratings`, label: "Ratings", icon: Users },
            { href: `/supervisor/${user?.supervisorId || user?.supervisorProfile?.id || user?.id || propUserId}/logbook`, label: "Logbook", icon: FileText },
            { href: "/notifications", label: "Notifications", icon: Bell },
        ],
        student: [
            { href: `/student/${user?.studentId || user?.studentProfile?.id || user?.id || propUserId}`, label: "Dashboard", icon: LayoutDashboard },
            { href: "/student/logbook", label: "Logbook", icon: FileText },
            { href: "/student/tasks", label: "Tasks", icon: Check },
            { href: "/notifications", label: "Notifications", icon: Bell },
        ],
        liaison: [
            { href: `/liaison/${user?.liaisonId || user?.liaisonProfile?.id || user?.id || propUserId}`, label: "Portal", icon: LayoutDashboard },
            { href: "/notifications", label: "Notifications", icon: Bell },
        ],
    };

    const currentLinks = links[role] || [];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-neutral/10 bg-white transition-transform shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-8 flex items-center pl-2.5">
                    <span className="self-center whitespace-nowrap text-3xl font-bold text-primary font-heading">
                        IAP System
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
                                        "flex items-center justify-between rounded-lg p-3 text-neutral-dark hover:bg-primary/80 hover:text-white group transition-colors",
                                        isActive && "bg-primary text-white"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <Icon className={cn("h-5 w-5 transition duration-75", isActive ? "text-white" : "text-neutral group-hover:text-white")} />
                                        <span className="ml-3">{link.label}</span>
                                    </div>
                                    {link.label === "Notifications" && unreadCount > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white mr-1">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-auto space-y-2">
                    <Link
                        href="/settings"
                        className="flex items-center rounded-lg p-2 text-neutral-dark hover:bg-neutral/5 group"
                    >
                        <Settings className="h-5 w-5 text-neutral group-hover:text-primary transition duration-75" />
                        <span className="ml-3">Settings</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center rounded-lg p-2 text-neutral-dark hover:bg-error/5 group text-left cursor-pointer"
                    >
                        <LogOut className="h-5 w-5 text-neutral group-hover:text-error transition duration-75" />
                        <span className="ml-3 group-hover:text-error font-bold">Sign Out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
