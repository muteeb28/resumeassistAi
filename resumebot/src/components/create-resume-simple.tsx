"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "./navbar";
import { BackgroundRippleLayout } from "./background-ripple-layout";
import { Button } from "./button";
import TemplatePreview from "./resume-optimizer/TemplatePreview";
import FinalResumePreview from "./resume-optimizer/FinalResumePreview";
import { buildApiUrl, extractResumeData, parseResumeText, polishResumeText } from "../services/resumeOptimizerApi";
import { useUserStore } from '../stores/useUserStore'

type Step = "input" | "templates" | "preview";
type InputMode = "upload" | "paste";

interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  style: string;
}

const resumeTemplates: ResumeTemplate[] = [
  {
    id: "senior-modern",
    name: "Senior Modern",
    description: "Executive-ready layout for leadership roles.",
    style: "senior-modern"
  },
  {
    id: "concise-classic",
    name: "Concise Classic",
    description: "ATS-friendly layout for clear, focused resumes.",
    style: "concise-classic"
  }
];

const sanitizeFilename = (name: string) => name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
const toPixels = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return 0;
  if (trimmed.endsWith("in")) return numeric * 96;
  if (trimmed.endsWith("cm")) return numeric * 37.7952755906;
  if (trimmed.endsWith("mm")) return numeric * 3.77952755906;
  if (trimmed.endsWith("px")) return numeric;
  return numeric;
};

const toStringList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item: any) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "object") {
    return Object.values(value).flatMap((item: any) => toStringList(item));
  }
  return [];
};

const toArray = (value: any) => (Array.isArray(value) ? value.filter(Boolean) : []);

const countBullets = (entries: any[]) => {
  if (!Array.isArray(entries)) return 0;
  return entries.reduce((total, entry) => {
    if (!entry) return total;
    const description = entry.description ?? entry.points ?? entry.bullets ?? entry.responsibilities ?? [];
    if (Array.isArray(description)) {
      return total + description.filter((item: any) => String(item).trim()).length;
    }
    if (typeof description === "string") {
      return total + description.split(/\n|\u2022/).map((item) => item.trim()).filter(Boolean).length;
    }
    return total;
  }, 0);
};

const chooseText = (original: string | undefined, polished: string | undefined, ratio = 0.7) => {
  const originalText = typeof original === "string" ? original.trim() : "";
  const polishedText = typeof polished === "string" ? polished.trim() : "";
  if (!originalText) return polishedText || "";
  if (!polishedText) return originalText;
  return polishedText.length >= Math.ceil(originalText.length * ratio) ? polishedText : originalText;
};

const chooseList = (original: any, polished: any, ratio = 0.7) => {
  const originalList = toArray(original);
  const polishedList = toArray(polished);
  if (originalList.length === 0) return polishedList;
  if (polishedList.length === 0) return originalList;
  return polishedList.length >= Math.ceil(originalList.length * ratio) ? polishedList : originalList;
};

const chooseExperience = (original: any, polished: any) => {
  const originalList = toArray(original);
  const polishedList = toArray(polished);
  if (originalList.length === 0) return polishedList;
  if (polishedList.length === 0) return originalList;

  const originalBullets = countBullets(originalList);
  const polishedBullets = countBullets(polishedList);
  const entriesOk = polishedList.length >= Math.ceil(originalList.length * 0.7);
  const bulletsOk = originalBullets === 0 || polishedBullets >= Math.ceil(originalBullets * 0.7);

  return entriesOk && bulletsOk ? polishedList : originalList;
};

const mergeParsedResume = (original: any, polished: any) => {
  if (!polished || typeof polished !== "object") return original;
  const merged = { ...original };
  const originalContact = original?.contact || {};
  const polishedContact = polished?.contact || {};

  merged.name = original?.name || polished?.name || "";
  merged.contact = { ...polishedContact, ...originalContact };
  merged.summary = chooseText(original?.summary, polished?.summary);
  merged.skills = chooseList(original?.skills, polished?.skills);
  merged.experience = chooseExperience(original?.experience, polished?.experience);
  merged.education = chooseList(original?.education, polished?.education, 0.6);
  merged.projects = chooseList(original?.projects, polished?.projects, 0.6);
  merged.certifications = chooseList(original?.certifications, polished?.certifications, 0.6);
  merged.structure = original?.structure || polished?.structure;
  merged.formatInfo = original?.formatInfo || polished?.formatInfo;

  return merged;
};

