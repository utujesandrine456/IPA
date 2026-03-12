"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, Settings as SettingsIcon, CreditCard } from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SecurityForm } from "@/components/settings/SecurityForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "profile", label: "Profile Information", icon: User, description: "Update your personal details and contact information" },
    { id: "security", label: "Security & Account", icon: Shield, description: "Manage your password and account security settings" },
    { id: "notifications", label: "Notifications", icon: Bell, description: "Configure how you receive alerts and updates" },
    { id: "preferences", label: "Preferences", icon: SettingsIcon, description: "Customize your application experience" },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary">Settings</h1>
                <p className="text-neutral mt-2">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive 
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-1" 
                                        : "hover:bg-primary/5 text-neutral hover:text-primary"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-neutral group-hover:text-primary")} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="border-none shadow-xl shadow-neutral/5 overflow-hidden bg-white/50 backdrop-blur-sm">
                                <CardHeader className="pb-6 border-b border-neutral/5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-primary/10">
                                            {(() => {
                                                const Icon = tabs.find(t => t.id === activeTab)?.icon || User;
                                                return <Icon className="h-6 w-6 text-primary" />;
                                            })()}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-primary">
                                                {tabs.find(t => t.id === activeTab)?.label}
                                            </CardTitle>
                                            <CardDescription>
                                                {tabs.find(t => t.id === activeTab)?.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    {activeTab === "profile" && <ProfileForm />}
                                    {activeTab === "security" && <SecurityForm />}
                                    
                                    {activeTab === "notifications" && (
                                        <div className="py-12 text-center text-neutral space-y-4">
                                            <div className="bg-neutral/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Bell className="h-8 w-8 text-neutral/40" />
                                            </div>
                                            <p className="font-medium">Notification settings are coming soon!</p>
                                            <p className="text-sm">We're working on giving you more control over your alerts.</p>
                                        </div>
                                    )}

                                    {activeTab === "preferences" && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral/5 bg-neutral/5">
                                                <div>
                                                    <p className="font-semibold text-primary">Dark Mode</p>
                                                    <p className="text-xs text-neutral">Switch between light and dark themes</p>
                                                </div>
                                                <div className="h-6 w-12 bg-neutral/20 rounded-full relative cursor-not-allowed opacity-50">
                                                    <div className="h-4 w-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral/5 bg-neutral/5">
                                                <div>
                                                    <p className="font-semibold text-primary">Language</p>
                                                    <p className="text-xs text-neutral">Select your preferred language</p>
                                                </div>
                                                <select disabled className="bg-white border text-sm rounded-lg p-1 px-3 opacity-50 cursor-not-allowed">
                                                    <option>English (US)</option>
                                                    <option>French</option>
                                                    <option>Kinyarwanda</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
