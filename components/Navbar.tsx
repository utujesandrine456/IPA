"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/objectives", label: "Objectives" },
    { href: "/instructions", label: "Instructions" },
    { href: "/guidelines", label: "Guidelines" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b-2 border-neutral/200 shadow-sm m-10 my-3 rounded-3xl"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl"
          >
            I
          </motion.div>
          <span className="text-xl font-bold text-primary font-heading tracking-tight">
            IPA System
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <motion.div key={item.href} whileHover={{ scale: 1.05 }}>
                <Link
                  href={item.href}
                  className={`
                    relative text-normal font-medium transition
                    ${isActive ? "text-primary" : "text-neutral-700"}
                    hover:text-primary
                  `}
                >
                  {item.label}

                  <span className="
                    absolute left-0 -bottom-1 h-[2px] w-0 bg-primary 
                    transition-all duration-300 group-hover:w-full
                  "></span>

                  {isActive && (
                    <span className="absolute left-0 -bottom-2 h-[4px] w-full bg-primary rounded-full"></span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/login">
              <Button className="rounded-xl px-6 cursor-pointer bg-primary hover:bg-primary/90 text-white">Login</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
