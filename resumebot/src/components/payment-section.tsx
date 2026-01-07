"use client";
import { motion } from "motion/react";
import { Button } from "./button";
import { cn } from "../lib/utils";

const PricingCard = ({
  title,
  price,
  period,
  description,
  features,
  isPopular = false,
  buttonText = "Get Started",
  className,
}: {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText?: string;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative p-7 md:p-8 rounded-3xl border border-slate-800/70 bg-slate-900/60 backdrop-blur-sm shadow-[0_24px_60px_rgba(2,6,23,0.45)]",
        isPopular && "border-cyan-400/60 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/40 shadow-[0_32px_90px_rgba(14,165,233,0.18)]",
        className
      )}
    >
      {isPopular && (
        <div className="absolute top-5 right-5">
          <span className="bg-cyan-500/15 text-cyan-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border border-cyan-400/30">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">{title}</h3>
        <div className="mb-3 flex items-end justify-center gap-2">
          <span className="text-4xl md:text-5xl font-semibold text-white">{price}</span>
          {period && <span className="text-slate-400 text-sm md:text-base">/{period}</span>}
        </div>
        <p className="text-slate-400 text-sm md:text-base mb-6">{description}</p>

        <Button
          variant={isPopular ? "default" : "outline"}
          className="w-full mb-6"
          size="lg"
        >
          {buttonText}
        </Button>

        <div className="space-y-3 text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/15 flex items-center justify-center border border-cyan-500/30">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              </div>
              <span className="text-slate-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const PaymentSection = () => {
  return (
    <section className="relative py-24 px-4">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.22),_transparent_65%)]" />
        <div className="absolute left-1/2 top-10 h-24 w-[28rem] -translate-x-1/2 bg-cyan-500/30 blur-[90px]" />
        <div className="absolute left-1/2 top-0 h-px w-56 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0.5, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            ease: "easeInOut",
          }}
          className="bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-center text-3xl md:text-5xl font-semibold tracking-tight text-transparent mb-4"
        >
          Choose Your Plan
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.35,
            duration: 0.6,
            ease: "easeInOut",
          }}
          className="text-slate-400 text-base md:text-lg text-center mb-12 max-w-2xl mx-auto"
        >
          Simple pricing for resume optimization and job tracking. Pay once for a resume or go monthly for tracking and outreach.
        </motion.p>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          <PricingCard
            title="Resume Optimization"
            price="Rs 50"
            description="One-time payment for a tailored, ATS-ready resume."
            features={[
              "Tailored resume builder",
              "Job description match",
              "ATS-friendly formatting",
              "PDF + DOCX downloads",
              "One-time payment"
            ]}
            buttonText="Pay Rs 50"
          />

          <PricingCard
            title="Job Tracker + HR Emails"
            price="Rs 135"
            period="month"
            description="Track applications and run cold email outreach."
            features={[
              "Cloud job tracker",
              "Google Sheets export",
              "HR cold email templates",
              "Follow-up reminders",
              "Application status dashboard"
            ]}
            isPopular={true}
            buttonText="Start Monthly Plan"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-slate-500 text-sm mb-4">
            Secure payment | Cancel anytime | 24/7 support
          </p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-slate-500 text-xs font-semibold">Stripe</div>
            <div className="text-slate-500 text-xs font-semibold">PayPal</div>
            <div className="text-slate-500 text-xs font-semibold">Apple Pay</div>
            <div className="text-slate-500 text-xs font-semibold">Google Pay</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
