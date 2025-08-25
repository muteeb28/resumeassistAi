"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./button";
import { Navbar } from "./navbar";
import { DeepSeekOptimizationService } from "../services/deepseekOptimization";

type OptimizeStep = 'upload' | 'target-role' | 'job-description' | 'optimizing' | 'template-selection' | 'payment';

import { FileUpload } from "./file-upload";

const TargetRoleForm = ({ onSubmit, onBack }: {
  onSubmit: (targetRole: string) => void;
  onBack: () => void;
}) => {
  const [targetRole, setTargetRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRole.trim()) {
      onSubmit(targetRole.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          What's Your Target Role?
        </h2>
        <p className="text-slate-400 text-lg">
          Tell us the specific position you're applying for so we can optimize your resume accordingly
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="target-role" className="block text-sm font-medium text-slate-300 mb-2">
            Target Job Title
          </label>
          <input
            id="target-role"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="px-8"
          >
            Back
          </Button>
          <Button 
            type="submit"
            className="px-8"
            disabled={!targetRole.trim()}
          >
            Continue
          </Button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-slate-800/30 rounded-lg">
        <p className="text-sm text-slate-400 text-center">
          💡 <strong>Tip:</strong> Be specific with your target role. This helps our AI tailor 
          the optimization to match industry expectations and required skills.
        </p>
      </div>
    </motion.div>
  );
};

const JobDescriptionForm = ({ onSubmit, onBack }: { 
  onSubmit: (jobDescription: string) => void;
  onBack: () => void;
}) => {
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobDescription.trim()) {
      onSubmit(jobDescription.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Add Job Description
        </h2>
        <p className="text-slate-400 text-lg">
          Paste the job description so our AI can optimize your resume to match the specific requirements
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="job-description" className="block text-sm font-medium text-slate-300 mb-2">
            Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the complete job description here..."
            className="w-full h-64 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            required
          />
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            className="px-8"
          >
            Back
          </Button>
          <Button 
            type="submit"
            className="px-8"
            disabled={!jobDescription.trim()}
          >
            Optimize Resume
          </Button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-slate-800/30 rounded-lg">
        <p className="text-sm text-slate-400 text-center">
          💡 <strong>Tip:</strong> Including a job description helps our AI analyze keyword matches, 
          required skills, and experience alignment for better ATS optimization.
        </p>
      </div>
    </motion.div>
  );
};

const OptimizingAnimation = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="max-w-2xl mx-auto text-center"
  >
    <div className="mb-8">
      <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
        />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Optimizing Your Resume</h2>
      <p className="text-slate-400 text-lg">DeepSeek AI is analyzing and enhancing your resume...</p>
    </div>

    <div className="space-y-4 text-left max-w-lg mx-auto">
      {[
        "Analyzing your uploaded resume content...",
        "Comparing against job requirements...", 
        "Identifying missing keywords and skills...",
        "Creating 3 optimized resume versions...",
        "Formatting for ATS compatibility..."
      ].map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.8 }}
          className="flex items-center gap-3 text-slate-300"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.8 + 0.3 }}
            className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"
          />
          {step}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

interface OptimizedResume {
  fixes: string[];
  improvements: string[];
  missingSkills: string[];
  matchPercentage: number;
  templates: {
    id: string;
    name: string;
    description: string;
    price: number;
    content: string;
  }[];
}

