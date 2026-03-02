"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, User, Search, MessageSquare, ShieldCheck, GraduationCap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Contact {
    id: number; // User Id for chat
    name: string;
    role: "SUPERVISOR" | "STUDENT";
    studentNumber?: string;
}

interface Message {
    id: number;
    content: string;
    senderId: number;
    createdAt: string;
    sender: { name: string };
}

export default function StudentChatPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [studentProfileId, setStudentProfileId] = useState<number | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setCurrentUserId(parsed.id);
                setStudentProfileId(parsed.studentProfile?.id || null);
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    useEffect(() => {
        if (studentProfileId) {
            fetchContacts();
        }
    }, [studentProfileId]);

    useEffect(() => {
        if (selectedContact && currentUserId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedContact, currentUserId]);

    const fetchContacts = async () => {
        if (!studentProfileId) return;
        try {
            const data = await apiFetch(`/chat/peers?studentId=${studentProfileId}`);
            const list: Contact[] = [];

            // Add Supervisor if exists
            if (data.supervisor) {
                list.push({
                    id: data.supervisor.user.id,
                    name: data.supervisor.user.name,
                    role: "SUPERVISOR"
                });
            }

            // Add Peers
            if (data.peers) {
                data.peers.forEach((p: any) => {
                    list.push({
                        id: p.user.id,
                        name: p.user.name,
                        role: "STUDENT",
                        studentNumber: p.studentNumber
                    });
                });
            }

            setContacts(list);

            // Auto select supervisor if it's the only one or first one
            if (list.length > 0 && !selectedContact) {
                setSelectedContact(list[0]);
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!selectedContact || !currentUserId) return;
        try {
            const data = await apiFetch(`/chat?userId=${currentUserId}&otherUserId=${selectedContact.id}`);
            setMessages(data.messages || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact || !currentUserId) return;

        try {
            await apiFetch("/chat", {
                method: "POST",
                body: JSON.stringify({
                    senderId: currentUserId,
                    receiverId: selectedContact.id,
                    content: newMessage
                })
            });
            setNewMessage("");
            fetchMessages();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!studentProfileId) {
        return <div className="p-8 text-center text-muted-foreground font-medium">Please finalize your profile to access student chat.</div>;
    }

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* Contacts Sidebar */}
            <Card className="w-1/3 flex flex-col overflow-hidden border-neutral/10 bg-white">
                <div className="p-4 border-b border-neutral/10 bg-slate-50/50">
                    <h2 className="font-bold text-primary flex items-center gap-2 mb-3 px-1">
                        <MessageSquare className="h-4 w-4" />
                        My Contacts
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral/40" />
                        <input
                            type="text"
                            placeholder="Find peers or supervisor..."
                            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-slate-100 rounded-xl focus:outline-none focus:border-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? (
                        <div className="flex flex-col gap-2 p-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-xl" />)}
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-8 text-sm text-neutral/40 px-4">
                            You are not yet linked to any peers or supervisor.
                        </div>
                    ) : (
                        contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={cn(
                                    "w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all group",
                                    selectedContact?.id === contact.id
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "hover:bg-slate-50 text-slate-600"
                                )}
                            >
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-105",
                                    selectedContact?.id === contact.id ? "bg-white/20 border-white/20" : "bg-white border-slate-100 shadow-sm"
                                )}>
                                    {contact.role === "SUPERVISOR" ?
                                        <ShieldCheck className={cn("h-6 w-6", selectedContact?.id === contact.id ? "text-white" : "text-primary")} /> :
                                        <GraduationCap className={cn("h-6 w-6", selectedContact?.id === contact.id ? "text-white" : "text-primary")} />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate uppercase tracking-tight">{contact.name}</p>
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        selectedContact?.id === contact.id ? "text-white/60" : "text-slate-400"
                                    )}>
                                        {contact.role} {contact.studentNumber ? `• ${contact.studentNumber}` : ""}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </Card>

            {/* Chat Content */}
            <Card className="flex-1 flex flex-col overflow-hidden border-neutral/10 bg-white">
                {selectedContact ? (
                    <>
                        <div className="p-4 border-b border-neutral/10 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-primary shadow-sm">
                                    {selectedContact.role === "SUPERVISOR" ? <ShieldCheck className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-800 uppercase tracking-tight">{selectedContact.name}</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Discussion</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                                    <MessageSquare className="h-16 w-16 mb-4 text-slate-200" />
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Encrypted Channel Established</p>
                                    <p className="text-sm text-slate-500 mt-2 font-medium">Start the conversation with {selectedContact.name.split(' ')[0]}</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === currentUserId;
                                    return (
                                        <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                            <div className={cn(
                                                "max-w-[80%] rounded-2xl p-4 shadow-sm relative group",
                                                isMe
                                                    ? "bg-primary text-white rounded-tr-none shadow-primary/10"
                                                    : "bg-white border-2 border-slate-50 text-slate-700 rounded-tl-none font-medium"
                                            )}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <div className={cn(
                                                    "mt-2 text-[9px] font-black uppercase tracking-widest",
                                                    isMe ? "text-white/60" : "text-slate-300"
                                                )}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-6 bg-white border-t border-neutral/10">
                            <form onSubmit={handleSend} className="flex gap-3">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Execute clear communication..."
                                    className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-primary/20 transition-all text-sm font-bold text-slate-700"
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="h-14 w-14 p-0 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                >
                                    <Send className="h-6 w-6" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                            <MessageSquare className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Select Recipient</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-sm font-medium">Choose a peer or supervisor from the list to synchronize your progress and communication.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
