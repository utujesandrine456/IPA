import Link from "next/link";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-primary text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-xl">
                                I
                            </div>
                            <span className="text-xl font-bold font-heading tracking-tight text-white">
                                IPA System
                            </span>
                        </div>
                        <p className="text-white text-sm leading-relaxed">
                            Empowering the next generation of tech leaders through structured industrial attachment programs.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Twitter className="h-5 w-5 text-white" />
                            </Link>
                            <Link href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Linkedin className="h-5 w-5 text-white" />
                            </Link>
                            <Link href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Facebook className="h-5 w-5 text-white" />
                            </Link>
                            <Link href="#" className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Instagram className="h-5 w-5 text-white" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Quick Links</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/objectives" className="text-white hover:underline transition-colors text-sm">
                                    Program Objectives
                                </Link>
                            </li>
                            <li>
                                <Link href="/instructions" className="text-white hover:underline transition-colors text-sm">
                                    How it Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/guidelines" className="text-white hover:underline transition-colors text-sm">
                                    Student Guidelines
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/login" className="text-white hover:underline transition-colors text-sm">
                                    Portal Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Resources</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="#" className="text-white hover:underline transition-colors text-sm">
                                    Download Logbook
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-white hover:underline transition-colors text-sm">
                                    Evaluation Forms
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-white hover:underline transition-colors text-sm">
                                    Company List
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-white hover:underline transition-colors text-sm">
                                    Support Center
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6 text-white">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-white text-sm">
                                <MapPin className="h-5 w-5 text-white shrink-0" />
                                <span>Rwanda Coding Academy,<br />Nyabihu, Western Province</span>
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm">
                                <Mail className="h-5 w-5 text-white shrink-0" />
                                <span>info@rca.ac.rw</span>
                            </li>
                            <li className="flex items-center gap-3 text-white text-sm">
                                <Phone className="h-5 w-5 text-white shrink-0" />
                                <span>+250 788 123 456</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white text-sm">
                        © {new Date().getFullYear()} Rwanda Coding Academy. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <Link href="#" className="text-white hover:underline text-sm transition-colors">Privacy Policy</Link>
                        <Link href="#" className="text-white hover:underline text-sm transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
