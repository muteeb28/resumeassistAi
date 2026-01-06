import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before importing other modules
dotenv.config({ path: join(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import {connectDB} from "./db/db.js";
import cookieParser from 'cookie-parser';

connectDB();

// Import our ENHANCED services AFTER dotenv is configured
import { optimizeResumeWithPagePreservation } from './services/enhancedResumeOptimizer.js';
import { extractTextFromFileWithStructure, extractTextFromFile, cleanExtractedText } from './services/enhancedFileProcessor.js';
import { parseResumeWithStructure } from './services/enhancedResumeParser.js';
import { parseResumeToStructuredJSON } from './services/advancedResumeParser.js';
import { generatePDF, generatePDFFromURL } from './services/pdfGenerator.js';
import { initiatePayment } from './services/initiatePayment.js';
import { polishResumeText } from './services/kimiResumePolisher.js';
// Import NEW ATS Optimizer
import { optimizeResumeForATS } from './services/atsResumeOptimizer.js';

// controllers
import { authProfile, createUser, login } from "./controller/user.controller.js";

const app = express();
const PORT = process.env.PORT || 3007;

// plugins
app.use(cookieParser());

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const targetRolesPath = join(__dirname, 'config', 'targetRoles.json');
let targetRoles = [];
try {
  const rolesContent = fs.readFileSync(targetRolesPath, 'utf-8');
  targetRoles = JSON.parse(rolesContent);
} catch (error) {
  console.warn('Warning: Could not load target roles config:', error.message);
  targetRoles = [];
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  }
});

// Middleware
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Resume Optimizer API',
    version: '2.0.0',
    endpoints: {
      health: 'GET /api/health',
      optimizeResume: 'POST /api/optimize-resume',
      optimizeResumeStream: 'POST /api/optimize-resume-stream',
      atsOptimize: 'POST /api/ats-optimize',
      targetRoles: 'GET /api/target-roles',
      generatePdf: 'POST /api/generate-pdf'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Resume Optimizer API is running',
    timestamp: new Date().toISOString()
  });
});

app.post("/api/user/create", createUser);
app.post("/api/user/login", login);
app.get("/api/user/profile", authProfile);

// Resume extraction endpoint (non-AI, for front-end preview/compact payloads)
app.post('/api/extract-resume', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Resume file is required'
      });
    }

    const extractionResult = await extractTextFromFileWithStructure(file.path, file.mimetype);
    let parsed = null;
    let advancedParsed = null;
    let enhancedParsed = null;

    try {
      advancedParsed = parseResumeToStructuredJSON(extractionResult.text);
    } catch (parseError) {
      console.warn('Advanced parser failed:', parseError.message);
    }

    try {
      enhancedParsed = parseResumeWithStructure(extractionResult.text, extractionResult.structure);
    } catch (parseError) {
      console.warn('Enhanced parser failed:', parseError.message);
    }

      const selection = pickRicherParsedPayload(advancedParsed, enhancedParsed);
      parsed = mergeParsedPayloads(selection.payload || advancedParsed || enhancedParsed, advancedParsed, enhancedParsed);

    if (!parsed) {
      throw new Error('Unable to parse resume content');
    }

    parsed.structure = extractionResult.structure;
    if (!parsed.formatInfo) {
      parsed.formatInfo = {};
    }
    if (!parsed.formatInfo.originalPageCount) {
      parsed.formatInfo.originalPageCount = extractionResult.structure?.originalPageCount || extractionResult.pageCount || 1;
    }
    if (!parsed.formatInfo.estimatedPageCount && extractionResult.structure?.estimatedPageCount) {
      parsed.formatInfo.estimatedPageCount = extractionResult.structure.estimatedPageCount;
    }

    try {
      fs.unlinkSync(file.path);
    } catch (cleanupError) {
      console.warn('Warning: Could not delete uploaded file:', cleanupError.message);
    }

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    console.error('Resume extraction error:', error);

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not delete uploaded file after error:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract resume'
    });
  }
});

const normalizePastedResumeText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      let value = line.trim();
      if (!value) return '';
      value = value.replace(/^#{1,6}\s*/, '');
      value = value.replace(/^>\s*/, '');
      value = value.replace(/\*\*([^*]+)\*\*/g, '$1');
      value = value.replace(/__([^_]+)__/g, '$1');
      value = value.replace(/`([^`]+)`/g, '$1');
      value = value.replace(/:\s*$/, '');
      value = value.replace(/\s*\|\s*/g, ' | ');
      value = value.replace(/\s{2,}/g, ' ');
      return value.trim();
    })
    .join('\n');
};

const buildSectionMatcher = () => {
  const sections = {
    summary: [
      'summary',
      'professional summary',
      'executive summary',
      'profile',
      'professional profile',
      'objective',
      'about',
      'career summary',
      'summary statement'
    ],
    experience: [
      'experience',
      'work experience',
      'professional experience',
      'employment',
      'work history',
      'employment history',
      'career history'
    ],
    skills: [
      'skills',
      'technical skills',
      'core skills',
      'core competencies',
      'competencies',
      'technical expertise',
      'technologies',
      'tech stack'
    ],
    education: [
      'education',
      'academics',
      'academic background',
      'education & training',
      'qualifications'
    ],
    projects: [
      'projects',
      'project',
      'portfolio',
      'key projects',
      'notable projects',
      'personal projects',
      'side projects'
    ],
    certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
    awards: ['awards', 'honors', 'achievements', 'recognition'],
    publications: ['publications', 'papers', 'articles'],
    languages: ['languages', 'language']
  };

  const matchSection = (line) => {
    const normalized = line
      .replace(/^[#>\-\*\+\s]+/, '')
      .replace(/[*_`]+/g, '')
      .replace(/:\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (!normalized) return null;

    for (const [section, aliases] of Object.entries(sections)) {
      if (aliases.includes(normalized)) {
        return section;
      }
    }

    return null;
  };

  return matchSection;
};

