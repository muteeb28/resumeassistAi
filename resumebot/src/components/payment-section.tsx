"use client";
import { motion } from "motion/react";
import { LampContainer } from "./lamp";
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
        "relative p-8 rounded-2xl border border-slate-700 bg-slate-900/50 backdrop-blur-sm",
        isPopular && "border-cyan-500/50 bg-slate-900/70",
        className
      )}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-5xl font-bold text-white">${price}</span>
          {period && <span className="text-slate-400 text-lg">/{period}</span>}
        </div>
        <p className="text-slate-400 mb-6">{description}</p>
        
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
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
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
    <LampContainer className="overflow-visible">
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl mb-4"
      >
        Choose Your Plan
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0.5, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.5,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="text-slate-400 text-xl text-center mb-16 max-w-2xl mt-8"
      >
        Start free and upgrade as you grow. All plans include unlimited resume downloads and exports.
      </motion.p>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
        <PricingCard
          title="Free"
          price="0"
          description="Perfect for getting started with basic resume building"
          features={[
            "3 resume templates",
            "Basic AI optimization", 
            "PDF download",
            "Email support",
            "ATS-friendly formatting"
          ]}
          buttonText="Start Free"
        />
        
        <PricingCard
          title="Pro"
          price="9"
          period="month"
          description="Ideal for job seekers who want premium features"
          features={[
            "Unlimited resume templates",
            "Advanced AI optimization",
            "Multiple file formats (PDF, Word, PNG)",
            "Job description matching",
            "Cover letter generator",
            "Priority email support",
            "Resume analytics"
          ]}
          isPopular={true}
          buttonText="Start Pro Trial"
        />
        
        <PricingCard
          title="Enterprise"
          price="29"
          period="month"
          description="Best for teams and career coaches"
          features={[
            "Everything in Pro",
            "Team collaboration",
            "White-label branding", 
            "API access",
            "Custom templates",
            "Phone & chat support",
            "Advanced analytics",
            "Bulk resume generation"
          ]}
          buttonText="Contact Sales"
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-slate-500 text-sm mb-4">
          🔒 Secure payment • 💳 Cancel anytime • 📞 24/7 support
        </p>
        <div className="flex items-center justify-center gap-8 opacity-60">
          <div className="text-slate-500 text-xs font-semibold">Stripe</div>
          <div className="text-slate-500 text-xs font-semibold">PayPal</div>
          <div className="text-slate-500 text-xs font-semibold">Apple Pay</div>
          <div className="text-slate-500 text-xs font-semibold">Google Pay</div>
        </div>
      </motion.div>
    </LampContainer>
  );
};