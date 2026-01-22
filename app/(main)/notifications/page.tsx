"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, Clock, Loader2, MessageSquare, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    link?: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            fetchNotifications(parsed.id);
        }
    }, []);

    const fetchNotifications = async (userId: number) => {
        try {
            const res = await fetch(`/api/notifications?userId=${userId}`);
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id?: number) => {
        if (!user) return;
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, userId: user.id, read: true }),
            });
            if (id) {
                setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
            } else {
                setNotifications(notifications.map(n => ({ ...n, read: true })));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const deleteNotification = async (id?: number) => {
        if (!user) return;
        try {
            const url = id ? `/api/notifications?id=${id}` : `/api/notifications?userId=${user.id}`;
            await fetch(url, { method: "DELETE" });
            if (id) {
                setNotifications(notifications.filter(n => n.id !== id));
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error("Error deleting notifications:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SUCCESS": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "ERROR": return <AlertCircle className="h-5 w-5 text-red-500" />;
            case "WARNING": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case "TASK": return <FileText className="h-5 w-5 text-blue-500" />;
            case "MESSAGE": return <MessageSquare className="h-5 w-5 text-purple-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Notifications</h1>
                    <p className="text-primary/60">Stay updated with your latest alerts and tasks</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => markAsRead()} disabled={!notifications.some(n => !n.read)}>
                        Mark all as read
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification()} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-primary/60">Loading your notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 text-primary/30" />
                            </div>
                            <h3 className="text-lg font-semibold text-primary">No notifications yet</h3>
                            <p className="text-sm text-primary/60 max-w-xs mx-auto">
                                When you receive alerts about your tasks or messages, they will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral/10">
                            <AnimatePresence initial={false}>
                                {notifications.map((notif) => (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className={cn(
                                            "flex items-start gap-4 p-6 transition-colors hover:bg-neutral/5",
                                            !notif.read && "bg-primary/5 border-l-4 border-primary"
                                        )}
                                    >
                                        <div className="mt-1">{getIcon(notif.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <h4 className={cn("font-semibold text-primary truncate", !notif.read && "font-bold")}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-xs text-primary/40 flex items-center gap-1 shrink-0">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-primary/70 mb-3">{notif.message}</p>
                                            <div className="flex items-center gap-4">
                                                {!notif.read && (
                                                    <button
                                                        onClick={() => markAsRead(notif.id)}
                                                        className="text-xs font-semibold text-primary hover:underline"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notif.id)}
                                                    className="text-xs font-semibold text-red-500 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
