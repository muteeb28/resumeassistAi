"use client";

import { PlayfulHero, AnimatedText } from "./playful-hero";
import { Button } from "./button";
import { PinContainer } from "./3d-pin";
import { ResumeOptimizationDemo } from "./resume-demo";
import { Navbar } from "./navbar";
import { PaymentSection } from "./payment-section";
import { AnimatedTestimonials } from "./animated-testimonials";
import { motion } from "motion/react";
import { BackgroundRippleLayout } from "./background-ripple-layout";

export function AnimatedPinDemo() {
  return (
    <BackgroundRippleLayout tone="dark">
      {/* Navigation */}
      <Navbar />
      {/* Playful Hero Section */}
      <PlayfulHero>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center px-4"
        >
          <AnimatedText
            text="Build Your Perfect Resume with AI"
            className="text-4xl md:text-7xl font-bold text-white mb-6"
            delay={0.2}
          />
          <AnimatedText
            text="Transform your career with ResumeBot - the AI-powered platform that creates professional, ATS-optimized resumes tailored to your dream job in minutes."
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8"
            delay={1}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button size="lg" onClick={() => window.location.href = '/create'}>
              Create New Resume
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/optimize'}>
              Optimize My Resume
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.5 }}
            className="text-center"
          >
            <p className="text-slate-400 text-sm mb-4">
              ⭐ Trusted by 10,000+ professionals worldwide
            </p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-slate-400 text-xs font-semibold">Google</div>
              <div className="text-slate-400 text-xs font-semibold">Microsoft</div>
              <div className="text-slate-400 text-xs font-semibold">Apple</div>
              <div className="text-slate-400 text-xs font-semibold">Meta</div>
            </div>
          </motion.div>
        </motion.div>
      </PlayfulHero>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Features That Move the Needle
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Focused tools for matching roles, building resumes, and tracking every application.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold mb-4">
                01
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Job Description Match</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Paste a role and get a resume tuned to the exact keywords recruiters scan.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold mb-4">
                02
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Tailored Resume Builder</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Generate role-specific summaries and bullets while keeping your voice intact.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold mb-4">
                03
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Job Tracker</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track every application, follow-up, and outcome from a single dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <ResumeOptimizationDemo />
        </div>
      </section>

      {/* Job Tracker Section */}
      <section id="job-tracker" className="py-20 px-4 scroll-mt-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Job Tracker, Your Way
            </h2>
            <p className="text-slate-400 text-lg mb-6">
              Keep your pipeline organized with a cloud tracker or export everything to Google Sheets.
            </p>
            <div className="space-y-3 text-slate-300">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                <span>Stage-based pipeline with reminders</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Save HR contacts and outreach history</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                <span>One-click export to Google Sheets</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm">
                  01
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Cloud Tracker</h3>
                  <p className="text-slate-400 text-sm">
                    Kanban-style boards to see every role at a glance.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-sm">
                  02
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Google Sheets Export</h3>
                  <p className="text-slate-400 text-sm">
                    Send your tracker to Sheets anytime for sharing or backups.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-sm">
                  03
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">HR Cold Email Templates</h3>
                  <p className="text-slate-400 text-sm">
                    Ready-to-send outreach copy with follow-up reminders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <div className="py-20 relative z-20 isolate">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            What Our Users Say
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their careers with ResumeBot
          </p>
        </div>
        <AnimatedTestimonials
          testimonials={[
            {
              quote: "ResumeBot completely transformed my job search. I got 3x more interviews after optimizing my resume with their AI. The ATS-friendly formatting really works!",
              name: "Sarah Chen",
              designation: "Software Engineer at Google",
              src: "https://images.unsplash.com/photo-1494790108755-2616b612b8c5?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.0.3",
            },
            {
              quote: "I was skeptical about AI resume builders, but ResumeBot impressed me. It understood my field perfectly and created a resume that landed me my dream job in 2 weeks.",
              name: "Marcus Johnson",
              designation: "Product Manager at Microsoft",
              src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.0.3",
            },
            {
              quote: "The job description optimization feature is genius! I paste a job posting and ResumeBot tailors my resume perfectly. My application rate success increased by 400%.",
              name: "Emily Rodriguez",
              designation: "Data Scientist at Meta",
              src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.0.3",
            },
            {
              quote: "As a career coach, I recommend ResumeBot to all my clients. The AI understands what recruiters look for and creates resumes that actually get results.",
              name: "David Kim",
              designation: "Senior Career Coach",
              src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.0.3",
            },
          ]}
          autoplay={true}
        />
      </div>

      {/* Spacing between sections */}
      <div className="h-32"></div>

      {/* Payment Section with Lamp Effect */}
      <div id="pricing" className="relative z-10 isolate scroll-mt-24">
        <PaymentSection />
      </div>

      {/* CTA Section with 3D Pin */}
      <div className="py-20 px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Join thousands of professionals who have successfully landed interviews with ResumeBot
          </p>
        </div>

        <div className="flex justify-center">
          <PinContainer
            title="Get Started Free"
            href="#"
          >
            <div className="flex basis-full flex-col p-6 tracking-tight text-slate-100/50 sm:basis-1/2 w-[24rem] h-[20rem]">
              <h3 className="max-w-xs !pb-2 !m-0 font-bold text-xl text-slate-100">
                Start Your Success Story
              </h3>
              <div className="text-base !m-0 !p-0 font-normal mb-4">
                <span className="text-slate-300">
                  Create your first professional resume in under 10 minutes. No credit card required.
                </span>
              </div>
              <div className="flex flex-col gap-3 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Free forever plan
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Unlimited downloads
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  24/7 AI assistance
                </div>
              </div>
              <div className="flex flex-1 w-full rounded-lg mt-4 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500" />
            </div>
          </PinContainer>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="ResumeBot"
              className="h-40 w-auto object-contain"
            />
          </div>
          <p className="text-slate-400 mb-8">
            The future of resume building is here
          </p>
          <div className="flex justify-center gap-8 text-slate-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="mt-8 text-slate-500 text-xs">
            © 2024 ResumeBot. All rights reserved.
          </div>
        </div>
      </footer>
    </BackgroundRippleLayout>
  );
}
