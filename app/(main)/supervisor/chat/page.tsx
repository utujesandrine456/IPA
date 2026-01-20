"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, User, Search, MessageSquare } from "lucide-react";

interface Student {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    studentId: string;
}

interface Message {
    id: number;
    content: string;
    senderId: number;
    createdAt: string;
    sender: { name: string };
}

export default function SupervisorChatPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock Supervisor ID. In a real app, get from auth context.
    const currentSupervisorId = 1;
    const currentSupervisorUserId = 1; // Used for message senderId

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedStudent]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch(`/api/students?supervisorId=${currentSupervisorId}`);
            const data = await res.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!selectedStudent) return;
        try {
            const res = await fetch(`/api/chat?userId=${currentSupervisorUserId}&otherUserId=${selectedStudent.user.id}`);
            const data = await res.json();
            setMessages(data.messages || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedStudent) return;

        try {
            await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: currentSupervisorUserId,
                    receiverId: selectedStudent.user.id,
                    content: newMessage
                })
            });
            setNewMessage("");
            fetchMessages();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* Sidebar - Student List */}
            <Card className="w-1/3 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-neutral/10">
                    <h2 className="font-bold text-primary mb-2">My Students</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral/50" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <p className="text-center py-4 text-sm text-muted-foreground">Loading students...</p>
                    ) : students.length === 0 ? (
                        <p className="text-center py-4 text-sm text-muted-foreground">No students assigned.</p>
                    ) : (
                        students.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedStudent?.id === student.id
                                        ? "bg-primary/10 border-primary/20"
                                        : "hover:bg-neutral/5 border border-transparent"
                                    }`}
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm text-primary truncate">{student.user.name}</p>
                                    <p className="text-xs text-primary/60 truncate">{student.studentId}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </Card>

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden">
                {selectedStudent ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-neutral/10 bg-primary/5 flex items-center gap-3">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                            </div>
                            <div>
                                <h2 className="font-semibold text-primary">{selectedStudent.user.name}</h2>
                                <p className="text-xs text-primary/60">{selectedStudent.studentId}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral/5">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                                    <p>No messages yet.</p>
                                    <p className="text-sm">Start the conversation with {selectedStudent.user.name}!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.senderId === currentSupervisorUserId;
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
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">Select a Student</h3>
                        <p className="max-w-xs">Choose a student from the sidebar to view your conversation.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