const buildEditableTextFromParsed = (data: any): string => {
  if (!data || typeof data !== "object") return "";
  const content = data.fullContent || data.layout || data;
  const contactSource = content.contact || content.personalInfo || content.contactInfo || {};
  const lines: string[] = [];

  const name = content.name || contactSource.name;
  if (name) {
    lines.push(String(name));
  }

  const contactParts: string[] = [];
  if (contactSource.email) contactParts.push(String(contactSource.email));
  if (contactSource.phone) contactParts.push(String(contactSource.phone));
  if (contactSource.location) contactParts.push(String(contactSource.location));
  if (contactSource.linkedin) contactParts.push(`LinkedIn: ${contactSource.linkedin}`);
  if (contactSource.github) contactParts.push(`GitHub: ${contactSource.github}`);
  const website = contactSource.website || contactSource.portfolio;
  if (website) contactParts.push(`Portfolio: ${website}`);
  if (Array.isArray(contactSource.links)) {
    contactSource.links.forEach((link: any) => {
      if (!link) return;
      if (typeof link === "string") {
        contactParts.push(link);
        return;
      }
      if (typeof link === "object") {
        const label = typeof link.label === "string"
          ? link.label
          : typeof link.type === "string"
            ? link.type
            : "";
        const url = link.url || link.href || link.link;
        if (typeof url === "string" && label) {
          contactParts.push(`${label}: ${url}`);
          return;
        }
        if (typeof url === "string") {
          contactParts.push(url);
          return;
        }
        if (label) {
          contactParts.push(label);
        }
      }
    });
  }
  if (contactParts.length) {
    lines.push(contactParts.join(" | "));
  }

  const summary = content.summary || content.professionalSummary || content.profile || content.objective;
  if (summary) {
    lines.push("", "PROFESSIONAL SUMMARY", String(summary));
  }

  const skills = toStringList(content.skills);
  const fallbackSkills = skills.length > 0 ? skills : toStringList(content.coreSkills || content.skillset || content.skillSet);
  if (fallbackSkills.length > 0) {
    lines.push("", "SKILLS", fallbackSkills.join(", "));
  }

  const experience = Array.isArray(content.experience) ? content.experience : [];
  if (experience.length > 0) {
    lines.push("", "EXPERIENCE");
    experience.forEach((exp: any) => {
      if (!exp) return;
      const headerParts = [
        exp.title || exp.position || exp.role,
        exp.company || exp.employer || exp.organization,
        exp.dates || exp.duration || exp.date
      ].filter(Boolean);
      if (headerParts.length > 0) {
        lines.push(headerParts.join(" | "));
      }
      const description = exp.description ?? exp.points ?? exp.bullets ?? exp.responsibilities ?? [];
      const bullets = Array.isArray(description)
        ? description
        : typeof description === "string"
          ? description.split("\n")
          : [];
      bullets
        .map((item: any) => String(item).trim())
        .filter(Boolean)
        .forEach((item: string) => lines.push(`- ${item}`));
      lines.push("");
    });
  }

  const education = Array.isArray(content.education) ? content.education : [];
  if (education.length > 0) {
    lines.push("", "EDUCATION");
    education.forEach((edu: any) => {
      if (!edu) return;
      const parts = [
        edu.degree,
        edu.institution || edu.university || edu.school,
        edu.year || edu.dates || edu.graduation
      ].filter(Boolean);
      if (parts.length > 0) {
        lines.push(parts.join(" | "));
      }
    });
  }

  const projects = Array.isArray(content.projects) ? content.projects : [];
  if (projects.length > 0) {
    lines.push("", "PROJECTS");
    projects.forEach((project: any) => {
      if (!project) return;
      if (typeof project === "string") {
        lines.push(project);
        return;
      }
      const title = project.name || project.title;
      const description = project.description || project.summary;
      if (title && description) {
        lines.push(`${title}: ${description}`);
      } else if (title) {
        lines.push(title);
      } else if (description) {
        lines.push(description);
      }
      const technologies = toStringList(project.technologies || project.techStack || project.stack);
      if (technologies.length > 0) {
        lines.push(`Tech: ${technologies.join(", ")}`);
      }
    });
  }

  const certifications = Array.isArray(content.certifications)
    ? content.certifications
    : toStringList(content.certifications);
  if (certifications.length > 0) {
    lines.push("", "CERTIFICATIONS");
    certifications.forEach((cert: any) => {
      if (!cert) return;
      const label = typeof cert === "string" ? cert : cert.name || cert.title || String(cert);
      if (label) {
        lines.push(`- ${label}`);
      }
    });
  }

  return lines
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const CreateResumeSimple = () => {
  const [step, setStep] = useState<Step>("input");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [parsedResume, setParsedResume] = useState<any | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfGenerationType, setPdfGenerationType] = useState("");
  const [previewScale, setPreviewScale] = useState(1);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const resumeContentRef = useRef<HTMLDivElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const { } = useUserStore();

  const resetFlow = () => {
    setStep("input");
    setInputMode("upload");
    setIsParsing(false);
    setParseError(null);
    setResumeText("");
    setParsedResume(null);
    setSelectedTemplate(null);
    setUploadedFileName(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setParseError("Please upload a PDF resume.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setParseError("File size exceeds 10MB limit.");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setUploadedFileName(file.name);

    try {
      const parsed = await extractResumeData(file);
      setParsedResume(parsed);
      setStep("templates");
    } catch (error: any) {
      setParseError(error?.message || "Failed to parse resume.");
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  const handlePasteSubmit = async () => {
    const trimmed = resumeText.trim();
    if (!trimmed) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const originalParsed = await parseResumeText(trimmed);
      let mergedParsed = originalParsed;

      try {
        const polishedText = await polishResumeText(trimmed);
        const polishedParsed = await parseResumeText(polishedText);
        mergedParsed = mergeParsedResume(originalParsed, polishedParsed);
        setResumeText(buildEditableTextFromParsed(mergedParsed));
      } catch (polishError) {
        console.warn("Resume polish failed, using original text:", polishError);
        setResumeText(buildEditableTextFromParsed(originalParsed));
      }

      setParsedResume(mergedParsed);
      setStep("templates");
    } catch (error: any) {
      setParseError(error?.message || "Failed to parse resume.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleTemplateSelect = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    setStep("preview");
  };

  const buildTemplatePayload = (template: ResumeTemplate, data: any) => ({
    ...data,
    style: template.style,
    templateName: template.name
  });

  const previewData = selectedTemplate && parsedResume
    ? buildTemplatePayload(selectedTemplate, parsedResume)
    : null;

  useEffect(() => {
    if (step !== "preview" || !previewData) return;
    const element = resumeContentRef.current;
    if (!element) return;

    const measure = () => {
      const contentHeight = element.scrollHeight;
      const contentWidth = element.scrollWidth;
      if (contentHeight <= 0 || contentWidth <= 0) return;

      const containerWidth = previewContainerRef.current?.clientWidth || contentWidth;
      const widthScale = containerWidth > 0 ? Math.min(1, containerWidth / contentWidth) : 1;
      const nextScale = Number(widthScale.toFixed(3));

      setPreviewScale(nextScale);
      setPreviewSize({
        width: contentWidth * nextScale,
        height: contentHeight * nextScale
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [step, previewData]);

  const handleEditContent = () => {
    setStep("input");
    setInputMode("paste");
    setParseError(null);
    setIsParsing(false);
    setSelectedTemplate(null);
    if (!resumeText.trim()) {
      setResumeText(buildEditableTextFromParsed(parsedResume));
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewData || pdfGenerating) return;
    const element = document.getElementById("resume-content");
    if (!element) return;

    try {
      setPdfGenerating(true);
      setPdfGenerationType("Generating PDF...");

      const styles = window.getComputedStyle(element);
      const pageHeightValue = styles.getPropertyValue("--resume-page-height");
      const pageHeight = toPixels(pageHeightValue) || 1056;
      const contentHeight = element.scrollHeight;
      const estimatedPages = pageHeight > 0 ? Math.ceil(contentHeight / pageHeight) : 1;
      const resolvedTargetPageCount = Math.max(1, estimatedPages);

      let stylesheets = "";
      const styleElements = Array.from(document.querySelectorAll("style"));
      styleElements.forEach((style) => { stylesheets += style.textContent + "\n"; });

      const linkElements = Array.from(document.querySelectorAll("link[rel=\"stylesheet\"]"));
      for (const link of linkElements) {
        try {
          const href = (link as HTMLLinkElement).href;
          if (href) stylesheets += `@import url('${href}');\n`;
        } catch (e) { }
      }

      const printOptimizations = `
        @page { size: Letter; margin: 0; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; padding: 0; }
        .resume-content { page-break-inside: auto !important; }
        .resume-page {
          width: var(--resume-page-width, 8.5in);
          min-height: var(--resume-page-height, 11in);
          padding: var(--resume-page-padding, 0.5in);
          box-sizing: border-box;
          background: #ffffff;
        }
      `;

      const html = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><style>${stylesheets}${printOptimizations}</style></head>
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
            fitToPage: true,
            targetPageCount: resolvedTargetPageCount
          }
        })
      });

      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const templateName = selectedTemplate?.name || "resume";
      a.href = url;
      a.download = `${sanitizeFilename(templateName)}-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF.");
    } finally {
      setPdfGenerating(false);
      setPdfGenerationType("");
    }
  };



  return (
    <BackgroundRippleLayout tone="dark" contentClassName="resume-optimizer pt-16">
      <Navbar />
      <div className="pt-16 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {step === "input" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Import or Paste Your Resume
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
                Upload a PDF or paste your resume content. We will fill the template
                with your actual data.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Button
                  variant={inputMode === "upload" ? "default" : "outline"}
                  onClick={() => setInputMode("upload")}
                >
                  Import PDF
                </Button>
                <Button
                  variant={inputMode === "paste" ? "default" : "outline"}
                  onClick={() => setInputMode("paste")}
                >
                  Paste Content
                </Button>
              </div>

              {inputMode === "upload" ? (
                <div className="max-w-xl mx-auto">
                  <label className="group relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                    <div className="text-slate-300 text-lg font-semibold mb-2">
                      Drop your PDF resume here
                    </div>
                    <p className="text-slate-500 text-sm">PDF up to 10MB</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={isParsing}
                    />
                  </label>
                  {uploadedFileName && (
                    <div className="mt-4 text-slate-400 text-sm">
                      Selected: {uploadedFileName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume content here..."
                    className="w-full h-64 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/10 resize-none"
                  />
                  <Button
                    onClick={handlePasteSubmit}
                    disabled={!resumeText.trim() || isParsing}
                    size="lg"
                  >
                    {isParsing ? (inputMode === "paste" ? "Polishing..." : "Parsing...") : "Continue"}
                  </Button>
                </div>
              )}

              {isParsing && (
                <div className="mt-6 text-slate-400 text-sm">
                  {inputMode === "paste" ? "Polishing your resume..." : "Parsing your resume..."}
                </div>
              )}

              {parseError && (
                <div className="mt-6 max-w-xl mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400">
                  {parseError}
                </div>
              )}
            </motion.div>
          )}

          {step === "templates" && parsedResume && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Choose Your Resume Template
                </h2>
                <p className="text-slate-400 text-lg">
                  Preview your content in each layout before selecting.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {resumeTemplates.map((template, index) => (
                  <motion.button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-left bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    <div className="mb-6">
                      <TemplatePreview
                        template={{
                          content: buildTemplatePayload(template, parsedResume),
                          style: template.style,
                          name: template.name
                        }}
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-slate-400">{template.description}</p>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center mt-10">
                <Button variant="outline" onClick={resetFlow}>
                  Start Over
                </Button>
              </div>
            </motion.div>
          )}

          {step === "preview" && previewData && selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    Final Preview
                  </h2>
                  <p className="text-slate-400">
                    {selectedTemplate.name} template with your content.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" onClick={() => setStep("templates")}>
                    Change Template
                  </Button>
                  <Button variant="outline" onClick={handleEditContent}>
                    Edit Content
                  </Button>
                  <Button onClick={handleDownloadPdf} disabled={pdfGenerating}>
                    {pdfGenerating ? (pdfGenerationType || "Generating...") : "Download PDF"}
                  </Button>
                  <Button variant="outline" onClick={resetFlow}>
                    Start Over
                  </Button>
                </div>
              </div>

              <div ref={previewContainerRef} className="bg-white rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border-[10px] border-slate-950">
                <div className="flex justify-center">
                  <div style={previewSize ? { width: previewSize.width, height: previewSize.height } : undefined}>
                    <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
                      <div id="resume-content" ref={resumeContentRef} className="resume-content">
                        <FinalResumePreview data={previewData} mode="multi" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </BackgroundRippleLayout>
  );
};
