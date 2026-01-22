import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
    id: number;
    name: string;
    role: string;
}

interface TopBarProps {
    role: "admin" | "supervisor" | "student";
}

export function TopBar({ role }: TopBarProps) {
    const [user, setUser] = useState<User | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                fetchUnreadCount(parsed.id);
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const fetchUnreadCount = async (userId: number) => {
        try {
            const res = await fetch(`/api/notifications?userId=${userId}`);
            const data = await res.json();
            const unread = (data.notifications || []).filter((n: any) => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    const getRoleTitle = (role: string) => {
        switch (role) {
            case "admin": return "Industrial Coordinator";
            case "supervisor": return "Academic Supervisor";
            case "student": return "IAP Student";
            default: return "User";
        }
    };

    const initials = user?.name
        ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : "AU";

    return (
        <header className="fixed top-0 z-30 ml-64 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-neutral/10 bg-white/80 px-6 backdrop-blur-sm">
            <div className="w-96">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                    <input
                        type="text"
                        placeholder="Search students, logs, or companies..."
                        className="h-10 w-full rounded-full border border-neutral/20 bg-neutral/5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Link href="/notifications" className="relative rounded-full p-2 text-neutral hover:bg-neutral/10 transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-white"></span>
                    )}
                </Link>

                <div className="flex items-center gap-3 border-l border-neutral/20 pl-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-neutral-dark">{user?.name || "Premium User"}</p>
                        <p className="text-xs text-neutral">{getRoleTitle(role)}</p>
                    </div>
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                        {initials}
                    </div>
                </div>
            </div>
        </header>
    );
}
