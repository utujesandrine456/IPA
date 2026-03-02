"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Globe, Laptop, Users } from "lucide-react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background via-background to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold text-primary font-heading leading-[1.1] mb-6">
                Shape Your Future with <span className="text-primary">Real Experience</span>
              </h1>
              <p className="text-xl text-primary mb-8 leading-relaxed max-w-lg">
                The Industrial Attachment Program connects ambitious students with world-class companies for transformative internships.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/instructions">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full cursor-pointer">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/objectives">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 cursor-pointer">
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 mt-12">
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-primary/10">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Globe className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-2">Global Reach</h3>
                    <p className="text-sm text-primary">Partnering with companies across the tech ecosystem.</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-primary/10">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-primary">Mentorship</h3>
                    <p className="text-sm text-primary">Direct guidance from industry professionals.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-primary/10">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Laptop className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-2">Real Projects</h3>
                    <p className="text-sm text-primary">Work on production code that matters.</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-primary/10">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-2">Skill Growth</h3>
                    <p className="text-sm text-primary">Master modern technologies in practice.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white text-primary">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "500+", label: "Students Placed" },
                { number: "50+", label: "Partner Companies" },
                { number: "98%", label: "Satisfaction Rate" },
                { number: "100%", label: "Job Readiness" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-4xl md:text-5xl font-bold font-heading mb-2 text-primary">{stat.number}</div>
                  <div className="text-primary font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-background text-primary">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary font-heading mb-4">Why Choose IPA?</h2>
              <p className="text-primary text-lg">
                Our program is designed to bridge the gap between academic learning and professional excellence.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Structured Learning",
                  desc: "Follow a comprehensive curriculum designed to cover all aspects of professional software development.",
                  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                },
                {
                  title: "Industry Networking",
                  desc: "Connect with leaders in the tech industry and build relationships that will last a lifetime.",
                  image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80"
                },
                {
                  title: "Career Acceleration",
                  desc: "Gain the experience needed to land high-paying roles at top technology companies.",
                  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                }
              ].map((feature, i) => (
                <div key={i} className="group relative overflow-hidden rounded-3xl aspect-[4/5] cursor-pointer">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8">
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-white leading-relaxed translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-white font-heading mb-8">
                  Ready to start your journey?
                </h2>
                <p className="text-xl text-white mb-10">
                  Join hundreds of students who have transformed their careers through the Industrial Attachment Program.
                </p>
                <Link href="/login">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/50 h-14 px-10 text-lg rounded-full font-bold cursor-pointer">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