const parsePastedResumeText = (text, structure) => {
  const normalizedText = normalizePastedResumeText(text);
  const matchSection = buildSectionMatcher();
  const sections = {
    header: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    projects: [],
    certifications: [],
    awards: [],
    publications: [],
    languages: [],
    other: []
  };

  let currentSection = 'header';
  normalizedText.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      sections[currentSection].push('');
      return;
    }
    const matched = matchSection(trimmed);
    if (matched) {
      currentSection = matched;
      return;
    }
    sections[currentSection].push(trimmed);
  });

  const fullText = normalizedText;
  const emailMatch = fullText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : null;

  const phoneCandidates = fullText.match(/\+?\d[\d\s().-]{7,}\d/g) || [];
  const phone = phoneCandidates.find((candidate) => {
    const digits = candidate.replace(/\D/g, '');
    return digits.length >= 9 && digits.length <= 15;
  }) || null;

  const extractLabeledValue = (label) => {
    const regex = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n|]+)`, 'i');
    const match = fullText.match(regex);
    return match ? match[1].trim() : null;
  };

  const linkedInMatch = fullText.match(/(linkedin\.com\/in\/[^\s|]+)/i);
  const linkedin = linkedInMatch ? linkedInMatch[1] : extractLabeledValue('linkedin');

  const githubMatch = fullText.match(/(github\.com\/[^\s|]+)/i);
  const github = githubMatch ? githubMatch[1] : extractLabeledValue('github');

  const websiteMatch = fullText.match(/https?:\/\/[^\s|]+/i);
  const website = websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')
    ? websiteMatch[0]
    : extractLabeledValue('portfolio') || extractLabeledValue('website');

  const headerLines = sections.header.filter((line) => line && !line.includes('@') && !/linkedin|github|portfolio|website/i.test(line));
  const nameCandidate = headerLines.find((line) => !/\d/.test(line) && line.length <= 60) || '';
  const name = nameCandidate.replace(/[*_`#]+/g, '').trim();

  const locationLine = sections.header.find((line) => /location/i.test(line)) ||
    sections.header.find((line) => line.includes(',') && !line.includes('@') && !/linkedin|github|portfolio|website/i.test(line));
  const location = locationLine ? locationLine.replace(/^(location\s*[:\-]\s*)/i, '').trim() : null;

  const summary = sections.summary
    .map((line) => line.replace(/^[\-\*\u2022]+\s*/, '').trim())
    .filter(Boolean)
    .join(' ');

  const splitToItems = (value) => {
    return value
      .split(/[,\|/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const skills = [];
  sections.skills.forEach((line) => {
    if (!line) return;
    const cleaned = line.replace(/^[\-\*\u2022]+\s*/, '').trim();
    if (!cleaned) return;
    if (cleaned.includes(':')) {
      const [, rest] = cleaned.split(/:\s*/);
      if (rest) {
        skills.push(...splitToItems(rest));
      }
      return;
    }
    if (cleaned.includes(',') || cleaned.includes('|') || cleaned.includes('/')) {
      skills.push(...splitToItems(cleaned));
      return;
    }
    skills.push(cleaned);
  });

  const dedupe = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const parseExperienceBlocks = (lines) => {
    const experience = [];
    const titlePattern = /(engineer|developer|manager|lead|director|analyst|designer|consultant|specialist|architect|founder|owner|intern|associate|executive|officer|product|marketing|sales|accountant|hr|recruiter|manager)/i;
    const datePattern = /\b(19|20)\d{2}\b|\b(present|current)\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i;
    const bulletPattern = /^[\-\*\u2022]+\s+/;
    const headerSeparatorPattern = /\s*\|\s*|\s[-–—]\s/;

    const isLikelyTitle = (value) => {
      if (!value) return false;
      const wordCount = value.split(/\s+/).length;
      if (wordCount > 8) return false;
      return titlePattern.test(value) || /^[A-Z][A-Za-z&/.\s]+$/.test(value);
    };

    const parseHeaderLine = (line, pendingTitle) => {
      let title = '';
      let company = '';
      let dates = '';
      let location = '';
      let cleaned = line.replace(/\s{2,}/g, ' ').trim();

      const parenMatch = cleaned.match(/\(([^)]+)\)/);
      if (parenMatch && datePattern.test(parenMatch[1])) {
        dates = parenMatch[1];
        cleaned = cleaned.replace(parenMatch[0], '').trim();
      }

      const atMatch = cleaned.split(/\s+at\s+/i);
      if (atMatch.length === 2) {
        title = atMatch[0].trim();
        company = atMatch[1].trim();
      }

      const segments = cleaned.includes('|')
        ? cleaned.split('|').map((seg) => seg.trim()).filter(Boolean)
        : headerSeparatorPattern.test(cleaned)
          ? cleaned.split(headerSeparatorPattern).map((seg) => seg.trim()).filter(Boolean)
          : [cleaned];

      const dateSegments = segments.filter((seg) => datePattern.test(seg));
      if (dateSegments.length > 0) {
        dates = dates || dateSegments.join(' - ');
      }

      const nonDateSegments = segments.filter((seg) => !datePattern.test(seg));

      if (nonDateSegments.length >= 2) {
        const [first, second, ...rest] = nonDateSegments;
        if (titlePattern.test(first) && !titlePattern.test(second)) {
          title = first;
          company = second;
        } else if (titlePattern.test(second) && !titlePattern.test(first)) {
          title = second;
          company = first;
        } else if (!title && !company) {
          title = first;
          company = second;
        }
        if (rest.length) {
          location = rest.join(' ');
        }
      } else if (nonDateSegments.length === 1 && !title && !company) {
        const single = nonDateSegments[0] || cleaned;
        if (pendingTitle && pendingTitle !== single && !titlePattern.test(single)) {
          title = pendingTitle;
          company = single;
        } else {
          title = single;
        }
      }

      const isHeader = Boolean(
        dates ||
        cleaned.includes('|') ||
        cleaned.match(/\s[-–—]\s/) ||
        cleaned.toLowerCase().includes(' at ')
      );

      return { isHeader, title, company, dates, location };
    };

    let current = null;
    let pendingTitle = '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        pendingTitle = '';
        return;
      }

      const cleaned = trimmed.replace(bulletPattern, '').trim();
      const header = parseHeaderLine(cleaned, pendingTitle);

      if (header.isHeader) {
        if (current) experience.push(current);
        current = {
          title: header.title || pendingTitle || '',
          company: header.company || '',
          dates: header.dates || '',
          location: header.location || '',
          description: []
        };
        pendingTitle = '';
        return;
      }

      if (!current && isLikelyTitle(cleaned)) {
        pendingTitle = cleaned;
        return;
      }

      if (!current) {
        pendingTitle = '';
        return;
      }

      if (cleaned) {
        current.description.push(cleaned);
      }
    });

    if (current) {
      experience.push(current);
    }

    if (experience.length === 0) {
      const description = lines
        .map((line) => line.replace(bulletPattern, '').trim())
        .filter(Boolean);
      if (description.length) {
        experience.push({
          title: pendingTitle || '',
          company: '',
          dates: '',
          location: '',
          description
        });
      }
    }

    return experience;
  };

  const parseEducationBlocks = (lines) => {
    const education = [];
    const degreePattern = /(bachelor|master|b\.s\.|b\.a\.|m\.s\.|m\.a\.|phd|mba|btech|mtech|diploma|certificate)/i;
    const institutionPattern = /(university|college|institute|school|academy)/i;
    const yearPattern = /(19|20)\d{2}/;
    const gpaPattern = /(gpa[:\s]*[\d.]+|[\d.]+%)/i;

    lines.forEach((line) => {
      const cleaned = line.replace(/^[\-\*\u2022]+\s*/, '').trim();
      if (!cleaned) return;

      const parts = cleaned.split('|').map((part) => part.trim()).filter(Boolean);
      const yearMatch = cleaned.match(yearPattern);
      const gpaMatch = cleaned.match(gpaPattern);

      let degree = '';
      let institution = '';
      let year = yearMatch ? yearMatch[0] : '';
      let gpa = gpaMatch ? gpaMatch[0].replace(/gpa[:\s]*/i, '').trim() : '';

      parts.forEach((part) => {
        if (!degree && degreePattern.test(part)) degree = part;
        if (!institution && institutionPattern.test(part)) institution = part;
      });

      if (!institution) {
        institution = parts[0] || cleaned;
      }

      if (!degree && parts.length > 1) {
        const degreeCandidate = parts.find((part) => {
          if (part === institution) return false;
          if (yearPattern.test(part)) return false;
          if (gpaPattern.test(part)) return false;
          return true;
        });
        degree = degreeCandidate || '';
      }

      education.push({
        institution,
        degree,
        year,
        gpa
      });
    });

    return education;
  };

  const parseProjectLines = (lines) => {
    const projects = [];
    let current = null;
    let pendingLabel = '';
    let sawBlank = false;
    const bulletPattern = /^[\-\*\u2022]+\s+/;
    const verbPattern = /^(built|developed|led|designed|implemented|created|contributed|collaborated|managed|optimized|improved|delivered|worked|engineered|launched|maintained|integrated|migrated|automated|analyzed|architected|supported|enhanced|owned|drove|spearheaded|defined|deployed|tested|refactored)\b/i;
    const labelPattern = /^(https?|links?|link|url|urls?|website|portfolio|github|demo|live|tech|technologies|stack|tools|skills)$/i;
    const techLabelPattern = /^(tech|technologies|stack|tools|skills)$/i;
    const linkLabelPattern = /^(https?|links?|link|url|urls?|website|portfolio|github|demo|live)$/i;

    const isUrlLike = (value) => {
      if (!value) return false;
      const compact = value.replace(/\s+/g, '');
      return /^(https?:\/\/|www\.)/i.test(compact) || /^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(compact);
    };

    const splitTechItems = (value) => {
      return value
        .split(/[,|/]/)
        .map((item) => item.trim())
        .filter(Boolean);
    };

    const createProject = (name = '') => ({
      name: name.trim(),
      descriptionLines: [],
      technologies: [],
      links: []
    });

    const hasContent = (project) => {
      return Boolean(
        (project.name && project.name.trim()) ||
        project.descriptionLines.length ||
        project.technologies.length ||
        project.links.length
      );
    };

    const flush = () => {
      if (!current || !hasContent(current)) {
        current = null;
        return;
      }
      const descriptionParts = [...current.descriptionLines];
      if (current.links.length) {
        current.links.forEach((link) => {
          descriptionParts.push(`Link: ${link}`);
        });
      }
      const description = descriptionParts.join(' ').trim();
      const technologies = dedupe(current.technologies);

      projects.push({
        name: current.name || '',
        description: description || '',
        technologies: technologies.length ? technologies : undefined
      });
      current = null;
    };

    const isTitleCandidate = (value) => {
      if (!value) return false;
      if (labelPattern.test(value)) return false;
      if (isUrlLike(value)) return false;
      const wordCount = value.split(/\s+/).filter(Boolean).length;
      if (wordCount > 10) return false;
      if (value.length > 80) return false;
      if (verbPattern.test(value)) return false;
      if (/[.!?]$/.test(value)) return false;
      return true;
    };

    const appendDescription = (value) => {
      if (!current) return;
      const cleaned = value.replace(bulletPattern, '').trim();
      if (!cleaned) return;
      current.descriptionLines.push(cleaned);
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        pendingLabel = '';
        sawBlank = true;
        return;
      }

      let cleaned = trimmed.replace(bulletPattern, '').trim();
      if (!cleaned) return;
      if (buildSectionMatcher()(cleaned)) return;

      if (labelPattern.test(cleaned)) {
        pendingLabel = techLabelPattern.test(cleaned)
          ? 'tech'
          : linkLabelPattern.test(cleaned)
            ? 'link'
            : '';
        return;
      }

      const labeledMatch = cleaned.match(/^(tech(?:nologies)?|stack|tools|skills|links?|url|website|portfolio|github|demo|live)\s*[:\-]\s*(.+)$/i);
      if (labeledMatch) {
        const label = labeledMatch[1].toLowerCase();
        const value = labeledMatch[2].trim();
        if (!value) return;
        if (techLabelPattern.test(label)) {
          if (current) {
            current.technologies.push(...splitTechItems(value));
          }
        } else if (current) {
          current.links.push(value.replace(/\s+/g, ''));
        }
        pendingLabel = '';
        return;
      }

      if (pendingLabel) {
        if (!current) {
          pendingLabel = '';
        } else if (pendingLabel === 'tech') {
          current.technologies.push(...splitTechItems(cleaned));
          pendingLabel = '';
          return;
        } else if (pendingLabel === 'link') {
          current.links.push(cleaned.replace(/\s+/g, ''));
          pendingLabel = '';
          return;
        }
      }

      if (isUrlLike(cleaned)) {
        if (current) {
          current.links.push(cleaned.replace(/\s+/g, ''));
        }
        sawBlank = false;
        return;
      }

      const separatorMatch = cleaned.match(/^(.+?)(:|\s-\s|\s\|\s)(.+)$/);
      if (separatorMatch) {
        const name = separatorMatch[1].trim();
        const description = separatorMatch[3].trim();
        if (name && description) {
          if (current && hasContent(current)) {
            flush();
          }
          current = createProject(name);
          appendDescription(description);
          sawBlank = false;
          return;
        }
      }

      if (!current && isTitleCandidate(cleaned)) {
        current = createProject(cleaned);
        sawBlank = false;
        return;
      }

      if (current) {
        const shouldStartNew = isTitleCandidate(cleaned) &&
          (current.descriptionLines.length > 0 || current.technologies.length > 0 || current.links.length > 0) &&
          (sawBlank || !verbPattern.test(cleaned));

        if (shouldStartNew) {
          flush();
          current = createProject(cleaned);
        } else {
          appendDescription(cleaned);
        }
      }

      sawBlank = false;
    });

    flush();
    return projects;
  };

  const parseCertifications = (lines) => {
    return lines
      .map((line) => line.replace(/^[\-\*\u2022]+\s*/, '').trim())
      .filter(Boolean);
  };

  return {
    name,
    contact: {
      email,
      phone,
      location,
      linkedin,
      github,
      website
    },
    summary: summary || '',
    skills: dedupe(skills),
    experience: parseExperienceBlocks(sections.experience),
    education: parseEducationBlocks(sections.education),
    projects: parseProjectLines(sections.projects),
    certifications: parseCertifications(sections.certifications),
    structure,
    formatInfo: {
      originalPageCount: structure.originalPageCount || 1
    }
  };
};

