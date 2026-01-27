"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "./navbar";
import { BackgroundRippleLayout } from "./background-ripple-layout";
import { Button } from "./button";
import { buildApiUrl, extractResumeData } from "../services/resumeOptimizerApi";
import { generateJobSpecificResume } from "../services/resumeGenerator";
import { TemplateSwitcher } from "./template-switcher";
import TemplateClassic from "../templates/TemplateClassic";
import TemplateSplit from "../templates/TemplateSplit";
import { exportResumeDocx } from "../services/docxExport";
import ResumeEditor from "./ResumeEditor";
import type { ResumeGenerationResult, ResumeJSON } from "../types/resume";
import { validateResumeJson } from "../types/resume";

type StepId = "resume" | "generate" | "results";
type InputMode = "upload" | "paste";

const steps: Array<{ id: StepId; label: string; description: string }> = [
  {
    id: "resume",
    label: "Upload Resume",
    description: "Upload or paste your existing resume",
  },
  {
    id: "generate",
    label: "Generate",
    description: "Create your tailored resume",
  },
  {
    id: "results",
    label: "Results",
    description: "Review templates and improvements",
  },
];

const lightButtonClasses = {
  primary:
    "bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800 focus-visible:ring-neutral-900 focus-visible:ring-offset-white shadow-none",
  outline:
    "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-900 focus-visible:ring-offset-white shadow-none",
};

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

// Simple text extraction for initial upload display only
// This runs ONCE at import time, not in the edit loop
const extractTextFromParsed = (data: any): string => {
  if (!data || typeof data !== "object") return "";

  // If there's raw text available, use it
  if (data.rawText && typeof data.rawText === "string") {
    return data.rawText;
  }

  const content = data.fullContent || data.layout || data;
  const lines: string[] = [];

  // Name
  const name = content.name || content.personalInfo?.name || content.contact?.name;
  if (name) lines.push(String(name));

  // Contact info - include ALL links
  const contact = content.personalInfo || content.contact || content.contactInfo || {};
  const contactParts = [contact.email, contact.phone, contact.location].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(" | "));

  // Add social links on separate lines so parser can detect them
  if (contact.github) lines.push(`GitHub: ${contact.github}`);
  if (contact.linkedin) lines.push(`LinkedIn: ${contact.linkedin}`);
  if (contact.twitter) lines.push(`Twitter: ${contact.twitter}`);

  // Summary
  const summary = content.summary || content.professionalSummary || content.profile;
  if (summary) lines.push("", "PROFESSIONAL SUMMARY", String(summary));

  // Skills
  const skills = Array.isArray(content.skills) ? content.skills : [];
  if (skills.length) lines.push("", "SKILLS", skills.join(", "));

  // Experience
  const experience = Array.isArray(content.experience) ? content.experience : [];
  if (experience.length) {
    lines.push("", "EXPERIENCE");
    experience.forEach((exp: any) => {
      const title = exp.title || exp.role || exp.position || "";
      const company = exp.company || exp.organization || "";
      const dates = exp.dates || exp.duration || "";
      if (title || company) lines.push(`${title} ${company} (${dates})`.trim());
      const bullets = exp.description || exp.bullets || exp.responsibilities || [];
      if (Array.isArray(bullets)) {
        bullets.forEach((b: any) => lines.push(`- ${String(b)}`));
      }
    });
  }

  // Projects - MUST be included with ALL fields
  const projects = Array.isArray(content.projects) ? content.projects : [];
  if (projects.length) {
    lines.push("", "PROJECTS");
    projects.forEach((proj: any) => {
      const name = proj.name || proj.title || "";
      const description = proj.description || proj.summary || "";
      const link = proj.link || proj.url || "";

      if (name) {
        lines.push(name);
        if (description) lines.push(description);
        const bullets = proj.bullets || proj.points || [];
        if (Array.isArray(bullets)) {
          bullets.forEach((b: any) => lines.push(`- ${String(b)}`));
        }
        // Add link BEFORE tech so parser can detect it
        if (link) {
          lines.push(`Link: ${link}`);
        }
        const tech = proj.tech || proj.technologies || [];
        if (Array.isArray(tech) && tech.length) {
          lines.push(`Tech: ${tech.join(", ")}`);
        }
      }
    });
  }

  // Education - handle both string and object formats
  const education = Array.isArray(content.education) ? content.education : [];
  if (education.length) {
    lines.push("", "EDUCATION");
    education.forEach((edu: any) => {
      // Handle string format (from backend parser)
      if (typeof edu === 'string') {
        lines.push(edu);
        return;
      }

      // Handle object format
      const degree = edu.degree || "";
      const school = edu.school || edu.institution || edu.university || "";
      const dates = edu.dates || edu.year || edu.graduation || "";

      // Format as "Degree - School (Dates)" for better parsing
      if (school && dates) {
        const line = degree
          ? `${degree} - ${school} (${dates})`
          : `${school} (${dates})`;
        lines.push(line);
      } else if (school) {
        const line = degree ? `${degree} - ${school}` : school;
        lines.push(line);
      }
    });
  }

  // Certifications
  const certifications = Array.isArray(content.certifications) ? content.certifications : [];
  if (certifications.length) {
    lines.push("", "CERTIFICATIONS");
    certifications.forEach((cert: any) => {
      if (typeof cert === "string") {
        lines.push(`- ${cert}`);
      } else {
        const name = cert.name || cert.title || "";
        const issuer = cert.issuer || "";
        const date = cert.date || "";
        const parts = [name, issuer, date].filter(Boolean);
        if (parts.length) lines.push(`- ${parts.join(" - ")}`);
      }
    });
  }

  // Community / Activities
  const community = Array.isArray(content.community) ? content.community : [];
  if (community.length) {
    lines.push("", "COMMUNITY & ACTIVITIES");
    community.forEach((item: any) => {
      const role = item.role || item.title || "";
      const org = item.organization || item.company || "";
      if (role || org) {
        lines.push(`- ${role}${org ? `: ${org}` : ""}`);
      }
    });
  }

  return lines.join("\n").trim();
};

