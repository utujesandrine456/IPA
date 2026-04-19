import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface User {
    id: number;
    name: string;
    role: string;
    email: string;
}

interface TopBarProps {
    role: "admin" | "supervisor" | "student" | "liaison";
    userId: number | null;
}

export function TopBar({ role, userId }: TopBarProps) {
    const [user, setUser] = useState<User | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        // Immediate population from localStorage
        if (typeof window !== "undefined") {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    if (parsed.notifications) {
                        setNotifications(parsed.notifications);
                        const unread = (parsed.notifications || []).filter((n: any) => !n.read).length;
                        setUnreadCount(unread);
                    }
                } catch (e) {
                    console.error("TopBar: Local storage parse failed", e);
                }
            }
        }

        // Initial fetch
        if (userId) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }

        // Set up polling for notifications every 30 seconds
        const interval = setInterval(() => {
            if (userId) {
                fetchCurrentUser();
            }
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [userId]);

    const fetchCurrentUser = async () => {
        try {
            const result = await apiFetch('/auth/me');

            if (result.ok && result.data) {
                const data = result.data;
                console.log("TopBar: Notifications updated:", data.notifications?.length);
                setUser(data);
                // Background update of storage
                localStorage.setItem("user", JSON.stringify(data));
                setNotifications(data.notifications || []);
                const unread = (data.notifications || []).filter((n: any) => !n.read).length;
                setUnreadCount(unread);
            } else if (result.status === 401) {
                console.warn("TopBar: Session expired or unauthorized.");
            }
        } catch (error) {
            console.error("TopBar: Failed to verify session.", error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleTitle = (role: string) => {
        switch (role) {
            case "admin": return "Admin";
            case "supervisor": return "Supervisor";
            case "student": return "Student";
            case "liaison": return "Liaison Officer";
            default: return "User";
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
            const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
            setNotifications(updated);
            setUnreadCount(updated.filter(n => !n.read).length);
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const clearAll = async () => {
        try {
            await apiFetch(`/notifications/clear`, { method: "DELETE" });
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };


    return (
        <header className="fixed top-0 right-0 z-30 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-neutral/10 bg-white/80 px-6 backdrop-blur-sm">
            <div className="w-96">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-10 w-full rounded-full border border-neutral/20 bg-neutral/5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative rounded-full p-2 text-neutral hover:bg-neutral/10 transition-colors cursor-pointer"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-0.5 z-10 min-w-[18px] h-[18px] px-1 rounded-full bg-error flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-80 z-50 bg-white rounded-2xl shadow-2xl border border-neutral/10 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-neutral/5 flex items-center justify-between bg-neutral/5">
                                        <h3 className="font-bold text-sm text-primary">Notifications</h3>
                                        <Link 
                                            href="/notifications" 
                                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View All
                                        </Link>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Bell className="h-8 w-8 text-neutral/20 mx-auto mb-2" />
                                                <p className="text-xs text-neutral">No new notifications</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-neutral/5">
                                                {notifications.map((notif) => (
                                                    <div 
                                                        key={notif.id} 
                                                        className={cn(
                                                            "p-4 hover:bg-neutral/5 transition-colors cursor-default",
                                                            !notif.read && "bg-primary/2"
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                            <h4 className={cn("text-xs font-bold text-primary", !notif.read && "text-primary")}>{notif.title}</h4>
                                                            {!notif.read && <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />}
                                                        </div>
                                                        <p className="text-[11px] text-neutral line-clamp-2 mb-2">{notif.message}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] text-neutral/60">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                            {!notif.read && (
                                                                <button 
                                                                    onClick={() => markAsRead(notif.id)}
                                                                    className="text-[9px] font-bold text-primary hover:underline"
                                                                >
                                                                    Mark read
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div className="p-3 border-t border-neutral/5 bg-neutral/5">
                                            <button 
                                                onClick={() => clearAll()}
                                                className="w-full text-[10px] font-bold text-neutral hover:text-red-500 transition-colors uppercase tracking-wider"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 border-l border-neutral/20 pl-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-neutral-dark">
                            {user?.name ? user.name.split(" ")[0] : getRoleTitle(role)}
                        </p>
                        <p className="text-xs text-neutral">{getRoleTitle(role)}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