// Resume parsing endpoint for pasted text (non-AI)
app.post('/api/parse-resume-text', async (req, res) => {
  try {
    const { text, pageCount } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required'
      });
    }

    const pageCountNumber = pageCount ? parseInt(pageCount, 10) : null;
    const normalizedPageCount = Number.isFinite(pageCountNumber) && pageCountNumber > 0
      ? pageCountNumber
      : 1;

    const structure = {
      format: 'pasted_text',
      originalPageCount: normalizedPageCount,
      estimatedPageCount: normalizedPageCount
    };

    const normalizedText = normalizePastedResumeText(text);
    let parsedFromPaste = null;
    const parsedCandidates = [];

    try {
      parsedFromPaste = parsePastedResumeText(normalizedText, structure);
      if (parsedFromPaste) {
        parsedCandidates.push(parsedFromPaste);
      }
    } catch (parseError) {
      console.warn('Pasted text parser failed:', parseError.message);
    }

    const pasteSparseCheck = parsedFromPaste
      ? isParsedPayloadSparse(parsedFromPaste, normalizedPageCount)
      : { isSparse: true };

    if (pasteSparseCheck.isSparse) {
      try {
        parsedCandidates.push(parseResumeToStructuredJSON(normalizedText));
      } catch (parseError) {
        console.warn('Advanced parser failed for normalized text:', parseError.message);
      }

      try {
        parsedCandidates.push(parseResumeToStructuredJSON(text));
      } catch (parseError) {
        console.warn('Advanced parser failed for text:', parseError.message);
      }

      try {
        parsedCandidates.push(parseResumeWithStructure(normalizedText, structure));
      } catch (parseError) {
        console.warn('Enhanced parser failed for normalized text:', parseError.message);
      }

      try {
        parsedCandidates.push(parseResumeWithStructure(text, structure));
      } catch (parseError) {
        console.warn('Enhanced parser failed for text:', parseError.message);
      }
    }

    const selection = pickRicherParsedPayload(...parsedCandidates);
    const parsed = mergeParsedPayloads(selection.payload || parsedFromPaste, ...parsedCandidates);

    if (!parsed) {
      throw new Error('Unable to parse resume content');
    }

    parsed.structure = structure;
    if (!parsed.formatInfo) {
      parsed.formatInfo = {};
    }
    if (!parsed.formatInfo.originalPageCount) {
      parsed.formatInfo.originalPageCount = normalizedPageCount;
    }

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    console.error('Resume text parsing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse resume text'
    });
  }
});

