"use client";

import { PlayfulHero, AnimatedText } from "./playful-hero";
import { Button } from "./button";
import { PinContainer } from "./3d-pin";
import { ResumeOptimizationDemo } from "./resume-demo";
import { Navbar } from "./navbar";
import { PaymentSection } from "./payment-section";
import { AnimatedTestimonials } from "./animated-testimonials";
import { motion } from "motion/react";

export function AnimatedPinDemo() {
  return (
    <div className="min-h-screen w-full bg-black dark:bg-black">
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

      {/* Resume Optimization Demo Section */}
      <div className="py-20 px-4 bg-gradient-to-b from-black to-slate-900">
        <ResumeOptimizationDemo />
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-b from-black to-slate-900 py-20 relative z-20 isolate">
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
      <div className="relative z-10 isolate">
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
          <div className="text-2xl font-bold text-white mb-4">ResumeBot</div>
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
    </div>
  );
}