export const CreateResumeSimple = () => {
  const [step, setStep] = useState<StepId>("resume");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [resumeText, setResumeText] = useState("");
  const [parsedResumeJson, setParsedResumeJson] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationWarning, setGenerationWarning] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<ResumeGenerationResult | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("template-classic");
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [docxGenerating, setDocxGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const resumePreviewRef = useRef<HTMLDivElement | null>(null);

  const templates = useMemo(
    () => [
      {
        id: "template-classic",
        label: "Classic",
        description: "Single-column ATS layout",
        Component: TemplateClassic,
      },
      {
        id: "template-split",
        label: "Split",
        description: "Two-column layout",
        Component: TemplateSplit,
      },
    ],
    []
  );

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || templates[0];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setResumeError("Please upload a PDF resume.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setResumeError("File size exceeds 10MB limit.");
      return;
    }

    setIsExtracting(true);
    setResumeError(null);
    setUploadedFileName(file.name);

    try {
      const parsed = await extractResumeData(file);
      console.log('[DEBUG] Parsed data from PDF:', JSON.stringify(parsed, null, 2));

      // Store the parsed JSON directly
      setParsedResumeJson(parsed.resumeJson || null);

      const text = extractTextFromParsed(parsed);
      setResumeText(text);
      if (!text.trim()) {
        setResumeError("We could not extract text from this PDF. Please paste your resume text.");
      }
    } catch (error: any) {
      setResumeError(error?.message || "Failed to extract resume text.");
    } finally {
      setIsExtracting(false);
      event.target.value = "";
    }
  };

  const handleContinue = async () => {
    const trimmedResume = resumeText.trim();
    if (!trimmedResume) {
      if (uploadedFileName) {
        setResumeError("We could not extract text from your PDF. Please paste your resume text.");
      } else {
        setResumeError("Upload a PDF or paste your resume text to continue.");
      }
      return;
    }
    setResumeError(null);
    await handleGenerate();
  };

  const handleGenerate = async () => {
    setGenerationError(null);
    setGenerationWarning(null);
    setIsGenerating(true);
    setStep("generate");

    try {
      let result: ResumeGenerationResult;

      // If we have parsed JSON, use it directly. Otherwise fall back to text parsing.
      if (parsedResumeJson) {
        console.log('[DEBUG] Using pre-parsed resumeJson:', JSON.stringify(parsedResumeJson, null, 2));

        // Use the already-parsed data directly - no re-parsing needed
        result = {
          resume: parsedResumeJson,
          report: {
            matchEstimate: 100,
            keywordsAdded: [],
            keywordsMissing: [],
            changes: []
          },
          meta: { source: 'direct-parse', reason: 'Using pre-parsed data from PDF extraction' }
        };

        console.log('[DEBUG] Direct Resume Result:', JSON.stringify(parsedResumeJson, null, 2));
      } else {
        // Fallback: Clean resume text before sending to AI
        const cleanedResumeText = resumeText
          .split('\n')
          .reduce((acc: string[], line: string) => {
            const trimmed = line.trim();
            // Skip duplicate section headers (if same header appears twice in a row with only blank lines between)
            if (trimmed && /^(PROFESSIONAL SUMMARY|SKILLS|EXPERIENCE|EDUCATION|PROJECTS|COMMUNITY)$/i.test(trimmed)) {
              // Check if we already added this header recently (within last 3 lines)
              const recentLines = acc.slice(-3);
              if (recentLines.some(l => l.trim() === trimmed)) {
                return acc; // Skip duplicate header
              }
            }
            acc.push(line);
            return acc;
          }, [])
          .join('\n');

        console.log('[DEBUG] Cleaned resume text:', cleanedResumeText);

        result = await generateJobSpecificResume({
          resumeText: cleanedResumeText,
          jobDescription: "",
        });

        console.log('[DEBUG] AI Resume Result:', JSON.stringify(result.resume, null, 2));
      }

      // Validate at the boundary - fail loudly if invalid
      const validation = validateResumeJson(result.resume);
      if (!validation.valid) {
        console.error('[VALIDATION FAILED]', validation.errors);
        throw new Error(`Invalid resume data: ${validation.errors.join(", ")}`);
      }

      setGenerationResult(result);
      const flags = result.report?.flags || [];
      if (flags.includes("experience_unparsed")) {
        setGenerationWarning(
          "We could not fully structure your experience section."
        );
      }
      setSelectedTemplateId("template-classic");
      setStep("results");
    } catch (error: any) {
      setGenerationError(error?.message || "Failed to generate resume.");
      setStep("resume");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resumePreviewRef.current || !generationResult || pdfGenerating) return;

    try {
      setPdfGenerating(true);
      const element = resumePreviewRef.current;

      let stylesheets = "";
      const styleElements = Array.from(document.querySelectorAll("style"));
      styleElements.forEach((style) => {
        stylesheets += style.textContent + "\n";
      });

      const linkElements = Array.from(
        document.querySelectorAll("link[rel=\"stylesheet\"]")
      );
      for (const link of linkElements) {
        const href = (link as HTMLLinkElement).href;
        if (href) stylesheets += `@import url('${href}');\n`;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head><meta charset=\"UTF-8\"><style>${stylesheets}</style></head>
          <body>${element.outerHTML}</body>
        </html>
      `;

      const response = await fetch(buildApiUrl("generate-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          options: {
            format: "Letter",
            printBackground: true,
            preferCSSPageSize: true,
            margin: "0in",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("PDF generation failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const name = generationResult.resume.basics.name || "resume";
      link.href = url;
      link.download = `${sanitizeFilename(name)}-job-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
      setGenerationError("Failed to generate PDF.");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!generationResult || docxGenerating) return;
    try {
      setDocxGenerating(true);
      const name = generationResult.resume.basics.name || "resume";
      await exportResumeDocx(
        generationResult.resume,
        `${sanitizeFilename(name)}-job-resume.docx`,
        selectedTemplateId === "template-split" ? "split" : "classic"
      );
    } catch (error) {
      console.error("DOCX generation error:", error);
      setGenerationError("Failed to generate DOCX.");
    } finally {
      setDocxGenerating(false);
    }
  };

  // Handle direct JSON edits - no parsing, just update state
  const handleResumeChange = (updatedResume: ResumeJSON) => {
    setGenerationResult((prev) =>
      prev ? { ...prev, resume: updatedResume } : prev
    );
  };

  const renderStepContent = () => {
    if (step === "resume") {
      return (
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-neutral-900">
                Create a New Resume
              </h1>
              <p className="text-neutral-500 text-lg">
                Upload your existing resume and generate a clean, ATS-ready resume
                in minutes.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={inputMode === "upload" ? "default" : "outline"}
                  onClick={() => setInputMode("upload")}
                  className={
                    inputMode === "upload"
                      ? lightButtonClasses.primary
                      : lightButtonClasses.outline
                  }
                >
                  Upload PDF
                </Button>
                <Button
                  variant={inputMode === "paste" ? "default" : "outline"}
                  onClick={() => setInputMode("paste")}
                  className={
                    inputMode === "paste"
                      ? lightButtonClasses.primary
                      : lightButtonClasses.outline
                  }
                >
                  Paste Resume Text
                </Button>
              </div>

              {inputMode === "upload" && (
                <div className="mt-6">
                  <label className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-neutral-200 rounded-2xl cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-all">
                    <div className="text-neutral-700 text-sm font-semibold mb-2">
                      Drop your PDF resume here
                    </div>
                    <p className="text-neutral-500 text-xs">PDF up to 10MB</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={isExtracting}
                    />
                  </label>
                  {uploadedFileName && (
                    <div className="mt-3 text-neutral-500 text-xs">
                      Selected: {uploadedFileName}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Resume Text (Optional if PDF is uploaded)
                </label>
                <textarea
                  value={resumeText}
                  onChange={(event) => {
                    setResumeText(event.target.value);
                    // Clear parsed JSON when user manually edits text
                    if (parsedResumeJson) {
                      setParsedResumeJson(null);
                    }
                  }}
                  placeholder="Paste your resume text here (optional if PDF is uploaded)..."
                  className="mt-2 h-56 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              {isExtracting && (
                <div className="mt-3 text-sm text-neutral-500">
                  Extracting resume content...
                </div>
              )}

              {resumeError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {resumeError}
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <div className="text-xs text-neutral-400">
                  We only use your existing information. No new facts are added.
                </div>
                <Button
                  onClick={handleContinue}
                  className={lightButtonClasses.primary}
                  disabled={isExtracting || isGenerating}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="text-lg font-semibold text-neutral-900">
              How it works
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-neutral-600">
              <li>Upload your existing resume or paste the text.</li>
              <li>We format your resume into ATS-ready templates.</li>
              <li>Download ATS-ready templates instantly.</li>
            </ul>
          </div>
        </div>
      );
    }

    if (step === "generate") {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="h-10 w-10 rounded-full border-4 border-neutral-200 border-t-neutral-900"
          />
          <h2 className="mt-6 text-2xl font-semibold text-neutral-900">
            Generating your resume
          </h2>
          <p className="mt-3 text-neutral-500">
            We are formatting and refining your resume. This usually takes less
            than a minute.
          </p>
        </div>
      );
    }

    if (step === "results" && generationResult) {
      const resume = generationResult.resume as ResumeJSON;
      const report = generationResult.report || {
        matchEstimate: 0,
        keywordsAdded: [],
        keywordsMissing: [],
        changes: [],
      };
      const needsExperienceReview = !resume.experience || resume.experience.length === 0;
      const needsEducationReview = !resume.education || resume.education.length === 0;
      const needsProjectsReview = !resume.projects || resume.projects.length === 0;
      const needsCertReview = !resume.certifications || resume.certifications.length === 0;
      const needsSkillsReview = !resume.skills || resume.skills.length === 0;
      const SelectedTemplate = selectedTemplate.Component;

      return (
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900">
                    Your Resume
                  </h2>
                  <p className="text-neutral-500 text-sm">
                    Switch templates instantly and download in PDF or DOCX.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleDownloadPdf}
                    className={lightButtonClasses.primary}
                    disabled={pdfGenerating}
                  >
                    {pdfGenerating ? "Generating PDF..." : "Download PDF"}
                  </Button>
                  <Button
                    onClick={handleDownloadDocx}
                    className={lightButtonClasses.outline}
                    disabled={docxGenerating}
                  >
                    {docxGenerating ? "Generating DOCX..." : "Download DOCX"}
                  </Button>
                </div>
              </div>

              {generationWarning && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  {generationWarning}
                </div>
              )}

              {needsExperienceReview && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Experience section could not be fully structured. Consider uploading a cleaner resume.
                </div>
              )}

              {(needsSkillsReview || needsEducationReview || needsProjectsReview || needsCertReview) && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  Some sections may need review. Check the preview for accuracy.
                </div>
              )}

              {generationError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {generationError}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <TemplateSwitcher
                  templates={templates.map(({ id, label, description }) => ({
                    id,
                    label,
                    description,
                  }))}
                  selectedId={selectedTemplateId}
                  onSelect={setSelectedTemplateId}
                />
                <Button
                  onClick={() => setShowEditor(!showEditor)}
                  className={lightButtonClasses.outline}
                >
                  {showEditor ? "Hide Editor" : "Edit Resume"}
                </Button>
              </div>

              {showEditor && (
                <div className="mt-6 max-h-[600px] overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <ResumeEditor resume={resume} onChange={handleResumeChange} />
                </div>
              )}

              <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                <div ref={resumePreviewRef} className="resume-content">
                  <SelectedTemplate resume={resume} />
                </div>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">
                Match Estimate
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                This is an estimate, not an official ATS score.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="text-3xl font-semibold text-neutral-900">
                  {report.matchEstimate}%
                </div>
                <div className="h-2 flex-1 rounded-full bg-neutral-100">
                  <div
                    className="h-2 rounded-full bg-neutral-900"
                    style={{ width: `${Math.min(100, report.matchEstimate)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">
                Keyword Alignment
              </h3>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-neutral-700">Keywords added</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {report.keywordsAdded.length ? (
                      report.keywordsAdded.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-400">None detected.</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-neutral-700">
                    Missing keywords (consider adding if true)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {report.keywordsMissing.length ? (
                      report.keywordsMissing.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-neutral-400">None detected.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">
                What Changed
              </h3>
              <div className="mt-4 space-y-4 text-sm">
                {report.changes.slice(0, 10).map((change, index) => (
                  <div key={`${change.section}-${index}`} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                    <div className="text-xs font-semibold uppercase text-neutral-500">
                      {change.section}
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-neutral-400">Before</p>
                      <p className="text-neutral-700">{change.before}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-neutral-400">After</p>
                      <p className="text-neutral-700">{change.after}</p>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      {change.reason}
                    </p>
                  </div>
                ))}
                {report.changes.length === 0 && (
                  <p className="text-neutral-400">No change report available.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <Button
                variant="outline"
                onClick={() => setStep("resume")}
                className={lightButtonClasses.outline}
              >
                Start another resume
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <BackgroundRippleLayout
      tone="light"
      className="bg-white"
      contentClassName="resume-optimizer pt-16"
    >
      <Navbar tone="light" />
      <div className="px-4 pb-20 pt-24">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((item, index) => {
              const isActive = item.id === step;
              const isCompleted = steps.findIndex((stepItem) => stepItem.id === step) > index;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 text-sm ${isActive
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-neutral-200 bg-white text-neutral-500"
                    }`}
                >
                  <div className="text-xs font-semibold uppercase">
                    Step {index + 1}
                  </div>
                  <div className="mt-2 font-semibold">{item.label}</div>
                  <div className="mt-1 text-xs opacity-80">{item.description}</div>
                </div>
              );
            })}
          </div>

          {renderStepContent()}
        </div>
      </div>
    </BackgroundRippleLayout>
  );
};