// Resume polishing endpoint for pasted text (AI - server side)
app.post('/api/polish-resume-text', async (req, res) => {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required'
      });
    }

    const polishedText = await polishResumeText(text);

    res.json({
      success: true,
      data: { polishedText }
    });
  } catch (error) {
    console.error('Resume polish error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to polish resume text'
    });
  }
});

// Resume optimization endpoint with streaming progress
app.post('/api/optimize-resume-stream', upload.single('resume'), async (req, res) => {
  process.stdout.write(' RECEIVED STREAMING REQUEST\n');
  process.stdout.write(`Request body: ${JSON.stringify(req.body)}\n`);
  process.stdout.write(`File: ${req.file ? req.file.originalname : 'No file'}\n`);

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Progress callback function
  const sendProgress = (step, message, data = null) => {
    const progressData = {
      step,
      message,
      timestamp: new Date().toISOString(),
      data
    };
    res.write(`data: ${JSON.stringify(progressData)}\n\n`);
  };

  try {
    const { targetRole, fileData, options, originalPageCount, parsedData } = req.body;
    const file = req.file;
    let parsedPayload = null;
    const originalPageCountNumber = originalPageCount ? parseInt(originalPageCount, 10) : null;
    const pageCountOverride = Number.isFinite(originalPageCountNumber) ? originalPageCountNumber : null;

    if (parsedData) {
      try {
        parsedPayload = typeof parsedData === 'string' ? JSON.parse(parsedData) : parsedData;
      } catch (parseError) {
        sendProgress('error', 'Invalid parsed data payload');
        res.end();
        return;
      }
    }

    if (parsedPayload) {
      const pageCountHint = pageCountOverride
        || parsedPayload?.formatInfo?.originalPageCount
        || parsedPayload?.structure?.originalPageCount
        || parsedPayload?.formatInfo?.estimatedPageCount
        || parsedPayload?.structure?.estimatedPageCount
        || 1;
      const sparseCheck = isParsedPayloadSparse(parsedPayload, pageCountHint);
      if (sparseCheck.isSparse && (file || fileData)) {
        console.log('Parsed data looks sparse; falling back to full file analysis.', sparseCheck.stats);
        sendProgress('parsing', 'Extracted data looks incomplete. Analyzing the full document instead...');
        parsedPayload = null;
      }
    }

    // Validation
    if (!file && !fileData && !parsedPayload) {
      sendProgress('error', 'Either resume file or file data is required');
      res.end();
      return;
    }

    if (!targetRole) {
      sendProgress('error', 'Target role is required');
      res.end();
      return;
    }

    sendProgress('start', `Starting resume optimization for ${targetRole}...`);

    console.log(`Processing resume optimization for role: ${targetRole}`);
    if (originalPageCount) {
      console.log(` Original PDF page count: ${originalPageCount}`);
    }
    if (parsedPayload) {
      console.log('Using parsed resume payload from client');
      sendProgress('parsing', 'Using extracted resume data...');
    } else if (file) {
      console.log(`File: ${file.originalname}, Size: ${file.size} bytes`);
      sendProgress('file-processing', `Processing file: ${file.originalname}...`);
    } else {
      console.log(`File: Direct text data, Size: ${fileData.length} characters`);
      sendProgress('file-processing', 'Processing provided text data...');
    }

    // Enhanced text extraction with structure preservation
    // Enhanced text extraction with structure preservation
    let resumeText = '', fileStructure = null, resumeInput = null;

    if (parsedPayload) {
      resumeInput = '';
      fileStructure = {
        format: 'structured_data',
        originalPageCount: Math.max(
          pageCountOverride || 0,
          parsedPayload?.formatInfo?.originalPageCount || 0,
          parsedPayload?.structure?.originalPageCount || 0,
          parsedPayload?.formatInfo?.estimatedPageCount || 0,
          parsedPayload?.structure?.estimatedPageCount || 0,
          1
        )
      };
    } else if (fileData) {
      // Direct text data provided
      resumeText = fileData;
      resumeInput = fileData;
      fileStructure = {
        format: 'direct_text',
        originalPageCount: pageCountOverride || 1
      };
    } else {
      // Extract from file
      // FOR PDF: Prefer text extraction for speed, fall back to binary if needed
      if (file.mimetype === 'application/pdf') {
        const baseMinPdfChars = Number(process.env.PDF_TEXT_MIN_CHARS) || 400;
        const minPdfCharsPerPage = Number(process.env.PDF_TEXT_MIN_CHARS_PER_PAGE) || 350;
        let extractionResult = null;
        let extractedText = '';

        try {
          sendProgress('extracting', `Extracting text from ${file.originalname} for faster optimization...`);
          extractionResult = await extractTextFromFileWithStructure(file.path, file.mimetype);
          fileStructure = extractionResult.structure;
          extractedText = extractionResult.text || '';
        } catch (e) {
          console.warn('PDF text extraction failed, falling back to binary analysis:', e.message);
        }

        const extractedTextLength = extractedText.trim().length;
        const pageCountHint = fileStructure?.originalPageCount || fileStructure?.estimatedPageCount || pageCountOverride || 1;
        const minPdfChars = Math.max(baseMinPdfChars, minPdfCharsPerPage * pageCountHint);

        if (extractedTextLength >= minPdfChars) {
          try {
            const parsedAdvanced = parseResumeToStructuredJSON(extractedText);
            const parsedEnhanced = parseResumeWithStructure(extractedText, fileStructure);
            const selection = pickRicherParsedPayload(parsedAdvanced, parsedEnhanced);
            const parsedFromText = mergeParsedPayloads(
              selection.payload || parsedAdvanced || parsedEnhanced,
              parsedAdvanced,
              parsedEnhanced
            );

            if (parsedFromText) {
              parsedFromText.structure = fileStructure;
              if (!parsedFromText.formatInfo) {
                parsedFromText.formatInfo = {};
              }
              if (!parsedFromText.formatInfo.originalPageCount) {
                parsedFromText.formatInfo.originalPageCount = fileStructure?.originalPageCount || pageCountOverride || 1;
              }
              if (!parsedFromText.formatInfo.estimatedPageCount && fileStructure?.estimatedPageCount) {
                parsedFromText.formatInfo.estimatedPageCount = fileStructure.estimatedPageCount;
              }

              const parsedCheck = isParsedPayloadSparse(
                parsedFromText,
                fileStructure?.originalPageCount || fileStructure?.estimatedPageCount || pageCountOverride || 1
              );

              if (!parsedCheck.isSparse) {
                parsedPayload = parsedFromText;
                resumeInput = '';
                sendProgress('parsing', 'Using extracted text for structured optimization...');
              } else {
                resumeText = extractedText;
                resumeInput = resumeText;
                sendProgress('parsing', 'Using extracted text for optimization...');
              }
            }
          } catch (parseError) {
            console.warn('Parsing failed for PDF text, using raw text instead:', parseError.message);
            resumeText = extractedText;
            resumeInput = resumeText;
            sendProgress('parsing', 'Using extracted text for optimization...');
          }
        }

        if (!resumeInput && !parsedPayload) {
          if (extractedTextLength > 0) {
            sendProgress('parsing', 'Extracted text looks incomplete. Using visual PDF analysis instead...');
          }
          console.log(` [Enhanced Server] PDF detected - Using Gemini Multimodal (Binary) Processing`);
          const buffer = fs.readFileSync(file.path);
          resumeInput = {
            buffer: buffer,
            mimeType: file.mimetype
          };
          if (!fileStructure) {
            fileStructure = { originalPageCount: pageCountOverride || 1 };
          }
        }
      } else {
        // FOR DOCX/Text: Use legacy extraction
        sendProgress('extracting', `Extracting text from ${file.originalname} with structure preservation...`);
        const extractionResult = await extractTextFromFileWithStructure(file.path, file.mimetype);
        resumeText = extractionResult.text;
        resumeInput = resumeText;
        fileStructure = extractionResult.structure;
      }

      console.log(` [Enhanced Server] File pre-processing complete`);
      if (fileStructure) {
        console.log(`   - Format: ${fileStructure.format}`);
        console.log(`   - Original pages: ${fileStructure.originalPageCount || fileStructure.estimatedPageCount}`);
      }
    }

    if (!resumeInput && !parsedPayload) {
      sendProgress('error', 'Could not process the uploaded file');
      res.end();
      return;
    }

    // Use original page count from PDF if available, otherwise from file structure
    const actualPageCount = pageCountOverride ||
      (fileStructure?.originalPageCount || fileStructure?.estimatedPageCount || 1);

    if (parsedPayload) {
      sendProgress('text-extracted', 'Using extracted resume data for optimization');
    } else if (typeof resumeInput === 'string') {
      sendProgress('text-extracted', `Extracted ${resumeInput.length} characters from ${actualPageCount}-page resume`);
    } else {
      sendProgress('text-extracted', `Prepared ${file.mimetype} for intelligent analysis (${formatFileSize(file.size)})`);
    }

    console.log(` [Enhanced Server] About to call optimizeResumeWithPagePreservation with STRICT page preservation...`);

    // Optimize resume using ENHANCED AI with STRICT page preservation
    const optimizationResult = await optimizeResumeWithPagePreservation(resumeInput, targetRole, {
      ...options,
      progressCallback: sendProgress,
      originalPageCount: actualPageCount,
      fileStructure: fileStructure,
      parsedData: parsedPayload
    });

    console.log(` Server: optimizeResume completed successfully`);
    console.log(` Server: Received ${optimizationResult.templates?.length || 0} templates`);

    // Clean up uploaded file
    if (file) {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not delete uploaded file:', cleanupError.message);
      }
    }

    // Send final result
    sendProgress('completed', 'Resume optimization completed successfully!', {
      templates: optimizationResult.templates,
      improvements: optimizationResult.improvements,
      stats: optimizationResult.stats,
      keyChanges: optimizationResult.keyChanges,
      targetRole: targetRole
    });

    res.end();

  } catch (error) {
    console.error(' Server: Resume optimization error caught:', error);
    console.error(' Server: Error type:', typeof error);
    console.error(' Server: Error message:', error.message);
    console.error(' Server: Error stack:', error.stack);

    sendProgress('error', error.message || 'Failed to optimize resume. Please try again.');

    // Clean up uploaded file in case of error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not delete uploaded file after error:', cleanupError.message);
      }
    }

    console.log(' Server: Ending streaming response due to error');
    res.end();
  }
});

