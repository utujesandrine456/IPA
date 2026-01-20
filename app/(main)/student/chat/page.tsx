"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, User } from "lucide-react";

interface Message {
    id: number;
    content: string;
    senderId: number;
    createdAt: string;
    sender: { name: string };
}

export default function StudentChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock IDs. In a real app, these come from auth context / database.
    const currentUserId = 2; // Assume this is the Student User ID
    const supervisorUserId = 1; // Assume this is the Supervisor User ID

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chat?userId=${currentUserId}&otherUserId=${supervisorUserId}`);
            const data = await res.json();
            setMessages(data.messages || []);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: currentUserId,
                    receiverId: supervisorUserId,
                    content: newMessage
                })
            });
            setNewMessage("");
            fetchMessages();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-neutral/10 overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral/10 bg-primary/5 flex items-center gap-3">
                <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                </div>
                <div>
                    <h2 className="font-semibold text-primary">My Supervisor</h2>
                    <p className="text-xs text-primary/60">Online</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral/5">
                {loading ? (
                    <div className="text-center text-muted-foreground text-sm">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-10">No messages yet. Say hello!</div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl p-3 text-sm ${isMe
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-white border border-neutral/10 text-primary rounded-tl-none'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-primary/40'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-neutral/10">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim()} className="bg-primary hover:bg-primary/90 text-white">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
