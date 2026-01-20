"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, HelpCircle, Mail, Phone, FileQuestion } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-primary mb-4">How can we help you?</h1>
                <div className="max-w-xl mx-auto relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral" />
                    <input
                        type="text"
                        placeholder="Search for answers..."
                        className="w-full h-12 pl-12 pr-4 rounded-full border border-neutral/20 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { q: "How do I reset my password?", a: "Go to the login page and click 'Forgot Password'. Follow the email instructions." },
                    { q: "Can I edit a submitted log?", a: "Logs can be edited within 24 hours of submission. After that, contact your supervisor." },
                    { q: "Where do I find my supervisor?", a: "Your supervisor details are listed on your dashboard under 'Company Info'." },
                    { q: "How is my grade calculated?", a: "Grades are a mix of weekly logs (40%), supervisor rating (30%), and final report (30%)." },
                    { q: "The app is not loading.", a: "Try clearing your browser cache or check your internet connection." },
                    { q: "I need to change my company.", a: "Contact the school ILO immediately to request a placement change." },
                ].map((faq, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-start gap-2">
                                <FileQuestion className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                                {faq.q}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-neutral">{faq.a}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 text-center mt-12 border border-primary/10">
                <h3 className="text-xl font-bold text-primary mb-2">Still need help?</h3>
                <p className="text-neutral mb-6">Our support team is available Mon-Fri, 8am - 5pm.</p>
                <div className="flex justify-center gap-4">
                    <Button>
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Support
                    </Button>
                    <Button variant="secondary">
                        <Phone className="h-4 w-4 mr-2" />
                        Call ILO Office
                    </Button>
                </div>
            </div>
        </div>
    );
}