// Resume optimization endpoint (legacy, non-streaming)
app.post('/api/optimize-resume', upload.single('resume'), async (req, res) => {
  process.stdout.write(' RECEIVED REQUEST\n');
  process.stdout.write(`Request body: ${JSON.stringify(req.body)}\n`);
  process.stdout.write(`File: ${req.file ? req.file.originalname : 'No file'}\n`);

  try {
    const { targetRole, fileData, options, originalPageCount } = req.body;
    const file = req.file;

    // Validation - allow either file upload or direct text data
    if (!file && !fileData) {
      return res.status(400).json({
        success: false,
        error: 'Either resume file or file data is required'
      });
    }

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        error: 'Target role is required'
      });
    }

    console.log(`Processing resume optimization for role: ${targetRole}`);
    if (originalPageCount) {
      console.log(` Original PDF page count: ${originalPageCount}`);
    }
    if (file) {
      console.log(`File: ${file.originalname}, Size: ${file.size} bytes`);
    } else {
      console.log(`File: Direct text data, Size: ${fileData.length} characters`);
    }

    // Enhanced text extraction with structure preservation (legacy endpoint)
    let resumeText, fileStructure = null;

    if (fileData) {
      // Direct text data provided
      resumeText = fileData;
      fileStructure = {
        format: 'direct_text',
        originalPageCount: originalPageCount ? parseInt(originalPageCount) : 1
      };
    } else {
      // Extract from file with enhanced structure awareness
      const extractionResult = await extractTextFromFileWithStructure(file.path, file.mimetype);
      resumeText = extractionResult.text;
      fileStructure = extractionResult.structure;

      console.log(` [Enhanced Server] Legacy endpoint - File extraction complete:`);
      console.log(`   - Format: ${fileStructure.format}`);
      console.log(`   - Original pages: ${fileStructure.originalPageCount || fileStructure.estimatedPageCount}`);
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from the uploaded file. Please ensure the file contains readable text.'
      });
    }

    // Use original page count from PDF if available, otherwise from file structure
    const actualPageCount = originalPageCount ? parseInt(originalPageCount) :
      (fileStructure?.originalPageCount || fileStructure?.estimatedPageCount || 1);

    console.log(` [Enhanced Server] Legacy endpoint - Extracted ${resumeText.length} characters from ${actualPageCount} pages`);

    // Optimize resume using ENHANCED AI with STRICT page preservation
    const optimizationResult = await optimizeResumeWithPagePreservation(resumeText, targetRole, {
      ...options,
      originalPageCount: actualPageCount,
      fileStructure: fileStructure
    });
    // Clean up uploaded file
    if (file) {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not delete uploaded file:', cleanupError.message);
      }
    }

    // Enhanced logging for page preservation
    console.log(` [Enhanced Server] Sending response with templates:`, optimizationResult.templates ? optimizationResult.templates.length : 'NONE');
    console.log(` [Enhanced Server] Template names:`, optimizationResult.templates ? optimizationResult.templates.map(t => t.name) : 'NO TEMPLATES');
    console.log(` [Enhanced Server] Template styles:`, optimizationResult.templates ? optimizationResult.templates.map(t => t.style || 'no-style') : 'NO STYLES');

    // Confirm page preservation in templates
    if (optimizationResult.templates) {
      optimizationResult.templates.forEach((template, index) => {
        const pageCount = template.content?.originalPageCount || 'UNKNOWN';
        const formatType = template.content?.formatType || 'UNKNOWN';
        console.log(` [Enhanced Server] Template ${index + 1} (${template.style}): ${pageCount} pages, ${formatType} format`);
      });

      const seniorModern = optimizationResult.templates.find(t => t.style === 'senior-modern');
      const conciseClassic = optimizationResult.templates.find(t => t.style === 'concise-classic');
      console.log(` [Enhanced Server] Senior Modern template: ${seniorModern ? ' YES' : ' NO'}`);
      console.log(` [Enhanced Server] Concise Classic template: ${conciseClassic ? ' YES' : ' NO'}`);
    }

    // Log page preservation confirmation
    if (optimizationResult.pagePreservation) {
      console.log(` [Enhanced Server] PAGE PRESERVATION CONFIRMED:`);
      console.log(`   - Original: ${optimizationResult.pagePreservation.originalPageCount} pages`);
      console.log(`   - Preserved: ${optimizationResult.pagePreservation.preservedPageCount} pages`);
      console.log(`   - Strict Preservation: ${optimizationResult.pagePreservation.strictPreservation}`);
    }

    // Return optimized resume
    const responseData = {
      success: true,
      data: {
        originalText: resumeText,
        templates: optimizationResult.templates,
        improvements: optimizationResult.improvements,
        stats: optimizationResult.stats,
        keyChanges: optimizationResult.keyChanges,
        targetRole: targetRole
      }
    };

    console.log(' Full response structure:', Object.keys(responseData.data));
    res.json(responseData);

  } catch (error) {
    console.error('Resume optimization error:', error);
    console.error('Error stack:', error.stack);

    // Clean up uploaded file in case of error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not delete uploaded file after error:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to optimize resume. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// NEW ATS Optimization Endpoint with Streaming
app.post('/api/ats-optimize', upload.single('resume'), async (req, res) => {
  console.log('🎯 [ATS] Received optimization request');
  
  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sendProgress = (step, message, data = null) => {
    const progressData = {
      step,
      message,
      timestamp: new Date().toISOString(),
      data
    };
    res.write(`data: ${JSON.stringify(progressData)}\n\n`);
  };

  try {
    const { targetRole } = req.body;
    const file = req.file;

    if (!file) {
      sendProgress('error', 'Resume file is required');
      res.end();
      return;
    }

    if (!targetRole) {
      sendProgress('error', 'Target role is required');
      res.end();
      return;
    }

    console.log(`🎯 [ATS] File: ${file.originalname}, Role: ${targetRole}`);
    sendProgress('start', 'Starting ATS optimization...');

    // Prepare input based on file type
    let resumeInput;
    if (file.mimetype === 'application/pdf') {
      // For PDFs, send binary directly to AI
      const buffer = fs.readFileSync(file.path);
      resumeInput = {
        buffer: buffer,
        mimeType: file.mimetype
      };
      sendProgress('processing', 'Processing PDF with AI vision...');
    } else {
      // For DOCX, extract text first
      const extractionResult = await extractTextFromFileWithStructure(file.path, file.mimetype);
      resumeInput = extractionResult.text;
      sendProgress('processing', 'Extracted text from document...');
    }

    // Run ATS optimization
    const result = await optimizeResumeForATS(resumeInput, targetRole, {
      progressCallback: sendProgress
    });

    // Clean up uploaded file
    try {
      fs.unlinkSync(file.path);
    } catch (cleanupError) {
      console.warn('⚠️ Could not delete uploaded file:', cleanupError.message);
    }

    // Send final result
    sendProgress('completed', 'ATS optimization completed!', result);
    res.end();

  } catch (error) {
    console.error('🎯 [ATS] ERROR:', error.message);
    sendProgress('error', error.message || 'ATS optimization failed');
    
    // Clean up on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Could not delete uploaded file:', cleanupError.message);
      }
    }
    
    res.end();
  }
});

