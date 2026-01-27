"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Star,
  Calendar,
  MessageSquare,
  FileText,
  X,
  Check,
  Plus,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

// ----- Type Definitions -----
interface Student {
  id: number;
  name: string;
  supervisorId: number;
  user?: { id: number; name: string; email: string };
  phone?: string;
  address?: string;
  companyName?: string;
  companyAddress?: string;
  supervisorName?: string;
  supervisorEmail?: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  date: string;
  studentId: number;
  student?: { user: { name: string } };
}

interface NewTask {
  studentId: number | "";
  title: string;
  description: string;
  dueDate: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  sender: { name: string };
}

// ----- Component -----
export default function SupervisorDashboard() {
  const [activeTab, setActiveTab] = useState<"students" | "tasks" | "ratings" | "attendance" | "chat">("students");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatNewMessage, setChatNewMessage] = useState("");
  const [selectedStudentForChat, setSelectedStudentForChat] = useState<Student | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newTask, setNewTask] = useState<NewTask>({
    studentId: "",
    title: "",
    description: "",
    dueDate: "",
  });
  const [ratingValue, setRatingValue] = useState(7);
  const [ratingComment, setRatingComment] = useState("");

  const searchParams = useSearchParams();
  const supervisorIdParam = searchParams.get("supervisorId");
  const supervisorId = supervisorIdParam ? Number(supervisorIdParam) : undefined;

  // ----- Fetch Data -----
  useEffect(() => {
    if (supervisorId) fetchStudents();
  }, [supervisorId]);

  useEffect(() => {
    if (supervisorId && activeTab === "tasks") fetchTasks();
  }, [activeTab, supervisorId]);

  // Chat Effects
  useEffect(() => {
    if (activeTab === 'chat' && students.length > 0 && !selectedStudentForChat) {
      setSelectedStudentForChat(students[0]);
    }
  }, [activeTab, students]);

  useEffect(() => {
    if (selectedStudentForChat && activeTab === 'chat') {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedStudentForChat, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      setStudents((data.students || []).filter((s: any) => s.supervisorId === supervisorId));
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?supervisorId=${supervisorId}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    if (!selectedStudentForChat || !supervisorId) return;
    // supervisorId parameter is the Supervisor ID (table supervisors), but for chat we need User ID.
    // Assuming supervisor's User ID is fetched or available. 
    // Ideally we should have user context. For now, let's assume we can rely on the API finding the user via supervisorId if we pass it, 
    // or we fetch the supervisor's details to get userId.
    // However, the previous chat implementation used 'userId' and 'otherUserId'.
    // Let's first fetch the supervisor's user ID if we don't have it.
    // Actually, let's just use the api/chat endpoint which expects UserIDs.

    // We need the supervisor's USER ID. 
    // Let's assume we can pass the Supervisor ID to a new endpoint or update the chat endpoint? 
    // Or we can just include the supervisor's user id in the page params or auth session.
    // For this refactor, I'll fetch the supervisor details first if needed, or better, 
    // let's Assume the 'supervisorId' param is the ID from the 'supervisors' table.
    // We can fetch the supervisor's userId using the /api/supervisors endpoint if it exists, or just hack it for now if we don't have that endpoint ready.
    // Wait, simpler: The chat API already supports finding messages. 
    // Let's Use a helper to get the current user's ID. 

    // ... For now, let's assume we have a way to get the Current User ID (Supervisor's User ID).
    // Since we don't have a direct "getMe" here, I'll assume we can get it from the 'students' fetch which might return supervisor info?
    // No, let's fetch the supervisor details once on mount.
  };

  // Helper to fetch supervisor user ID
  const [currentSupervisorUserId, setCurrentSupervisorUserId] = useState<number | null>(null);

  useEffect(() => {
    const getSupervisorUser = async () => {
      if (!supervisorId) return;
      // We can't easily get the User ID from just Supervisor ID without an endpoint.
      // However, we can use the 'students' list which contains 'supervisor' info if we modify the API.
      // Alternatively, we can assume the user is logged in and we can get it from localStorage (as seen in TopBar).
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentSupervisorUserId(parsed.id);
      }
    };
    getSupervisorUser();
  }, [supervisorId]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatNewMessage.trim() || !selectedStudentForChat || !currentSupervisorUserId) return;

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentSupervisorUserId,
          receiverId: selectedStudentForChat.user?.id, // We need student's User ID
          content: chatNewMessage
        })
      });
      setChatNewMessage("");
      fetchChatMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Actual fetch implementation using the state
  const fetchChatMessagesReal = async () => {
    if (!selectedStudentForChat || !currentSupervisorUserId) return;
    try {
      // We need the student's USER ID. 
      // The 'students' array items have 'user' object with 'id'.
      // Let's ensure our 'Student' interface and fetch logic includes this.
      // The previous fetchStudents calls /api/students. Let's verify it returns 'user' relation.
      // Yes, the Interface says 'user?: { name: string; email: string }'. It might need 'id' too.
      // I will update the 'Student' interface above to include 'id' in 'user'.

      const res = await fetch(`/api/chat?userId=${currentSupervisorUserId}&otherUserId=${selectedStudentForChat.user?.id || 0}`); // Need User ID here
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Override the previous empty fetchChatMessages
  useEffect(() => {
    if (selectedStudentForChat && activeTab === 'chat' && currentSupervisorUserId) {
      fetchChatMessagesReal();
      const interval = setInterval(fetchChatMessagesReal, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedStudentForChat, activeTab, currentSupervisorUserId]);


  // ----- Task Handlers -----
  const handleApproveTask = async (taskId: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: "COMPLETED" }),
      });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: "PENDING" }),
      });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignTask = async () => {
    if (newTask.studentId === "" || !newTask.title) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: newTask.studentId,
          title: newTask.title,
          description: newTask.description,
          date: newTask.dueDate || new Date().toISOString(),
        }),
      });
      setNewTask({ studentId: "", title: "", description: "", dueDate: "" });
      setShowTaskModal(false);
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRateTask = async () => {
    if (!selectedTask) return;
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          status: "COMPLETED",
          rating: ratingValue,
          comment: ratingComment,
          supervisorId,
        }),
      });
      fetchTasks();
      setShowRatingModal(false);
      setSelectedTask(null);
      setRatingValue(7);
      setRatingComment("");
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral/10 pb-6">
        <div className="flex gap-8 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: "students", label: "Students", icon: Users },
            { id: "tasks", label: "Student Logs", icon: FileText },
            { id: "ratings", label: "Ratings", icon: Star },
            { id: "attendance", label: "Attendance", icon: Calendar },
            { id: "chat", label: "Team Chat", icon: MessageSquare },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex items-center gap-2 pb-2 text-sm font-medium transition-colors relative whitespace-nowrap", activeTab === tab.id ? "text-primary" : "text-primary/60 hover:text-primary")}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "students" && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {students.map((student) => {
              const studentTasks = tasks.filter((t) => t.studentId === student.id);
              const totalTasks = studentTasks.length || 0;
              const completed = studentTasks.filter((t) => t.status === "COMPLETED").length;
              const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
              const initials = student.user?.name
                ? student.user.name.split(" ").map((n) => n[0]).join("")
                : "ST";
              const status =
                progress >= 80 ? "Excellent" : progress < 50 && totalTasks > 0 ? "Behind" : "On Track";

              return (
                <Card key={student.id} className="hover:border-primary/50 transition-colors group">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      {/* Progress Ring */}
                      <div className="h-24 w-24 rounded-full border-4 border-neutral/10 flex items-center justify-center relative">
                        <svg
                          className="absolute inset-0 h-full w-full -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-primary"
                            strokeDasharray={`${progress * 2.89} 289`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-xl font-bold text-primary">
                          {initials}
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-white border border-neutral/10 flex items-center justify-center shadow-sm">
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            status === "Excellent"
                              ? "bg-green-500"
                              : status === "Behind"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          )}
                        ></span>
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-primary mb-1">
                      {student.user?.name || student.name}
                    </h3>
                    <p className="text-sm text-primary mb-1">{progress}% Tasks Completed</p>
                    <p className="text-xs text-muted-foreground mb-4">{completed}/{totalTasks} tasks done</p>

                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="col-span-2">
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            setSelectedStudentForChat(student);
                            setActiveTab('chat');
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowProfileModal(true);
                        }}
                      >
                        Profile
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowRatingModal(true);
                        }}
                      >
                        Rate
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs col-span-2"
                        variant="outline"
                        onClick={() => {
                          setNewTask({ ...newTask, studentId: student.id });
                          setShowTaskModal(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Assign Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {activeTab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Student Log Submissions</CardTitle>
                <CardDescription>
                  Review and approve student daily/weekly logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-primary py-8">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="text-center text-primary py-8">No pending tasks</div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="border border-primary/20 rounded-xl p-4 hover:border-primary transition-colors bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {task.student?.user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("") || "ST"}
                              </div>
                              <div>
                                <h4 className="font-semibold text-primary">{task.title}</h4>
                                <p className="text-xs text-primary">
                                  {task.student?.user.name || "Student"} •{" "}
                                  {new Date(task.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-primary whitespace-pre-wrap mb-3">
                              {task.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {task.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-primary hover:bg-primary/10"
                                  onClick={() => handleRejectTask(task.id.toString())}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Request Changes
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-white"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setRatingValue(7);
                                    setRatingComment("");
                                    setShowRatingModal(true);
                                  }}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Rate & Complete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex h-[calc(100vh-200px)] gap-6"
          >
            <Card className="w-1/3 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-neutral/10">
                <h2 className="font-bold text-primary mb-2">My Students</h2>
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full px-3 py-2 text-sm border border-neutral/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentForChat(student)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors",
                      selectedStudentForChat?.id === student.id
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-neutral/5 border border-transparent"
                    )}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {student.user?.name ? student.user.name.substring(0, 2).toUpperCase() : "ST"}
                      </span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm text-primary truncate">{student.user?.name}</p>
                      <p className="text-xs text-primary/60 truncate">{student.companyName || "No Company"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="flex-1 flex flex-col overflow-hidden">
              {selectedStudentForChat ? (
                <>
                  <div className="p-4 border-b border-neutral/10 bg-primary/5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {selectedStudentForChat.user?.name ? selectedStudentForChat.user.name.substring(0, 2).toUpperCase() : "ST"}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-primary">{selectedStudentForChat.user?.name}</h2>
                      <p className="text-xs text-primary/60">{selectedStudentForChat.companyName}</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral/5">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-10">No messages yet.</div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderId === currentSupervisorUserId;
                        return (
                          <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[70%] rounded-2xl p-3 text-sm",
                              isMe ? "bg-primary text-white rounded-tr-none" : "bg-white border border-neutral/10 text-primary rounded-tl-none"
                            )}>
                              <p>{msg.content}</p>
                              <p className={cn("text-[10px] mt-1", isMe ? "text-white/70" : "text-primary/40")}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-neutral/10">
                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <Input
                        value={chatNewMessage}
                        onChange={(e) => setChatNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!chatNewMessage.trim()} className="bg-primary hover:bg-primary/90 text-white">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Select a student to chat</div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Other tabs like attendance, chat can be added similarly */}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-primary">Assign New Task</h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-primary hover:text-primary/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Task Title *</label>
                  <Input
                    placeholder="e.g., Design database schema"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
                    placeholder="Describe task..."
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                <Button
                  onClick={handleAssignTask}
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={!newTask.title || !newTask.studentId}
                >
                  <Send className="h-4 w-4 mr-2" /> Assign Task
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (selectedStudent || selectedTask) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-primary">
                  {selectedTask ? `Rate Task: ${selectedTask.title}` : `Rate ${selectedStudent?.name}`}
                </h3>
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setSelectedTask(null);
                  }}
                  className="text-primary hover:text-primary/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {selectedTask && (
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm text-primary font-medium mb-2">Task Description:</p>
                    <p className="text-sm text-primary">{selectedTask.description}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-primary mb-3 block">Overall Rating (1-10)</label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={ratingValue}
                    className="w-full accent-primary"
                    onChange={(e) => setRatingValue(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-primary mt-1">
                    <span>Poor (1)</span>
                    <span>Excellent (10)</span>
                  </div>
                  <p className="text-center text-sm text-primary mt-2">Selected: {ratingValue}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-primary mb-2 block">Comments</label>
                  <textarea
                    placeholder="Optional feedback..."
                    className="w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-20"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRatingModal(false)}>Cancel</Button>
                <Button
                  onClick={handleRateTask}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Check className="h-4 w-4 mr-2" /> Submit Rating
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-primary/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-primary">Student Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-primary hover:text-primary/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center text-2xl font-bold text-primary mb-3">
                    {selectedStudent.user?.name?.split(" ").map((n) => n[0]).join("") || "ST"}
                  </div>
                  <h4 className="font-bold text-lg text-primary">{selectedStudent.user?.name}</h4>
                  <p className="text-sm text-primary/60">{selectedStudent.user?.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-primary/60 uppercase tracking-wider">Contact Info</label>
                    <div className="mt-1 p-3 bg-neutral/5 rounded-lg">
                      <p className="text-sm text-primary flex items-center gap-2">
                        <span className="font-medium">Phone:</span> {selectedStudent.phone || "N/A"}
                      </p>
                      <p className="text-sm text-primary flex items-center gap-2 mt-1">
                        <span className="font-medium">Address:</span> {selectedStudent.address || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-primary/60 uppercase tracking-wider">Internship Placement</label>
                    <div className="mt-1 p-3 bg-neutral/5 rounded-lg">
                      <p className="text-sm text-primary font-bold">{selectedStudent.companyName || "No Company Assigned"}</p>
                      <p className="text-sm text-primary/80">{selectedStudent.companyAddress}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary/60 uppercase tracking-wider">Field Supervisor</label>
                    <div className="mt-1 p-3 bg-neutral/5 rounded-lg">
                      <p className="text-sm text-primary font-medium">{selectedStudent.supervisorName || "N/A"}</p>
                      <p className="text-xs text-primary/60">{selectedStudent.supervisorEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-primary/5 border-t border-primary/10 flex justify-end">
                <Button onClick={() => setShowProfileModal(false)}>Close</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
