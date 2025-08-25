"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./button";

export const ResumeOptimizationDemo = () => {
  const [step, setStep] = useState(0);
  const [jobDescription, setJobDescription] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  const sampleJobDescription = `Senior Frontend Developer
  
We're looking for a skilled Frontend Developer with experience in React, TypeScript, and modern web technologies. You'll be responsible for building user-facing features, optimizing performance, and collaborating with our design team.

Requirements:
- 5+ years of experience with React
- Strong TypeScript skills
- Experience with state management (Redux, Zustand)
- Knowledge of testing frameworks (Jest, Cypress)
- Familiarity with CI/CD pipelines
- Strong problem-solving skills`;

  const originalResume = {
    title: "Software Developer",
    summary: "I am a developer with some experience in web development. I have worked with JavaScript and some frameworks.",
    skills: ["JavaScript", "HTML", "CSS", "Some React"],
    experience: "Worked on various web projects using different technologies."
  };

  const optimizedResume = {
    title: "Senior Frontend Developer",
    summary: "Experienced Frontend Developer with 5+ years specializing in React and TypeScript. Proven track record of building high-performance user interfaces and collaborating effectively with cross-functional teams.",
    skills: ["React", "TypeScript", "Redux", "Jest", "Cypress", "CI/CD", "Performance Optimization"],
    experience: "Led development of user-facing features using React and TypeScript, implemented state management solutions with Redux, and established comprehensive testing strategies with Jest and Cypress."
  };

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setStep(2);
    }, 3000);
  };

  const handleJobDescriptionPaste = () => {
    setJobDescription(sampleJobDescription);
    setStep(1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          See AI Resume Optimization in Action
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Watch how our AI transforms your resume to match job requirements and pass ATS systems
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Step {step + 1}: Paste Job Description
            </h3>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-64 bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="mt-4 flex gap-3">
              <Button onClick={handleJobDescriptionPaste} size="sm">
                Use Sample Job
              </Button>
              {step >= 1 && (
                <Button 
                  onClick={handleOptimize} 
                  size="sm"
                  disabled={isOptimizing}
                >
                  {isOptimizing ? "Optimizing..." : "Optimize Resume"}
                </Button>
              )}
            </div>
          </div>

          {/* AI Processing Animation */}
          <AnimatePresence>
            {isOptimizing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30"
              >
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <div className="text-white">
                    <p className="font-semibold">AI is analyzing...</p>
                    <div className="flex space-x-1 mt-2">
                      <motion.div
                        className="w-2 h-2 bg-purple-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-pink-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    ✓ Analyzing job requirements...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    ✓ Matching skills and experience...
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                  >
                    ✓ Optimizing for ATS systems...
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resume Comparison */}
        <div className="space-y-6">
          {/* Original Resume */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: step >= 2 ? 0.5 : 1 }}
            className="bg-red-900/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Original Resume</h3>
              <span className="text-red-400 text-sm">❌ Not ATS Optimized</span>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-white font-medium">{originalResume.title}</h4>
                <p className="text-slate-400 mt-1">{originalResume.summary}</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {originalResume.skills.map((skill, index) => (
                    <span key={index} className="bg-slate-700 px-2 py-1 rounded text-slate-300 text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Experience</h4>
                <p className="text-slate-400">{originalResume.experience}</p>
              </div>
            </div>
          </motion.div>

          {/* Optimized Resume */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-green-900/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">AI-Optimized Resume</h3>
                  <span className="text-green-400 text-sm">✅ ATS Friendly</span>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <motion.h4 
                      initial={{ backgroundColor: "rgba(34, 197, 94, 0)" }}
                      animate={{ backgroundColor: ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0)"] }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="text-white font-medium rounded px-1"
                    >
                      {optimizedResume.title}
                    </motion.h4>
                    <motion.p 
                      initial={{ backgroundColor: "rgba(34, 197, 94, 0)" }}
                      animate={{ backgroundColor: ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0)"] }}
                      transition={{ duration: 1.5, delay: 1 }}
                      className="text-slate-400 mt-1 rounded px-1"
                    >
                      {optimizedResume.summary}
                    </motion.p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {optimizedResume.skills.map((skill, index) => (
                        <motion.span 
                          key={index}
                          initial={{ scale: 0, backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                          animate={{ scale: 1, backgroundColor: ["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.3)", "rgba(34, 197, 94, 0.1)"] }}
                          transition={{ duration: 0.5, delay: 1.5 + index * 0.1 }}
                          className="bg-green-800 px-2 py-1 rounded text-green-200 text-xs"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Experience</h4>
                    <motion.p 
                      initial={{ backgroundColor: "rgba(34, 197, 94, 0)" }}
                      animate={{ backgroundColor: ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0)"] }}
                      transition={{ duration: 1.5, delay: 2 }}
                      className="text-slate-400 rounded px-1"
                    >
                      {optimizedResume.experience}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Improvements Summary */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-blue-900/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30"
              >
                <h4 className="text-white font-semibold mb-4">AI Improvements Applied:</h4>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Matched job title exactly: "Senior Frontend Developer"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Added required skills: React, TypeScript, Redux, Testing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Quantified experience: "5+ years" mentioned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Used ATS-friendly keywords from job description</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Improved professional language and structure</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-12"
        >
          <Button 
            size="lg" 
            onClick={() => setStep(0)}
          >
            Try Another Example
          </Button>
        </motion.div>
      )}
    </div>
  );
};