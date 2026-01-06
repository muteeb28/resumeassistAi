"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import AuthModal from "./auth-modal";
import { useUserStore } from "../stores/useUserStore";

export const Navbar = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, logout } = useUserStore();

  const navItems = [
    { name: "Job Tracker", href: "#job-tracker" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" }
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center cursor-pointer"
            onClick={() => window.location.href = "/"}
          >
            <img
              src="/logo.png"
              alt="ResumeBot"
              className="h-16 w-auto object-contain py-1"
            />
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.a
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                href={item.href}
                className="text-slate-300 hover:text-white transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </motion.a>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hidden md:flex items-center space-x-4"
          >
            <Button variant="ghost" size="sm" onClick={() => window.location.hash = "contact"}>
              Contact Us
            </Button>
            {
              user ? (
                <div className="relative group">
                  <button
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm font-medium"
                    aria-haspopup="true"
                    aria-expanded={false}
                  >
                    {user.email ? user.email.split("@")[0].slice(0, 2).toUpperCase() : "?"}
                  </button>

                  <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transform translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50">
                    <a href="/profile" className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">Profile</a>
                    <a href="/orders" className="block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">Orders</a>
                    <button onClick={async () => { await logout(); }} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">Logout</button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowAuth(true)}>
                  Login
                </Button>
              )
            }
            <Button size="sm">
              Get Started
            </Button>
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white transition-colors duration-200 p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-900/50 rounded-lg mt-2">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="border-t border-slate-700 pt-3 mt-3 space-y-2">
                  <a
                    href="#contact"
                    className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact Us
                  </a>
                  <div className="px-3 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => { setShowAuth(true); setIsOpen(false); }}
                    >
                      Login
                    </Button>
                    <Button
                      size="sm"
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </motion.nav>
  );
};
