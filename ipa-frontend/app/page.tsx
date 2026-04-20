"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Star, Globe, Laptop, Users, Sparkles, Zap, Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <div className="min-h-screen bg-white text-primary selection:bg-primary/10 overflow-x-hidden">
      <Navbar />

      <main>
        <section ref={containerRef} className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none bg-[#1A264A] overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.4]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.6]"
              style={{
                backgroundImage: `radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1.5px, transparent 1.5px)`,
                backgroundSize: '40px 40px'
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.4]"
              style={{
                backgroundImage: `radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}
            />

            {/* Soft decorative elements for color volume */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="relative z-10"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-6xl lg:text-8xl font-bold text-white font-heading leading-[0.95] mb-8 tracking-tight"
              >
                Build your <br />
                <span className="text-white/80">
                  Future Today.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-200 mb-10 leading-relaxed max-w-xl font-medium"
              >
                We bridge the gap between academic theory and industry practice through a structured,
                high-impact Industrial Attachment Program.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-5">
                <Link href="/instructions">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="h-16 px-6 text-lg rounded-lg cursor-pointer shadow-xl shadow-primary/10 bg-white text-primary hover:bg-white/95 border border-primary transition-all">
                      Apply Now
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/objectives">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="lg" className="h-16 px-6 text-lg cursor-pointer rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-all text-white hover:text-primary font-semibold">
                      View Objectives
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-12 flex items-center gap-4 text-white/0"
              >
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium">Join 2,000+ students already enrolled</p>
              </motion.div>8
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative z-10 grid grid-cols-2 gap-6">
                {[
                  { icon: Globe, title: "Global Reach", color: "bg-primary/5", text: "Work with international tech giants." },
                  { icon: Laptop, title: "Modern Tech", color: "bg-primary/5", text: "Master the latest industry tech stacks." },
                  { icon: Users, title: "Mentorship", color: "bg-primary/5", text: "1-on-1 guidance from senior leads." },
                  { icon: Trophy, title: "Excellence", color: "bg-primary/5", text: "Graduate with a competitive edge." },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{
                      y: -10,
                      transition: { duration: 0.3, ease: "easeOut" },
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                    }}
                    className="p-8 rounded-2xl bg-white shadow-xl shadow-primary/20 border border-primary/5 flex flex-col items-start gap-4 cursor-pointer group"
                  >
                    <div className={`h-14 w-14 rounded-2xl ${card.color} flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300`}>
                      <card.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">{card.title}</h3>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">{card.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold text-primary font-heading mt-4"
              >
                Your journey to <br />
                <span className="text-primary/60 italic">professional mastery</span>
              </motion.h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 z-0" />

              {[
                { step: "01", title: "Apply", desc: "Submit your application through our secure student portal." },
                { step: "02", title: "Match", desc: "Our algorithm matches you with the perfect industry partner." },
                { step: "03", title: "Train", desc: "Engage in hands-on work with direct professional mentorship." },
                { step: "04", title: "Excel", desc: "Complete your IAP and jumpstart your career with RCA." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  className="bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-xl shadow-primary/5 relative z-10 group hover:border-primary/20 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-5xl font-bold text-primary/10 mb-6 group-hover:text-primary/30 transition-colors italic">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-32 relative overflow-hidden bg-[#FAFBFF]">
          <div className="absolute inset-0 pointer-events-none">
            {/* Elegant Cross-Hatch combined with spaced dots */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A264A08_1px,transparent_1px),linear-gradient(to_bottom,#1A264A08_1px,transparent_1px)] bg-size-[40px_40px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1A264A20_2px,transparent_2px)] bg-size-[40px_40px]" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-xl">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-primary font-medium text-md"
                >
                  Success Stories
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold text-primary font-heading mt-4"
                >
                  What our students <br />
                  <span className="text-gray-400 italic">are saying</span>
                </motion.h2>
              </div>
              <div className="hidden md:block">
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 cursor-not-allowed">
                    <ArrowRight className="h-5 w-5 rotate-180" />
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer hover:bg-primary/90 transition-colors">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Sandrine U.", role: "Software Engineer Intern", text: "The IAP system streamlined my entire attachment process. The logbook generation tool saved me hours of administrative work.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&q=80&fit=crop" },
                { name: "Jean Paul N.", role: "Civil Engineering Student", text: "Matching with a top-tier construction firm was seamless. The structured objectives kept me focused on my learning goals.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&q=80&fit=crop" },
                { name: "Divine K.", role: "UI/UX Design Intern", text: "Professional, modern, and efficient. This portal is a testament to the high standards of RCA's industrial attachment program.", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&q=80&fit=crop" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -12, transition: { duration: 0.4, ease: "easeOut" } }}
                  className="bg-white cursor-pointer p-10 rounded-[3rem] border border-primary/5 hover:border-primary/20 shadow-lg shadow-primary/5 transition-all duration-500 group"
                >
                  <div className="flex gap-1 mb-6 text-yellow-500">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-lg font-medium text-gray-700 leading-relaxed mb-8">
                    "{item.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-100 shadow-md">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${item.name}&background=1A264A&color=fff`;
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-primary">{item.name}</div>
                      <div className="text-sm text-primary/70 font-medium">{item.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Stats Section */}
        <section className="py-24 bg-primary text-white relative overflow-hidden border-y border-white/10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-size-[60px_60px]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_84px,#ffffff0A_84px,#ffffff0A_85px)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_84px,#ffffff0A_84px,#ffffff0A_85px)]" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { number: "950+", label: "Success Placements", icon: Zap },
                { number: "120+", label: "Corporate Partners", icon: Globe },
                { number: "15+", label: "Industry Awards", icon: Trophy },
                { number: "100%", label: "Completion Rate", icon: BarChart3 },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="cursor-pointer"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 mb-6">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-5xl font-bold mb-2 tracking-tight">{stat.number}</div>
                  <div className="text-white/80 font-semibold tracking-wide text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid - Interactive Cards */}
        <section className="py-32 bg-white relative overflow-hidden border-y border-primary/5">
          <div className="absolute inset-0 pointer-events-none">
            {/* Wide Grid with prominent Dots */}
            <div className="absolute inset-0 bg-[radial-gradient(#1A264A15_3px,transparent_3px)] bg-size-[50px_50px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A264A05_1px,transparent_1px)] bg-size-[50px_100%]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1A264A05_1px,transparent_1px)] bg-size-[100%_50px]" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-primary font-medium text-md mb-4"
                >
                  The IAP Advantage
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl font-bold text-primary font-heading leading-tight"
                >
                  Why settle for a <br />
                  <span className="text-gray-400 italic">standard internship?</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-lg text-gray-600 max-w-sm font-medium pb-2"
              >
                Our program is engineered to provide the specific skills needed by today's leading tech companies.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  title: "Agile Learning",
                  desc: "Learn through doing. Our curriculum is built around real-world tickets and deployment cycles.",
                  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
                  tag: "High Impact"
                },
                {
                  title: "Elite Network",
                  desc: "Gain lifelong access to an exclusive community of developers, designers, and tech leaders.",
                  image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
                  tag: "Community"
                },
                {
                  title: "Rapid Growth",
                  desc: "Compress years of learning into months with our accelerated hands-on mentorship program.",
                  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
                  tag: "Career"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover="hovered"
                  className="group relative h-[520px] overflow-hidden rounded-3xl cursor-pointer bg-primary shadow-2xl shadow-primary/20"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Background Image with Framer Motion scale */}
                  <motion.div
                    className="absolute inset-0 w-full h-full"
                    variants={{
                      hovered: { scale: 1.08, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
                    }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/40 transition-colors z-10" />
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>


                  {/* Top Tag */}
                  <motion.div
                    className="absolute top-7 left-7 z-20"
                    variants={{
                      hovered: { y: -2, transition: { duration: 0.4 } },
                    }}
                  >
                    <span className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold tracking-wide">
                      {feature.tag}
                    </span>
                  </motion.div>

                  {/* Bottom Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-9 z-20">
                    {/* Title always visible */}
                    <motion.h3
                      className="text-[2rem] font-bold text-white leading-tight"
                      variants={{
                        hovered: { y: -8, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                      }}
                    >
                      {feature.title}
                    </motion.h3>

                    {/* Description — slides up and fades in on hover */}
                    <motion.p
                      className="text-white/90 text-base leading-relaxed font-medium mt-3"
                      initial={{ opacity: 0, y: 16 }}
                      variants={{
                        hovered: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] } },
                      }}
                    >
                      {feature.desc}
                    </motion.p>

                    {/* "Learn More" link — appears on hover */}
                    <motion.div
                      className="mt-5 flex items-center gap-2 text-white/80 text-sm font-semibold"
                      initial={{ opacity: 0, y: 10 }}
                      variants={{
                        hovered: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.1 } },
                      }}
                    >
                      <span className="h-px w-6 bg-white/60 inline-block" />
                      Explore
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Modern CTA Section */}
        <section className="py-20 relative bg-white border-t border-primary/5 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(45deg,#1A264A03_0px,#1A264A03_1px,transparent_1px,transparent_20px),repeating-linear-gradient(-45deg,#1A264A03_0px,#1A264A03_1px,transparent_1px,transparent_20px)]" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-primary rounded-4xl px-8 py-20 md:p-32 text-center relative overflow-hidden shadow-2xl shadow-primary/20"
            >
              <div className="relative z-10 max-w-3xl mx-auto">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-5xl md:text-6xl font-bold text-white font-heading mb-10 tracking-tight"
                >
                  Ready to level up <br /> your career?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-xl text-white/80 mb-12 font-medium"
                >
                  Don't wait for opportunities. Create them by joining the Industrial Attachment Program today.
                </motion.p>
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="md" className="bg-white text-primary hover:bg-white/95 h-14 px-8 rounded-md font-medium shadow-2xl cursor-pointer text-md transition-all">
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
