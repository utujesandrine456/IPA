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
    <div className="min-h-screen bg-[#F8F9FA] text-primary selection:bg-primary/10 overflow-x-hidden">
      <Navbar />

      <main>
        <section ref={containerRef} className="relative min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <motion.div
              style={{ y: y1, rotate }}
              className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
            />
            <motion.div
              style={{ y: y2 }}
              className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]"
            />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="relative z-10"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-6xl lg:text-8xl font-black text-primary font-heading leading-[0.95] mb-8 tracking-tighter"
              >
                Build your <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-primary/80 to-primary/60">
                  Future Today.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-primary/70 mb-10 leading-relaxed max-w-xl font-medium"
              >
                We bridge the gap between academic theory and industry practice through a structured,
                high-impact Industrial Attachment Program.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-5">
                <Link href="/instructions">
                  <Button size="lg" className="h-16 px-10 text-lg rounded-2xl cursor-pointer shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
                    Start Your Application
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
                <Link href="/objectives">
                  <Button variant="outline" size="lg" className="h-16 px-10 text-lg cursor-pointer rounded-2xl border-2 border-primary/10 hover:bg-primary/5 transition-all text-primary font-bold">
                    View Programs
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-12 flex items-center gap-4 text-primary/50"
              >
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-semibold">Join 2,000+ students already enrolled</p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative z-10 grid grid-cols-2 gap-6">
                {[
                  { icon: Globe, title: "Global Reach", color: "bg-blue-500", text: "Work with international tech giants." },
                  { icon: Laptop, title: "Modern Tech", color: "bg-purple-500", text: "Master the latest industry tech stacks." },
                  { icon: Users, title: "Mentorship", color: "bg-orange-500", text: "1-on-1 guidance from senior leads." },
                  { icon: Trophy, title: "Excellence", color: "bg-green-500", text: "Graduate with a competitive edge." },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -10 }}
                    className="p-8 rounded-[2.5rem] bg-white shadow-2xl shadow-primary/5 border border-primary/5 flex flex-col items-start gap-4"
                  >
                    <div className={`h-14 w-14 rounded-2xl ${card.color}/10 flex items-center justify-center text-primary`}>
                      <card.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                      <p className="text-sm text-primary/60 font-medium leading-relaxed">{card.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Decorative Card */}
              <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 scale-110 translate-y-10" />
            </motion.div>
          </div>
        </section>

        {/* Partner Logos Marquee */}
        <section className="py-12 bg-white/50 border-y border-primary/5">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-primary/30 mb-8">
              Trusted by industry leaders
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
              {['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Tesla'].map((brand) => (
                <div key={brand} className="text-2xl font-black text-primary/80 select-none">
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 bg-[#F8F9FA] relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-primary font-black uppercase tracking-[0.3em] text-xs"
              >
                The Process
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black text-primary font-heading mt-4"
              >
                Your journey to <br />
                <span className="text-primary/40 italic">professional mastery</span>
              </motion.h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-primary/5 -translate-y-1/2 z-0" />

              {[
                { step: "01", title: "Apply", desc: "Submit your application through our secure student portal." },
                { step: "02", title: "Match", desc: "Our algorithm matches you with the perfect industry partner." },
                { step: "03", title: "Train", desc: "Engage in hands-on work with direct professional mentorship." },
                { step: "04", title: "Excel", desc: "Complete your IAP and jumpstart your career with RCA." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-primary/5 shadow-xl shadow-primary/2 relative z-10 group"
                >
                  <div className="text-5xl font-black text-primary/5 mb-6 group-hover:text-primary/10 transition-colors uppercase italic">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-black text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-primary/60 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-32 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-xl">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="text-primary font-black uppercase tracking-[0.3em] text-xs"
                >
                  Success Stories
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl font-black text-primary font-heading mt-4"
                >
                  What our students <br />
                  <span className="text-primary/40 italic">are saying</span>
                </motion.h2>
              </div>
              <div className="hidden md:block">
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-full border border-primary/10 flex items-center justify-center text-primary/30 cursor-not-allowed">
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
                { name: "Sandrine U.", role: "Software Engineer Intern", text: "The IPA system streamlined my entire attachment process. The logbook generation tool saved me hours of administrative work.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&q=80&fit=crop" },
                { name: "Jean Paul N.", role: "Civil Engineering Student", text: "Matching with a top-tier construction firm was seamless. The structured objectives kept me focused on my learning goals.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&q=80&fit=crop" },
                { name: "Divine K.", role: "UI/UX Design Intern", text: "Professional, modern, and efficient. This portal is a testament to the high standards of RCA's industrial attachment program.", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&q=80&fit=crop" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-primary/5 p-10 rounded-[3rem] border border-primary/5 hover:border-primary/20 transition-all duration-500 group"
                >
                  <div className="flex gap-1 mb-6 text-yellow-500">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-lg font-medium text-primary/80 italic leading-relaxed mb-8">
                    "{item.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/10 shadow-lg bg-primary/10">
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
                      <div className="font-black text-primary">{item.name}</div>
                      <div className="text-xs text-primary/40 uppercase tracking-widest font-black">{item.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Stats Section */}
        <section className="py-24 bg-primary text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-20 bg-linear-to-b from-[#F8F9FA] to-transparent opacity-10" />
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
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 mb-6">
                    <stat.icon className="h-6 w-6 text-white/80" />
                  </div>
                  <div className="text-5xl font-black mb-2 tracking-tighter">{stat.number}</div>
                  <div className="text-white/60 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid - Interactive Cards */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4"
                >
                  The IPA Advantage
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-6xl font-black text-primary font-heading leading-tight"
                >
                  Why settle for a <br />
                  <span className="text-primary/40 italic">standard internship?</span>
                </motion.h2>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xl text-primary/60 max-w-sm font-medium pb-2"
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
                  tag: "High Impact",
                  accent: "from-blue-600/90"
                },
                {
                  title: "Elite Network",
                  desc: "Gain lifelong access to an exclusive community of developers, designers, and tech leaders.",
                  image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
                  tag: "Community",
                  accent: "from-primary/95"
                },
                {
                  title: "Rapid Growth",
                  desc: "Compress years of learning into months with our accelerated hands-on mentorship program.",
                  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
                  tag: "Career",
                  accent: "from-purple-700/90"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover="hovered"
                  className="group relative h-[520px] overflow-hidden rounded-[2.5rem] cursor-pointer bg-primary shadow-2xl shadow-primary/20"
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
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>


                  {/* Top Tag */}
                  <motion.div
                    className="absolute top-7 left-7"
                    variants={{
                      hovered: { y: -2, transition: { duration: 0.4 } },
                    }}
                  >
                    <span className="px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-black uppercase tracking-[0.25em]">
                      {feature.tag}
                    </span>
                  </motion.div>

                  {/* Bottom Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-9">
                    {/* Title always visible */}
                    <motion.h3
                      className="text-[2rem] font-black text-white leading-tight tracking-tight"
                      variants={{
                        hovered: { y: -8, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                      }}
                    >
                      {feature.title}
                    </motion.h3>

                    {/* Description — slides up and fades in on hover */}
                    <motion.p
                      className="text-white/80 text-base leading-relaxed font-medium mt-3"
                      initial={{ opacity: 0, y: 16 }}
                      variants={{
                        hovered: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] } },
                      }}
                    >
                      {feature.desc}
                    </motion.p>

                    {/* "Learn More" link — appears on hover */}
                    <motion.div
                      className="mt-5 flex items-center gap-2 text-white/60 text-sm font-bold"
                      initial={{ opacity: 0, y: 10 }}
                      variants={{
                        hovered: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.1 } },
                      }}
                    >
                      <span className="h-px w-6 bg-white/40 inline-block" />
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
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-primary rounded-[4rem] px-8 py-20 md:p-32 text-center relative overflow-hidden shadow-2xl shadow-primary/40"
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-full bg-gradient-radial from-white/10 to-transparent opacity-50" />
              </div>

              <div className="relative z-10 max-w-3xl mx-auto">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-5xl md:text-7xl font-black text-white font-heading mb-10 tracking-tighter"
                >
                  Ready to level up <br /> your career?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-xl text-white/70 mb-12 font-medium"
                >
                  Don't wait for opportunities. Create them by joining the Industrial Attachment Program today.
                </motion.p>
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button size="lg" className="bg-white text-primary hover:bg-white/95 h-16 px-8 rounded-xl font-semibold shadow-2xl cursor-pointer text-lg">
                      Access Student Portal
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