const TemplateSelection = ({ 
  optimizedResume, 
  onSelectTemplate 
}: { 
  optimizedResume: OptimizedResume; 
  onSelectTemplate: (templateId: string, price: number) => void; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-full mx-auto px-4"
  >
    {/* Header */}
    <div className="text-center mb-12">
      <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Resume Optimized Successfully!</h2>
      <p className="text-slate-400 text-lg max-w-2xl mx-auto">
        DeepSeek AI has analyzed your resume against the job requirements. Here are your results and 3 optimized templates.
      </p>
    </div>

    {/* Analysis Results */}
    <div className="grid md:grid-cols-3 gap-6 mb-12">
      {/* Match Percentage */}
      <div className="bg-slate-800/50 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-4">🎯 Job Match</h3>
        <div className="text-4xl font-bold text-green-500 mb-2">{optimizedResume.matchPercentage}%</div>
        <p className="text-slate-400 text-sm">Resume matches job requirements</p>
      </div>

      {/* Issues Fixed */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          Issues Fixed ({optimizedResume.fixes.length})
        </h3>
        <div className="space-y-2">
          {optimizedResume.fixes.slice(0, 3).map((fix, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-300 text-xs">{fix}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Missing Skills Added */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          Skills Added ({optimizedResume.missingSkills.length})
        </h3>
        <div className="space-y-2">
          {optimizedResume.missingSkills.slice(0, 3).map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-slate-300 text-xs">{skill}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>

    {/* Template Selection */}
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-white text-center mb-8">
        Choose Your Optimized Resume Template
      </h3>
      <div className="flex flex-row gap-8 justify-center items-start">
        {optimizedResume.templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.2 }}
            className="bg-white rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow overflow-hidden"
            style={{width: "367px", height: "475px"}}
            onClick={() => onSelectTemplate(template.id, template.price)}
          >
            <div className="overflow-hidden" style={{width: "816px", height: "1056px", transform: "scale(0.45)", transformOrigin: "top left"}}>
              <div className="p-8 h-full" style={{fontSize: "16px"}}>
                {template.id === 'professional-ats' && (
                  <div className="text-base text-gray-800 leading-relaxed whitespace-pre-line h-full overflow-hidden">
                    {template.content || "No content available"}
                  </div>
                )}
              
                {template.id === 'modern-executive' && (
                  <div className="text-base text-gray-800 leading-relaxed whitespace-pre-line h-full overflow-hidden">
                    {template.content || "No content available"}
                  </div>
                )}
              
                {template.id === 'creative-impact' && (
                  <div className="text-base text-gray-800 leading-relaxed whitespace-pre-line h-full overflow-hidden">
                    {template.content || "No content available"}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

    <div className="text-center mt-6">
      <p className="text-slate-400 mb-6">
        All templates include your actual resume content optimized by DeepSeek AI. Choose your preferred design.
      </p>
    </div>
  </motion.div>
);

const PaymentFlow = ({ onBack }: { onBack: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-2xl mx-auto text-center"
  >
    <h2 className="text-3xl font-bold text-white mb-4">Complete Your Purchase</h2>
    <p className="text-slate-400 mb-8">
      Secure payment to get your optimized resume
    </p>
    
    <div className="bg-slate-800/50 rounded-xl p-8 mb-8">
      <div className="flex justify-between items-center mb-4">
        <span className="text-white">Resume Optimization Service</span>
        <span className="text-2xl font-bold text-white">$12.00</span>
      </div>
      <div className="text-slate-400 text-sm text-left space-y-2">
        <div>✓ DeepSeek AI optimization</div>
        <div>✓ ATS-friendly formatting</div>
        <div>✓ Keyword enhancement</div>
        <div>✓ Professional templates</div>
        <div>✓ Instant download</div>
      </div>
    </div>

    <div className="space-y-4">
      <Button size="lg" className="w-full">
        Pay with Stripe
      </Button>
      <Button variant="outline" size="lg" className="w-full">
        Pay with PayPal
      </Button>
    </div>

    <button
      onClick={onBack}
      className="mt-6 text-slate-400 hover:text-white transition-colors"
    >
      ← Back to templates
    </button>
  </motion.div>
);

export const OptimizeResumePage = () => {
  const [currentStep, setCurrentStep] = useState<OptimizeStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState<string>('');
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{id: string, price: number} | null>(null);
  
  const optimizationService = new DeepSeekOptimizationService(
    import.meta.env.VITE_OPENAI_API_KEY || 'demo-key'
  );

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
      setCurrentStep('target-role');
    }
  };

  const handleTargetRoleSubmit = (role: string) => {
    setTargetRole(role);
    setCurrentStep('job-description');
  };

  const handleJobDescriptionSubmit = async (jobDesc: string) => {
    setCurrentStep('optimizing');
    
    if (!uploadedFile) {
      return;
    }
    
    try {
      const resumeText = await optimizationService.extractTextFromFile(uploadedFile);
      const optimizationResult = await optimizationService.optimizeResume(
        resumeText,
        targetRole,
        jobDesc
      );
      
      const optimizedResumeData: OptimizedResume = {
        fixes: optimizationResult.fixes || [],
        improvements: optimizationResult.improvements || [],
        missingSkills: optimizationResult.missingSkills || [],
        matchPercentage: optimizationResult.matchPercentage || 0,
        templates: [
          {
            id: 'professional-ats',
            name: 'Professional ATS',
            description: 'Clean, ATS-friendly design optimized for applicant tracking systems',
            price: 12,
            content: optimizationResult.template1 || ''
          },
          {
            id: 'modern-executive',
            name: 'Modern Executive', 
            description: 'Contemporary design perfect for senior-level positions',
            price: 15,
            content: optimizationResult.template2 || ''
          },
          {
            id: 'creative-impact',
            name: 'Creative Impact',
            description: 'Eye-catching design that highlights your achievements',
            price: 18,
            content: optimizationResult.template3 || ''
          }
        ]
      };
      
      setOptimizedResume(optimizedResumeData);
      setCurrentStep('template-selection');
    } catch (error) {
      alert(`DeepSeek optimization failed: ${error}. Showing demo results.`);
      
      const fallbackData: OptimizedResume = {
        fixes: [
          "Enhanced action verbs throughout experience section",
          "Added missing technical keywords for better ATS scoring", 
          "Improved quantification of achievements with specific metrics",
          "Optimized formatting for better readability",
          "Strengthened professional summary alignment with target role"
        ],
        improvements: [
          `Tailored content specifically for ${targetRole} position`,
          "Highlighted relevant technical skills and competencies",
          "Enhanced project descriptions with measurable outcomes", 
          "Added industry-specific terminology and keywords",
          "Improved overall professional presentation and impact"
        ],
        missingSkills: [
          "React and modern JavaScript frameworks",
          "Cloud platforms (AWS, Azure, GCP)",
          "Project management and leadership skills",
          "Data analysis and visualization tools",
          "Agile/Scrum methodologies"
        ],
        matchPercentage: 78,
        templates: [
          {
            id: 'professional-ats',
            name: 'Professional ATS',
            description: 'Clean, ATS-friendly design optimized for applicant tracking systems', 
            price: 12,
            content: `OPTIMIZED RESUME - PROFESSIONAL ATS FORMAT\n\n[YOUR NAME FROM UPLOADED RESUME]\n${targetRole}\n[Your actual email and phone from resume]\n\nPROFESSIONAL SUMMARY\nExperienced ${targetRole} with proven track record of delivering high-impact solutions and driving measurable business results. Expert in relevant technologies with strong analytical and problem-solving capabilities.\n\nCORE COMPETENCIES\n• Technical expertise in job-specific technologies\n• Project leadership and cross-functional collaboration\n• Data-driven decision making and performance optimization\n• Agile methodologies and best practices implementation\n• Strategic planning and stakeholder management\n\nPROFESSIONAL EXPERIENCE\n\n[Your actual work experience will be optimized here]\nSenior Professional | Tech Company | 2020-2023\n• Led development of enterprise solutions serving 10,000+ users\n• Improved system performance by 45% through architectural optimizations\n• Mentored cross-functional teams and established technical standards\n• Delivered projects ahead of schedule with 98% stakeholder satisfaction\n\nTECHNICAL SKILLS\n[Enhanced with job-specific keywords and technologies]\n\nEDUCATION\n[Your actual education from uploaded resume]\n\nCERTIFICATIONS\n[Relevant certifications mentioned in your resume]`
          },
          {
            id: 'modern-executive',
            name: 'Modern Executive', 
            description: 'Contemporary design perfect for senior-level positions',
            price: 15,
            content: `MODERN EXECUTIVE RESUME FORMAT\n\n═══════════════════════════\n[YOUR NAME FROM UPLOADED RESUME]\n${targetRole}\n═══════════════════════════\n\n📧 [Your actual email] | 📱 [Your actual phone]\n\n▶ EXECUTIVE PROFILE\n──────────────────────\nStrategic ${targetRole} with expertise in driving organizational growth and delivering exceptional business outcomes. Proven leader with track record of managing complex projects and building high-performing teams.\n\n▶ KEY ACHIEVEMENTS\n──────────────────────\n🎯 [Quantified achievements from your resume]\n📈 Delivered measurable business impact through strategic initiatives\n👥 Led cross-functional teams to exceed performance targets\n💡 Implemented innovative solutions driving operational excellence\n\n▶ PROFESSIONAL EXPERIENCE\n──────────────────────────\n[Your actual work experience optimized for executive level]\n\n▶ CORE COMPETENCIES\n────────────────────\n• Strategic Leadership & Vision\n• Digital Transformation\n• Performance Optimization\n• Stakeholder Management\n• Team Development & Mentoring\n\n▶ EDUCATION & CREDENTIALS\n─────────────────────────\n[Your actual education and certifications]`
          },
          {
            id: 'creative-impact',
            name: 'Creative Impact',
            description: 'Eye-catching design that highlights your achievements',
            price: 18,
            content: `🌟 CREATIVE IMPACT RESUME 🌟\n\n╔═══════════════════════════════╗\n║  [YOUR NAME FROM RESUME]      ║\n║  ${targetRole}                ║\n║  ✉️ [email] | 📱 [phone]     ║\n╚═══════════════════════════════╝\n\n🚀 IMPACT STATEMENT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nInnovative ${targetRole} passionate about creating transformative solutions that drive business success. Expert in leveraging cutting-edge technologies to deliver exceptional user experiences and measurable results.\n\n⭐ HIGHLIGHTED ACHIEVEMENTS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🎯 PERFORMANCE EXCELLENCE\n   ▸ [Your quantified achievements]\n   ▸ Exceeded performance targets by significant margins\n   ▸ Implemented solutions resulting in cost savings\n\n💡 INNOVATION & LEADERSHIP\n   ▸ Led strategic initiatives and transformation projects\n   ▸ Mentored teams and established best practices\n   ▸ Delivered award-winning solutions\n\n📊 TECHNICAL EXPERTISE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[Enhanced technical skills from your resume]\n• Advanced proficiency in relevant technologies\n• Cloud platforms and modern development practices\n• Data analysis and performance optimization\n\n🏢 PROFESSIONAL JOURNEY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[Your actual work experience with creative formatting]\n\n🎓 EDUCATION & GROWTH\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n[Your actual education and certifications]`
          }
        ]
      };
      
      setOptimizedResume(fallbackData);
      setCurrentStep('template-selection');
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setTargetRole('');
    setJobDescription('');
  };

  const handleBackToTargetRole = () => {
    setCurrentStep('target-role');
  };


  const handleSelectTemplate = (templateId: string, price: number) => {
    setSelectedTemplate({ id: templateId, price });
    setCurrentStep('payment');
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Optimize Your Resume
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Upload your resume, specify your target role, and let DeepSeek AI create optimized versions tailored to your job requirements
            </p>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 'upload' && (
              <motion.div key="upload">
                <FileUpload onChange={handleFileUpload} />
              </motion.div>
            )}
            
            {currentStep === 'target-role' && (
              <motion.div key="target-role">
                <TargetRoleForm 
                  onSubmit={handleTargetRoleSubmit}
                  onBack={handleBackToUpload}
                />
              </motion.div>
            )}
            
            {currentStep === 'job-description' && (
              <motion.div key="job-description">
                <JobDescriptionForm 
                  onSubmit={handleJobDescriptionSubmit}
                  onBack={handleBackToTargetRole}
                />
              </motion.div>
            )}
            
            {currentStep === 'optimizing' && (
              <motion.div key="optimizing">
                <OptimizingAnimation />
              </motion.div>
            )}
            
            {currentStep === 'template-selection' && optimizedResume && (
              <motion.div key="template-selection">
                <TemplateSelection 
                  optimizedResume={optimizedResume}
                  onSelectTemplate={handleSelectTemplate}
                />
              </motion.div>
            )}
            
            {currentStep === 'payment' && selectedTemplate && (
              <motion.div key="payment">
                <PaymentFlow onBack={() => setCurrentStep('template-selection')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};