// Get available target roles
app.get('/api/target-roles', (req, res) => {
  res.json({
    success: true,
    data: targetRoles
  });
});

// PDF generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { html, options = {} } = req.body;

    if (!html) {
      return res.status(400).json({
        success: false,
        error: 'HTML content is required'
      });
    }

    console.log(' Generating PDF with Puppeteer...');
    console.log(` HTML length: ${html.length} characters`);

    const pdfBuffer = await generatePDF(html, options);

    console.log(' PDF generated successfully');
    console.log(` PDF size: ${pdfBuffer.length} bytes`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error(' PDF generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    });
  }
});

// payment related routes
app.post("/api/initiate-payment", async (req, res) => {
  try {
    const {
      amount,
      firstname,
      email,
      phone,
      productinfo,
      surl,
      furl,
      udfFields
    } = req.body || {};

    const baseUrl = process.env.FRONTEND_URL;
    const parsedAmount = Number(amount ?? process.env.PAYMENT_AMOUNT);
    const extraFields = (udfFields && typeof udfFields === "object" && !Array.isArray(udfFields)) ? udfFields : {};

    const paymentData = {
      amount: Number.isFinite(parsedAmount) ? parsedAmount : undefined,
      firstname: firstname || process.env.PAYMENT_FIRSTNAME,
      email: email || process.env.PAYMENT_EMAIL,
      phone: phone || process.env.PAYMENT_PHONE,
      productinfo: productinfo || process.env.PAYMENT_PRODUCT,
      surl: surl || (baseUrl ? `${baseUrl}/success` : undefined),
      furl: furl || (baseUrl ? `${baseUrl}/failed` : undefined),
      ...extraFields
    };

    const missingFields = ["amount", "firstname", "email", "phone", "productinfo", "surl", "furl"]
      .filter((field) => !paymentData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required payment fields: ${missingFields.join(", ")}`
      });
    }

    console.log("payment data", paymentData);
    const { paymentUrl, txnid, amount: finalAmount } = await initiatePayment(paymentData);
    console.log(paymentUrl);
    return res.status(200).json({
      success: true,
      message: "Payment link generated successfully!",
      paymentUrl,
      txnid,
      amount: finalAmount
    });
  }
  catch (error) {
    console.log("error in initiate payment route: ", error);
    res.status(500).json({
      error: "initate payment gateway error"
    });
  }
});
// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

function getSkillCount(skills) {
  if (!skills) return 0;
  if (Array.isArray(skills)) {
    return skills.filter((item) => String(item).trim()).length;
  }
  if (typeof skills === 'string') {
    return skills
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean).length;
  }
  if (typeof skills === 'object') {
    return Object.values(skills)
      .flatMap((value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(/[,|\n]/);
        return [];
      })
      .map((item) => String(item).trim())
      .filter(Boolean).length;
  }
  return 0;
}

function getExperienceBulletCount(experience) {
  if (!Array.isArray(experience)) return 0;
  return experience.reduce((total, entry) => {
    if (!entry) return total;
    const bullets = entry.description || entry.points || entry.bullets || entry.responsibilities || [];
    if (Array.isArray(bullets)) {
      return total + bullets.filter(Boolean).length;
    }
    if (typeof bullets === 'string') {
      return total + bullets.split(/\n|\u2022/).map((item) => item.trim()).filter(Boolean).length;
    }
    return total;
  }, 0);
}

function getPayloadContent(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.fullContent && typeof payload.fullContent === 'object') return payload.fullContent;
  if (payload.layout && typeof payload.layout === 'object') return payload.layout;
  return payload;
}

function isHeadingText(value) {
  const trimmed = String(value || '').trim().toLowerCase();
  return /^(summary|professional summary|executive summary|profile|objective|about|skills|core skills|core competencies|education|projects|project experience|certifications|experience|work experience|professional experience|awards|publications|languages)\b/.test(trimmed);
}

function isMeaningfulEntry(entry) {
  if (entry === null || entry === undefined) return false;
  if (typeof entry === 'string' || typeof entry === 'number') {
    const text = String(entry).trim();
    return Boolean(text && !isHeadingText(text));
  }
  if (typeof entry !== 'object') return false;
  return Object.values(entry).some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).trim();
      return Boolean(text && !isHeadingText(text));
    }
    if (Array.isArray(value)) {
      return value.some((item) => isMeaningfulEntry(item));
    }
    return false;
  });
}

function countMeaningfulEntries(items) {
  if (!Array.isArray(items)) return 0;
  return items.filter((item) => isMeaningfulEntry(item)).length;
}

function toArrayValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(/\n/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function getEntryKey(entry) {
  if (entry === null || entry === undefined) return '';
  if (typeof entry === 'string' || typeof entry === 'number') {
    return String(entry).trim().toLowerCase();
  }
  if (typeof entry === 'object') {
    const keyCandidate = entry.name || entry.title || entry.company || entry.institution || entry.degree || entry.school;
    if (typeof keyCandidate === 'string' && keyCandidate.trim()) {
      return keyCandidate.trim().toLowerCase();
    }
    try {
      return JSON.stringify(entry).toLowerCase();
    } catch (error) {
      return '';
    }
  }
  return '';
}

function mergeUniqueArray(baseItems, otherItems) {
  const merged = [];
  const seen = new Set();
  const add = (item) => {
    const key = getEntryKey(item);
    if (key && seen.has(key)) return;
    if (key) seen.add(key);
    merged.push(item);
  };
  (Array.isArray(baseItems) ? baseItems : []).forEach(add);
  (Array.isArray(otherItems) ? otherItems : []).forEach(add);
  return merged;
}

function mergeContactFields(baseContact = {}, otherContact = {}) {
  const merged = { ...(baseContact || {}) };
  const fields = ['name', 'email', 'phone', 'location', 'linkedin', 'linkedIn', 'github', 'portfolio', 'website'];
  fields.forEach((field) => {
    if (!merged[field] && otherContact[field]) {
      merged[field] = otherContact[field];
    }
  });

  const collectLinks = (contact) => {
    const links = [];
    if (!contact) return links;
    if (Array.isArray(contact.links)) links.push(...contact.links);
    if (Array.isArray(contact.other)) links.push(...contact.other);
    return links
      .map((link) => (typeof link === 'string' ? link.trim() : ''))
      .filter(Boolean);
  };

  const mergedLinks = mergeUniqueArray(collectLinks(baseContact), collectLinks(otherContact));
  if (mergedLinks.length > 0) {
    merged.links = mergedLinks;
  }

  return merged;
}

function getSectionArray(data, keys) {
  if (!data) return [];
  for (const key of keys) {
    const value = data[key];
    if (!value) continue;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return toArrayValue(value);
  }
  return [];
}

function mergeSectionArray(baseData, otherData, primaryKey, altKeys = []) {
  const keys = [primaryKey, ...altKeys];
  const baseItems = getSectionArray(baseData, keys);
  const otherItems = getSectionArray(otherData, keys);
  const baseCount = countMeaningfulEntries(baseItems);
  const otherCount = countMeaningfulEntries(otherItems);

  if (otherCount === 0) return;
  if (baseCount === 0) {
    baseData[primaryKey] = otherItems;
    return;
  }
  if (otherCount > baseCount) {
    baseData[primaryKey] = mergeUniqueArray(baseItems, otherItems);
  }
}

function mergeParsedPayloads(primaryPayload, ...candidates) {
  let resolvedPrimary = primaryPayload;
  if (!resolvedPrimary) {
    resolvedPrimary = candidates.find((payload) => payload);
  }
  if (!resolvedPrimary) return null;

  const primaryData = getPayloadContent(resolvedPrimary);
  if (!primaryData) return resolvedPrimary;

  candidates.forEach((candidate) => {
    if (!candidate || candidate === resolvedPrimary) return;
    const candidateData = getPayloadContent(candidate);
    if (!candidateData) return;

    const baseContact = primaryData.personalInfo || primaryData.contact || primaryData.contactInfo || {};
    const otherContact = candidateData.personalInfo || candidateData.contact || candidateData.contactInfo || {};
    const mergedContact = mergeContactFields(baseContact, otherContact);
    if (Object.keys(mergedContact).length > 0) {
      if (primaryData.personalInfo || candidateData.personalInfo) {
        primaryData.personalInfo = mergedContact;
      } else if (primaryData.contact || candidateData.contact) {
        primaryData.contact = mergedContact;
      } else if (primaryData.contactInfo || candidateData.contactInfo) {
        primaryData.contactInfo = mergedContact;
      } else {
        primaryData.personalInfo = mergedContact;
      }
    }

    if (!primaryData.name && candidateData.name) {
      primaryData.name = candidateData.name;
    }

    const summaryKeys = ['summary', 'professionalSummary', 'executiveSummary', 'profile', 'objective', 'about'];
    const baseSummary = summaryKeys.map((key) => primaryData[key]).find((value) => typeof value === 'string' && value.trim());
    const otherSummary = summaryKeys.map((key) => candidateData[key]).find((value) => typeof value === 'string' && value.trim());
    if (!baseSummary && otherSummary) {
      primaryData.summary = otherSummary;
    } else if (baseSummary && otherSummary && baseSummary.length < 80 && otherSummary.length > baseSummary.length) {
      primaryData.summary = otherSummary;
    }

    const baseSkillCount = getSkillCount(primaryData.skills);
    const otherSkillCount = getSkillCount(candidateData.skills);
    if (baseSkillCount === 0 && otherSkillCount > 0) {
      primaryData.skills = candidateData.skills;
    }

    mergeSectionArray(primaryData, candidateData, 'experience');
    mergeSectionArray(primaryData, candidateData, 'education');
    mergeSectionArray(primaryData, candidateData, 'projects', [
      'projectExperience',
      'projectWork',
      'portfolio',
      'keyProjects',
      'notableProjects',
      'personalProjects'
    ]);
    mergeSectionArray(primaryData, candidateData, 'certifications', ['certificates', 'licenses', 'credentials']);

    if (!resolvedPrimary.formatInfo && candidate.formatInfo) {
      resolvedPrimary.formatInfo = { ...candidate.formatInfo };
    } else if (resolvedPrimary.formatInfo && candidate.formatInfo) {
      resolvedPrimary.formatInfo = { ...candidate.formatInfo, ...resolvedPrimary.formatInfo };
    }
    if (!resolvedPrimary.structure && candidate.structure) {
      resolvedPrimary.structure = { ...candidate.structure };
    } else if (resolvedPrimary.structure && candidate.structure) {
      resolvedPrimary.structure = { ...candidate.structure, ...resolvedPrimary.structure };
    }
  });

  return resolvedPrimary;
}

function getParsedPayloadStats(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      experienceCount: 0,
      educationCount: 0,
      projectsCount: 0,
      certificationsCount: 0,
      skillsCount: 0,
      summaryLength: 0,
      bulletCount: 0
    };
  }

  const data = payload.fullContent || payload.layout || payload;
  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const certifications = Array.isArray(data.certifications) ? data.certifications : [];
  const summary = data.summary || data.professionalSummary || data.profile || data.objective || '';
  const summaryLength = typeof summary === 'string' ? summary.trim().length : 0;
  const skillsCount = getSkillCount(data.skills);
  const bulletCount = getExperienceBulletCount(experience);

  return {
    experienceCount: experience.length,
    educationCount: education.length,
    projectsCount: projects.length,
    certificationsCount: certifications.length,
    skillsCount,
    summaryLength,
    bulletCount
  };
}

function getParsedPayloadScore(payload) {
  const stats = getParsedPayloadStats(payload);
  const summaryScore = Math.min(Math.floor(stats.summaryLength / 80), 4);
  const skillScore = Math.min(stats.skillsCount, 12);
  const bulletScore = Math.min(stats.bulletCount, 12);
  return (stats.experienceCount * 6)
    + bulletScore
    + (stats.educationCount * 3)
    + (stats.projectsCount * 3)
    + (stats.certificationsCount * 2)
    + Math.floor(skillScore / 2)
    + summaryScore;
}

function pickRicherParsedPayload(...payloads) {
  let bestPayload = null;
  let bestScore = -1;
  payloads.forEach((payload) => {
    if (!payload) return;
    const score = getParsedPayloadScore(payload);
    if (score > bestScore) {
      bestScore = score;
      bestPayload = payload;
    }
  });
  return { payload: bestPayload, score: bestScore };
}

function isParsedPayloadSparse(payload, pageCount = 1) {
  const stats = getParsedPayloadStats(payload);
  const totalSections = stats.experienceCount + stats.educationCount + stats.projectsCount + stats.certificationsCount;
  const totalSignals = totalSections + Math.min(stats.skillsCount, 10);
  const hasCoreSection = totalSections > 0;
  const isMultiPage = Number(pageCount) > 1;

  if (!hasCoreSection && stats.skillsCount < 4 && stats.summaryLength < 150) {
    return { isSparse: true, stats };
  }

  if (stats.bulletCount >= 3 && stats.experienceCount >= 1) {
    return { isSparse: false, stats };
  }

  const isSparse = isMultiPage
    ? stats.experienceCount === 0
      || (stats.experienceCount < 2 && stats.bulletCount < 4 && stats.educationCount === 0 && stats.projectsCount === 0)
      || (totalSignals < 4 && stats.summaryLength < 120)
    : (totalSignals < 3 && stats.summaryLength < 80);

  return { isSparse, stats };
}

// Helper function for file size formatting
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Resume Optimizer API v2.0 running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 NEW: ATS Optimizer: http://localhost:${PORT}/api/ats-optimize`);
  console.log(`📊 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log(`🎨 Features: ATS Optimization, Page Preservation, Template Generation`);
});

server.on('error', (error) => {
  console.error(' Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error(' Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;

