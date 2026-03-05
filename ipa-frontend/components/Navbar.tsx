"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Shield } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/objectives", label: "Objectives" },
    { href: "/instructions", label: "Instructions" },
    { href: "/guidelines", label: "Guidelines" },
  ];

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`
          pointer-events-auto
          flex items-center justify-between gap-4 py-2 px-6 rounded-full
          transition-all duration-500 ease-in-out border
          ${isScrolled
            ? "w-[95%] max-w-4xl bg-white/80 backdrop-blur-xl border-primary/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            : "w-full max-w-6xl bg-white/40 backdrop-blur-md border-white/20 shadow-none"
          }
        `}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className={`
            flex items-center justify-center rounded-xl bg-primary text-white transition-all duration-500
            ${isScrolled ? "h-8 w-8" : "h-10 w-10 rotate-12 group-hover:rotate-0"}
          `}>
            <Shield className={isScrolled ? "h-4 w-4" : "h-6 w-6"} />
          </div>
          <div className="flex flex-col">
            <span className={`
              font-bold text-primary font-heading tracking-tight leading-none transition-all duration-300
              ${isScrolled ? "text-sm" : "text-lg"}
            `}>
              IPA System
            </span>
            {!isScrolled && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[8px] uppercase tracking-[0.2em] text-primary/60 font-bold"
              >
                Industrial Attachment
              </motion.span>
            )}
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-primary/5 rounded-full p-1 backdrop-blur-sm border border-primary/5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-4 py-2 text-[11px] font-bold transition-all duration-300 rounded-full uppercase tracking-wider
                  ${isActive ? "text-white" : "text-primary/70 hover:text-primary"}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-primary rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant={isScrolled ? "primary" : "outline"}
              className={`
                rounded-full px-5 font-black transition-all duration-300 border-2 uppercase tracking-tighter cursor-pointer
                ${!isScrolled && "border-primary text-primary hover:bg-primary hover:text-white bg-transparent shadow-lg shadow-primary/5"}
                ${isScrolled ? "h-8 text-[9px]" : "h-10 text-[10px]"}
              `}
            >
              Log In
            </Button>
          </Link>
        </div>
      </motion.nav>
    </div>
  );
}
