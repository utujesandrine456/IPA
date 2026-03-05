"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 select-none overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] opacity-50" />
            </div>

            <div className="max-w-2xl w-full text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="relative inline-block mb-12">
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                                y: [0, -5, 5, 0]
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="text-[12rem] font-black text-primary/5 leading-none select-none tracking-tighter"
                        >
                            404
                        </motion.div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-32 w-32 bg-white rounded-4xl shadow-2xl flex items-center justify-center border border-primary/5">
                                <Search className="h-12 w-12 text-primary/20 stroke-3" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-5xl font-black text-primary font-heading tracking-tight mb-6">
                        Node <span className="text-primary/30 italic">Not Found</span>
                    </h1>

                    <p className="text-xl text-primary/60 font-medium leading-relaxed mb-12 max-w-lg mx-auto">
                        The requested technical path does not exist in our registry. It may have been relocated or deprecated.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link href="/">
                            <Button size="lg" className="rounded-2xl h-16 px-10 text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                                <Home className="mr-3 h-5 w-5" /> Return to Base
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => window.history.back()}
                            className="rounded-2xl h-16 px-10 text-sm font-black uppercase tracking-widest border-2 border-primary/10 hover:bg-primary/5 transition-all"
                        >
                            <ArrowLeft className="mr-3 h-5 w-5" /> Previous Session
                        </Button>
                    </div>

                    <div className="mt-20 pt-10 border-t border-primary/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/20 italic">
                            RCA Industrial Attachment Program • Error Code: 0x404
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
