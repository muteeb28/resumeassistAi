/**
 * Advanced Resume Parser with Enhanced Section Detection
 * Handles unstructured text and creates clean JSON with structured sections
 */

/**
 * Enhanced PDF text extraction with better structure preservation
 * @param {Object} textContent - PDF.js textContent object
 * @returns {string} Structured text with preserved formatting
 */
export function extractStructuredTextFromPDF(textContent) {
  if (!textContent || !textContent.items) return '';

  let structuredText = '';
  let currentY = null;
  let lineText = '';

  // Group text items by Y coordinate (line detection)
  const lines = new Map();

  textContent.items.forEach(item => {
    const y = Math.round(item.transform[5]); // Y coordinate
    if (!lines.has(y)) {
      lines.set(y, []);
    }
    lines.get(y).push({
      text: item.str,
      x: item.transform[4] // X coordinate for sorting
    });
  });

  // Sort lines by Y coordinate (top to bottom)
  const sortedYCoords = Array.from(lines.keys()).sort((a, b) => b - a);

  // Process each line
  sortedYCoords.forEach(y => {
    const lineItems = lines.get(y);
    // Sort items in line by X coordinate (left to right)
    lineItems.sort((a, b) => a.x - b.x);

    // Join text items in the line with appropriate spacing
    const lineText = lineItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (lineText) {
      structuredText += lineText + '\n';
    }
  });

  return structuredText.trim();
}

/**
 * Sanitize resume text before section detection/parsing
 * @param {string} text - Raw resume text
 * @returns {string} Sanitized text
 */
function sanitizeResumeText(text) {
  if (!text) return '';

  let sanitized = text.replace(/---\s*PAGE BREAK\s*---/gi, '\n\n[[PAGE_BREAK]]\n\n');
  sanitized = sanitized.replace(/\s*-*\s*PAGE BREAK\s*-*\s*/gi, ' [[PAGE_BREAK]] ');
  sanitized = sanitized.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
  const phonePattern = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
  const linkedinPattern = /linkedin\.com\/in\/[a-zA-Z0-9-]+/gi;
  const githubPattern = /github\.com\/[a-zA-Z0-9-]+/gi;
  const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

  const sectionAliases = {
    summary: [
      'summary',
      'professional summary',
      'executive summary',
      'profile',
      'about',
      'objective',
      'career objective'
    ],
    experience: [
      'experience',
      'work experience',
      'professional experience',
      'employment',
      'work history',
      'employment history'
    ],
    education: [
      'education',
      'academic',
      'academics',
      'qualifications',
      'degrees'
    ],
    skills: [
      'skills',
      'technical skills',
      'core skills',
      'core competencies',
      'competencies',
      'technologies',
      'expertise',
      'skills and interests',
      'skills & interests'
    ],
    projects: [
      'projects',
      'project experience',
      'project work',
      'portfolio',
      'notable projects',
      'key projects',
      'personal projects'
    ],
    certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
    awards: ['awards', 'honors', 'achievements', 'recognition'],
    publications: ['publications', 'papers', 'articles'],
    languages: ['languages', 'language']
  };

  const normalizeHeading = (line) =>
    line
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

  const normalizedAliases = new Set(
    Object.values(sectionAliases)
      .flat()
      .map((alias) => normalizeHeading(alias))
  );

  const isMostlyLetters = (value) => {
    if (!value) return false;
    const lettersSpaces = (value.match(/[A-Za-z\s]/g) || []).length;
    return lettersSpaces / value.length >= 0.85;
  };

  const getHeadingMatches = (line) => {
    const normalized = normalizeHeading(line);
    if (!normalized) return [];
    const matches = [];
    normalizedAliases.forEach((alias) => {
      if (normalized.includes(alias)) {
        matches.push(alias);
      }
    });
    return matches
      .sort((a, b) => normalized.indexOf(a) - normalized.indexOf(b))
      .filter((alias, idx, arr) => arr.indexOf(alias) === idx);
  };

  const isStrictHeadingCandidate = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.length > 60) return false;
    const normalized = normalizeHeading(trimmed);
    if (!normalized) return false;
    if (normalizedAliases.has(normalized)) return true;
    for (const alias of normalizedAliases) {
      if (normalized.startsWith(alias + ' ') || normalized === alias) return true;
    }
    return false;
  };

  const normalizeCombinedHeading = (line) => {
    const normalized = normalizeHeading(line);
    const matches = getHeadingMatches(line);
    if (matches.length < 2) return null;
    let remaining = normalized;
    matches.forEach((match) => {
      remaining = remaining.replace(match, '').trim();
    });
    if (remaining.replace(/\s+/g, ' ').trim()) {
      return null;
    }
    return matches;
  };

  const isHeadingLine = (line) => normalizedAliases.has(normalizeHeading(line));

  const rawLines = sanitized.split('\n');
  const lines = [];
  rawLines.forEach((line) => {
    if (line.includes('[[PAGE_BREAK]]')) {
      const parts = line.split('[[PAGE_BREAK]]');
      parts.forEach((part, idx) => {
        if (part.trim()) {
          lines.push(part);
        }
        if (idx < parts.length - 1) {
          lines.push('');
        }
      });
    } else {
      lines.push(line);
    }
  });
  const repairedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '[[PAGE_BREAK]]') {
      repairedLines.push('');
      continue;
    }

    const nextLine = lines[i + 1] || '';
    const nextTrimmed = nextLine.trim();
    if (/[A-Za-z]\s*-\s*$/.test(trimmed) && /^[a-z]/.test(nextTrimmed)) {
      repairedLines.push(trimmed.replace(/-\s*$/, '') + nextTrimmed);
      i += 1;
      continue;
    }

    repairedLines.push(line);
  }

  const finalSanitized = repairedLines
    .map((line) => line.replace(/\s+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return finalSanitized;
}

const canonicalSectionAliases = {
  summary: [
    'SUMMARY',
    'PROFESSIONAL SUMMARY',
    'EXECUTIVE SUMMARY',
    'PROFILE',
    'OBJECTIVE',
    'CAREER OBJECTIVE',
    'EXECUTIVE PROFILE',
    'TECHNICAL SUMMARY',
    'ABOUT ME',
    'CORE COMPETENCIES' // Sometimes summary includes competencies
  ],
  skills: [
    'SKILLS',
    'TECHNICAL SKILLS',
    'CORE COMPETENCIES',
    'CORE SKILLS',
    'COMPETENCIES',
    'SKILLS AND INTERESTS',
    'SKILLS & INTERESTS',
    'TECHNOLOGIES',
    'AREAS OF EXPERTISE',
    'PROFICIENCIES'
  ],
  experience: [
    'EXPERIENCE',
    'WORK EXPERIENCE',
    'PROFESSIONAL EXPERIENCE',
    'EMPLOYMENT',
    'WORK HISTORY',
    'EMPLOYMENT HISTORY',
    'PROFESSIONAL CONTOUR',
    'CAREER HISTORY'
  ],
  education: [
    'EDUCATION',
    'ACADEMICS',
    'ACADEMIC',
    'QUALIFICATIONS',
    'ACADEMIC BACKGROUND',
    'EDUCATIONAL BACKGROUND'
  ],
  projects: [
    'PROJECTS',
    'PROJECT EXPERIENCE',
    'PROJECT WORK',
    'PORTFOLIO',
    'NOTABLE PROJECTS',
    'KEY PROJECTS',
    'ACADEMIC PROJECTS'
  ],
  certifications: [
    'CERTIFICATIONS',
    'CERTIFICATES',
    'LICENSES',
    'CREDENTIALS',
    'PROFESSIONAL QUALIFICATIONS'
  ]
};

const normalizeHeadingToken = (value) =>
  value
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const headingLookup = new Map(
  Object.entries(canonicalSectionAliases).flatMap(([section, aliases]) =>
    aliases.map((alias) => [normalizeHeadingToken(alias), section])
  )
);

const isUppercaseLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const letters = trimmed.replace(/[^A-Za-z]/g, '');
  if (!letters) return false;
  return trimmed === trimmed.toUpperCase();
};

const isHeadingCandidate = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 60) return false;

  // Clean line for checking
  const clean = trimmed.replace(/^[#>\-\*\+\s]+/, '').replace(/[*_`]+/g, '').trim();
  if (!clean) return false;

  const normalized = normalizeHeadingToken(clean);

  // Exact match
  if (headingLookup.has(normalized)) return true;

  // Starts with match (e.g., "EXPERIENCE - Software Engineer")
  for (const alias of headingLookup.keys()) {
    if (normalized.startsWith(alias + ' ') || normalized.startsWith(alias + ':') || normalized.startsWith(alias + ' -')) {
      // Ensure it's not a long sentence starting with a keyword
      if (clean.length < alias.length + 20) return true;
    }
  }
  return false;
};

const actionVerbPattern = /^(led|managed|built|created|designed|implemented|developed|optimized|integrated|collaborated|delivered|contributed|worked|engineered|launched|maintained|automated|analyzed|architected|supported|enhanced|owned)\b/i;

const collapseWrappedLines = (input) => {
  // More conservative line collapsing - only merge when absolutely necessary
  const lines = input.split('\n');
  const output = [];
  let buffer = '';
  const bulletPattern = /^[\-\*\u2022\u25AA\u25B6]\s+/;
  const dateRangePattern = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*\d{4}|present|current|\d{2}\/\d{4})\s*(?:-|\u2013|\u2014|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*\d{4}|present|current|\d{2}\/\d{4})/i;

  const flushBuffer = () => {
    if (buffer) {
      output.push(buffer.trim());
      buffer = '';
    }
  };

  // Check if a line should NEVER be merged with others
  const shouldNeverMerge = (line, index = 0) =>
    bulletPattern.test(line)  // Bullet points
    || isHeadingCandidate(line)  // Section headings
    || isUppercaseLine(line)  // All caps lines (likely companies/headings)
    || dateRangePattern.test(line)  // Lines with date ranges
    || actionVerbPattern.test(line)  // Lines starting with action verbs
    || (index < 5 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(line))  // Name-like lines at top
    || (line.length > 0 && line === line.toUpperCase() && line.length < 50)  // Short all-caps lines
    || /^[A-Z][a-z]+.*\([^)]*\)/.test(line)  // Lines with parentheses (likely job headers)
    || line.includes('|');  // Lines with pipes (likely structured data)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushBuffer();
      output.push('');
      continue;
    }

    // Check if this line should never be merged
    if (shouldNeverMerge(line, i)) {
      flushBuffer();
      output.push(line);
      continue;
    }

    // Only merge if:
    // 1. We have a buffer
    // 2. The current line looks like a continuation (starts with lowercase or is short)
    // 3. The buffer itself is not something that should stay separate
    if (buffer && !shouldNeverMerge(buffer, i - 1)) {
      const startsLowercase = /^[a-z]/.test(line);
      const isShortFragment = line.length < 30 && !line.endsWith('.');

      // Only merge if it really looks like a continuation
      if (startsLowercase || (isShortFragment && buffer.endsWith('-'))) {
        if (buffer.endsWith('-')) {
          buffer = buffer + line;  // Merge without space for hyphenated words
        } else {
          buffer = `${buffer} ${line}`;
        }
        continue;
      }
    }

    // If we get here, start a new line
    flushBuffer();
    buffer = line;
  }

  flushBuffer();
  return output.join('\n').replace(/\n{3,}/g, '\n\n');
};

const reconstructCanonicalSections = (text) => {
  const cleaned = collapseWrappedLines(text.replace(/\n{3,}/g, '\n\n'));
  const lines = cleaned.split('\n');
  const rawCandidates = [];
  const acceptedHeadings = [];
  const lastBySection = new Map();
  const dedupeWindow = 6;

  lines.forEach((line, index) => {
    if (!isHeadingCandidate(line)) return;
    const normalized = normalizeHeadingToken(line.trim());
    const section = headingLookup.get(normalized);
    if (!section) return;
    rawCandidates.push({ index, line: line.trim(), normalized, section });
    const lastIndex = lastBySection.get(section);
    if (lastIndex !== undefined && index - lastIndex <= dedupeWindow) {
      return;
    }
    lastBySection.set(section, index);
    acceptedHeadings.push({ index, line: line.trim(), normalized, section });
  });

  if (acceptedHeadings.length === 0) {
    return {
      success: false,
      headerText: '',
      sections: {},
      rawBlocks: cleaned.split(/\n{2,}/).map(block => block.trim()).filter(Boolean),
      debug: { rawCandidates, acceptedHeadings, chosenHeadings: [] }
    };
  }

  const sortedCandidates = [...acceptedHeadings].sort((a, b) => a.index - b.index);
  const candidatesWithSpan = sortedCandidates.map((candidate, idx) => {
    const next = sortedCandidates[idx + 1];
    return {
      ...candidate,
      span: (next ? next.index : lines.length) - candidate.index
    };
  });

  const bestBySection = new Map();
  candidatesWithSpan.forEach((candidate) => {
    const existing = bestBySection.get(candidate.section);
    if (!existing || candidate.span > existing.span) {
      bestBySection.set(candidate.section, candidate);
      return;
    }
    if (candidate.span === existing.span && candidate.index < existing.index) {
      bestBySection.set(candidate.section, candidate);
    }
  });

  const chosenHeadings = Array.from(bestBySection.values()).sort((a, b) => a.index - b.index);
  if (chosenHeadings.length === 0) {
    return {
      success: false,
      headerText: '',
      sections: {},
      rawBlocks: cleaned.split(/\n{2,}/).map(block => block.trim()).filter(Boolean),
      debug: { rawCandidates, acceptedHeadings, chosenHeadings: [] }
    };
  }
  const sections = {
    summaryText: '',
    skillsText: '',
    experienceText: '',
    educationText: '',
    projectsText: '',
    certificationsText: ''
  };

  const headerText = lines.slice(0, chosenHeadings[0].index).join('\n').trim();

  chosenHeadings.forEach((heading, idx) => {
    const next = chosenHeadings[idx + 1];
    const start = heading.index + 1;
    const end = next ? next.index : lines.length;
    const content = lines.slice(start, end).join('\n').trim();
    const key = `${heading.section}Text`;
    if (key in sections && !sections[key]) {
      sections[key] = content;
    }
  });

  return {
    success: true,
    headerText,
    sections,
    rawBlocks: cleaned.split(/\n{2,}/).map(block => block.trim()).filter(Boolean),
    debug: { rawCandidates, acceptedHeadings, chosenHeadings }
  };
};
/**
 * Advanced section detection using multiple strategies
 * @param {string} text - Resume text
 * @returns {Object} Detected sections with boundaries
 */
function detectSections(text) {
  const sections = {
    personalInfo: { start: 0, end: -1, content: '' },
    summary: { start: -1, end: -1, content: '' },
    experience: { start: -1, end: -1, content: '' },
    education: { start: -1, end: -1, content: '' },
    skills: { start: -1, end: -1, content: '' },
    projects: { start: -1, end: -1, content: '' },
    certifications: { start: -1, end: -1, content: '' },
    awards: { start: -1, end: -1, content: '' },
    publications: { start: -1, end: -1, content: '' },
    languages: { start: -1, end: -1, content: '' },
    other: { start: -1, end: -1, content: '' }
  };

  const lines = text.split('\n');
  const sectionAliases = canonicalSectionAliases;

  const normalizeHeading = (line) =>
    line
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

  const isDividerLine = (line) => /^[\-=_.]{3,}$/.test(line.trim());

  const normalizedAliases = Object.fromEntries(
    Object.entries(sectionAliases).map(([section, aliases]) => [
      section,
      aliases.map((alias) => normalizeHeading(alias))
    ])
  );

  const aliasLookup = new Map();
  Object.entries(normalizedAliases).forEach(([section, aliases]) => {
    aliases.forEach((alias) => aliasLookup.set(alias, section));
  });

  const isMostlyLetters = (value) => {
    if (!value) return false;
    const lettersSpaces = (value.match(/[A-Za-z\s]/g) || []).length;
    return lettersSpaces / value.length >= 0.85;
  };

  const isStrictHeading = (trimmed, normalized) => {
    if (!normalized) return false;
    if (trimmed.length > 40) return false;
    if (!isMostlyLetters(trimmed)) return false;
    if (/PAGE BREAK|\[\[PAGE_BREAK\]\]/i.test(trimmed)) return false;
    return aliasLookup.has(normalized);
  };

  const isAliasCandidate = (normalized, trimmed) => {
    if (!normalized) return false;
    // Heading must be relatively short or at least start with a known alias
    if (trimmed.length > 50) return false;
    for (const alias of aliasLookup.keys()) {
      if (normalized === alias) return true;
      if (normalized.startsWith(alias + ' ')) return true;
    }
    return false;
  };

  const matchHeading = (line, nextLine) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Pattern 1: Exact match on line (normalized)
    const normalized = normalizeHeading(trimmed);
    if (isStrictHeading(trimmed, normalized)) {
      return aliasLookup.get(normalized);
    }

    // Pattern 2: Line starts with HEADING followed by : or , or \n
    // This handles cases where the PDF text extraction merges the header with content
    for (const [alias, section] of aliasLookup.entries()) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Look for alias at start of line, followed by non-alphanumeric (like comma, colon, or space)
      const regex = new RegExp(`^${escapedAlias}(?:[:;,\\s]|$)`, 'i');
      if (regex.test(trimmed)) {
        // Additional check: Don't match mid-sentence "experience"
        // If it's not all-caps, it MUST be followed by a colon or be on a short line
        const isAllCaps = trimmed.startsWith(alias); // alias is already upper-cased
        const hasSeparator = /^[^A-Za-z0-9]/.test(trimmed.substring(alias.length).trim());

        if (isAllCaps || hasSeparator || trimmed.length < alias.length + 10) {
          return section;
        }
      }
    }

    return null;
  };

  sections.personalInfo.start = 0;
  const headingCandidates = [];
  const rawHeadingCandidates = [];
  const acceptedHeadingCandidates = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    const nextLine = lines[index + 1] || '';
    const normalized = normalizeHeading(trimmedLine);
    if (isAliasCandidate(normalized, trimmedLine)) {
      rawHeadingCandidates.push({
        line: trimmedLine,
        normalized,
        index
      });
    }
    const matchedSection = matchHeading(trimmedLine, nextLine);
    if (!matchedSection) return;

    const skipNextDivider = nextLine && isDividerLine(nextLine);
    const newStart = index + 1 + (skipNextDivider ? 1 : 0);
    const candidate = {
      section: matchedSection,
      line: trimmedLine,
      normalized,
      index,
      startIndex: newStart,
      hasDivider: Boolean(skipNextDivider)
    };
    headingCandidates.push(candidate);
    acceptedHeadingCandidates.push(candidate);
  });

  const sortedCandidates = [...headingCandidates].sort((a, b) => a.index - b.index);
  const candidatesWithSpan = sortedCandidates.map((candidate, idx) => {
    const next = sortedCandidates[idx + 1];
    const endIndex = next ? next.index : lines.length;
    const span = Math.max(0, endIndex - candidate.startIndex);
    return { ...candidate, endIndex, span };
  });

  const chosenBySection = new Map();
  candidatesWithSpan.forEach((candidate) => {
    const existing = chosenBySection.get(candidate.section);
    if (!existing) {
      chosenBySection.set(candidate.section, candidate);
      return;
    }
    if (candidate.span > existing.span) {
      chosenBySection.set(candidate.section, candidate);
      return;
    }
    if (candidate.span === existing.span && candidate.index < existing.index) {
      chosenBySection.set(candidate.section, candidate);
    }
  });

  const chosenHeadings = Array.from(chosenBySection.values()).sort((a, b) => a.index - b.index);

  chosenHeadings.forEach((heading, idx) => {
    const next = chosenHeadings[idx + 1];
    const endIndex = next ? next.index : lines.length;
    sections[heading.section].start = heading.startIndex;
    sections[heading.section].end = endIndex;
    sections[heading.section].content = lines
      .slice(heading.startIndex, endIndex)
      .join('\n')
      .trim();
  });

  if (chosenHeadings.length > 0) {
    sections.personalInfo.end = chosenHeadings[0].index;
    sections.personalInfo.content = lines
      .slice(0, sections.personalInfo.end)
      .join('\n')
      .trim();
  } else {
    sections.personalInfo.end = lines.length;
    sections.personalInfo.content = lines.join('\n').trim();
  }

  sections._debug = {
    rawHeadingCandidates,
    acceptedHeadingCandidates,
    headings: candidatesWithSpan.map((entry) => ({
      section: entry.section,
      line: entry.line,
      normalized: entry.normalized,
      index: entry.index,
      span: entry.span
    })),
    chosenHeadings: chosenHeadings.map((entry) => ({
      section: entry.section,
      line: entry.line,
      normalized: entry.normalized,
      index: entry.index,
      span: entry.span
    }))
  };
  return sections;
}

/**
 * Extract personal information with improved patterns
 * @param {string} text - Personal info section text
 * @returns {Object} Structured personal information
 */
function parsePersonalInfo(text) {
  const info = {
    name: null,
    email: null,
    phone: null,
    address: null,
    linkedin: null,
    github: null,
    portfolio: null,
    links: [],
    other: []
  };

  if (!text) return info;

  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // Enhanced email detection
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})/);
  if (emailMatch) info.email = emailMatch[1];

  // Enhanced phone detection
  const phonePatterns = [
    /(\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})/,
    /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
    /(\d{10})/
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.phone = match[1];
      break;
    }
  }

  // Social links
  const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i);
  if (linkedinMatch) info.linkedin = linkedinMatch[1];

  const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9-]+)/i);
  if (githubMatch) info.github = githubMatch[1];

  // Name detection - improved
  // Look for name candidate in lines that don't have contact info
  const nameCandidate = lines.find(l => {
    const tr = l.trim();
    if (tr.length < 3 || tr.length > 150) return false;

    // Check if the line *starts* with something that looks like an all-caps name (multiple words)
    // or is just a multi-word all-caps line.
    const allCapsWordsMatch = tr.match(/^([A-Z]{2,}(?:\s+[A-Z]{2,})+)(?:\s|[|@\d]|$)/);
    if (allCapsWordsMatch && allCapsWordsMatch[1].trim().length > 3) {
      return true;
    }

    // Filter out obvious contact info lines that don't start with a name
    if (tr.includes('@') || tr.includes('linkedin.com') || tr.includes('github.com')) return false;

    if (tr.match(/\d/)) return false; // Avoid lines with numbers
    return true;
  });

  if (nameCandidate) {
    const tr = nameCandidate.trim();
    const allCapsWordsMatch = tr.match(/^([A-Z]{2,}(?:\s+[A-Z]{2,})+)(?:\s|[|@\d]|$)/);
    if (allCapsWordsMatch) {
      info.name = allCapsWordsMatch[1].trim();
    } else {
      info.name = tr.replace(/[*_`#]+/g, '').trim();
    }
  }

  // Location/Address
  const addressPatterns = [
    /([A-Z][a-z]+(?: [A-Z][a-z]+)?,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /([A-Z][a-z]+(?: [A-Z][a-z]+)*,\s*[A-Z][a-z]+(?: [A-Z][a-z]+)*)/
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.address = match[1];
      break;
    }
  }

  return info;
}

/**
 * Parse experience section with multiple format support
 * @param {string} text - Experience section text
 * @returns {Array} Array of job objects
 */
function parseExperience(text) {
  const result = {
    entries: [],
    confidence: 'low',
    fallbackReason: null,
    debug: {
      candidates: 0,
      accepted: 0,
      rejected: 0
    }
  };

  if (!text || !text.trim()) {
    result.fallbackReason = 'empty experience section';
    return result;
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const bulletPattern = /^[\-\*\u2022]+\s+/;
  const dateRangePattern = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*\d{4}|present|current|\d{2}\/\d{4})\s*(?:-|\u2013|\u2014|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*\d{4}|present|current|\d{2}\/\d{4})/i;

  const isDateLine = (line) => dateRangePattern.test(line) && !bulletPattern.test(line);
  const isHeadingLine = (line) => isHeadingCandidate(line);

  const isUppercaseCompanyLine = (line) => {
    if (!line) return false;
    const clean = line.replace(/[.,;:\-\s]+$/, '').trim();
    if (clean.length < 2 || clean.length > 80) return false;
    if (clean.includes(',')) return false;
    return isUppercaseLine(clean);
  };

  const isRoleCandidate = (line) => {
    if (!line) return false;
    if (isHeadingLine(line)) return false;
    if (isUppercaseCompanyLine(line)) return false;
    if (bulletPattern.test(line)) return false;
    if (isDateLine(line)) return false;
    if (line.length > 80) return false;
    return true;
  };

  const dateIndexes = [];
  lines.forEach((line, idx) => {
    if (isDateLine(line)) {
      dateIndexes.push(idx);
    }
  });

  if (dateIndexes.length === 0) {
    result.fallbackReason = 'no date ranges detected';
    return result;
  }

  // Removed the "too many dates" rejection - long resumes can have many job entries
  const tooManyDates = false; // Always false now - we want to parse all entries

  result.debug.candidates = dateIndexes.length;

  const jobs = [];

  dateIndexes.forEach((dateIndex, index) => {
    const line = lines[dateIndex];
    const dateMatch = line.match(dateRangePattern);
    const dateValue = dateMatch ? dateMatch[0] : '';
    let roleLine = dateMatch ? line.replace(dateMatch[0], '').trim() : line.trim();

    // Improved company/role extraction
    let companyLine = '';
    let roleFromAbove = '';
    let companyFromAbove = '';

    // Clean roleLine if it contains unnecessary info
    if (roleLine.length > 80) {
      // If the date line itself is very long, it likely merged with following content
      roleLine = roleLine.substring(0, 80).trim();
    }

    // Look backward for role and company
    for (let offset = 1; offset <= 3; offset++) {
      const candidate = lines[dateIndex - offset];
      if (!candidate) continue;
      if (isHeadingLine(candidate)) break;

      // Heuristic: Company is often upper-case or follows "at" or is on a line with location
      // CRITICAL: Ensure it's not a bullet point line
      const isBullet = bulletPattern.test(candidate);
      if (!companyFromAbove && !isBullet && (isUppercaseCompanyLine(candidate) || (candidate.includes(',') && !candidate.match(actionVerbPattern)))) {
        companyFromAbove = candidate.trim();
      } else if (!roleFromAbove && !isBullet && isRoleCandidate(candidate)) {
        roleFromAbove = candidate.trim();
      }
    }

    // Look forward for company if not found
    for (let i = dateIndex + 1; i < lines.length; i++) {
      const candidate = lines[i];
      if (!candidate || isDateLine(candidate) || isHeadingLine(candidate)) break;
      if (bulletPattern.test(candidate)) break;
      if (!companyFromAbove && isUppercaseCompanyLine(candidate)) {
        companyLine = candidate.trim();
        break;
      }
    }

    let title = roleLine || roleFromAbove;
    let company = companyLine || companyFromAbove;

    // Final cleanup: if title seems to have merged with company (e.g. "Software Engineer VOCTRUM")
    if (title && !company) {
      const parts = title.split(/\s+at\s+|\s+[-–—]\s+|\s{2,}/i);
      if (parts.length > 1) {
        title = parts[0].trim();
        company = parts[1].trim();
      } else {
        // Check for Title CASE followed by UPPER CASE
        const capsMatch = title.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Z]{2,}(?:\s+[A-Z]{2,})*)$/);
        if (capsMatch) {
          title = capsMatch[1].trim();
          company = capsMatch[2].trim();
        }
      }
    }

    // Final cleanup for title and company
    const finalTitle = (title || '').replace(/[.,;:\-\s]+$/, '').trim();
    const finalCompany = (company || '').replace(/[.,;:\-\s]+$/, '').trim();

    const entry = {
      title: finalTitle,
      company: finalCompany,
      location: '',
      duration: dateValue,
      description: []
    };

    const nextDateIndex = dateIndexes[index + 1] ?? lines.length;
    for (let i = dateIndex + 1; i < nextDateIndex; i++) {
      const candidate = lines[i];
      if (!candidate || isHeadingLine(candidate) || isDateLine(candidate)) break;
      if (bulletPattern.test(candidate)) {
        // Special case: "COMPANY-Bullet content"
        const companyMatch = candidate.match(/^([A-Z][A-Z\s&]{2,})[\-\*\u2022]/);
        if (companyMatch && !entry.company) {
          entry.company = companyMatch[1].trim();
        }

        let cleaned = candidate.replace(bulletPattern, '').trim();
        // If we caught a company prefix, remove it from the bullet content
        if (companyMatch) {
          cleaned = cleaned.replace(/^([A-Z][A-Z\s&]{2,})[\-\*\u2022]\s*/, '').trim();
        }

        if (cleaned) {
          entry.description.push(cleaned);
        }
      }
    }

    const hasRole = Boolean(entry.title);
    const hasCompany = Boolean(entry.company);
    const hasBullets = entry.description.length > 0;

    if (tooManyDates && (!hasRole || !hasCompany)) {
      result.debug.rejected += 1;
      return;
    }

    const signals = (hasRole ? 1 : 0) + (hasCompany ? 1 : 0) + (hasBullets ? 1 : 0);
    if (signals < 2) {
      result.debug.rejected += 1;
      return;
    }

    jobs.push(entry);
    result.debug.accepted += 1;
  });

  result.entries = jobs;

  if (jobs.length === 0) {
    result.confidence = 'low';
    result.fallbackReason = result.fallbackReason || 'no confident entries';
    return result;
  }

  // Removed the "too many entries" check - long resumes should be fully parsed
  // if (jobs.length > 12) {
  //   result.confidence = 'low';
  //   result.fallbackReason = result.fallbackReason || 'too many entries';
  //   return result;
  // }

  const bulletless = jobs.filter(job => job.description.length === 0).length;
  const missingRoles = jobs.filter(job => !job.title).length;
  const missingCompanies = jobs.filter(job => !job.company).length;

  if (jobs.length >= 2 && missingRoles === 0 && missingCompanies <= 1) {
    result.confidence = bulletless > 0 ? 'medium' : 'high';
  } else {
    result.confidence = 'low';
    result.fallbackReason = result.fallbackReason || 'insufficient role/company coverage';
  }

  return result;
}

/**
 * Parse education section
 * @param {string} text - Education section text
 * @returns {Array} Array of education objects
 */
function parseEducation(text) {
  const result = {
    entries: [],
    confidence: 'low',
    rawText: ''
  };

  if (!text || !text.trim()) {
    return result;
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const contentLines = lines.filter(line => !line.match(/^education/i));

  const degreePattern = /\b(b\.?tech|b\.?e|b\.?sc|b\.?a|m\.?sc|m\.?a|m\.?tech|mba|phd|doctorate|bachelor|master|associate|diploma|certificate)\b/i;
  const yearRangePattern = /((?:19|20)\d{2})(?:\s*[-–—]\s*((?:19|20)\d{2}|present|current))?/i;
  const expectedPattern = /expected\s+[a-z]+\s+\d{4}/i;
  const monthYearPattern = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{4}\b/i;
  const institutionKeywordPattern = /(university|college|institute|school|academy|polytechnic|campus)/i;

  const isInstitutionLike = (value) => {
    if (!value) return false;
    if (institutionKeywordPattern.test(value)) return true;
    const words = value.split(/\s+/);
    if (words.length < 2 || words.length > 6) return false;
    return words.every((word) => /^[A-Za-z][A-Za-z'.-]*$/.test(word));
  };

  const splitSegments = (line) =>
    line
      .split(/[|•·]/)
      .map(seg => seg.trim())
      .filter(Boolean);

  const entries = [];
  const leftovers = [];

  contentLines.forEach((line) => {
    const segments = splitSegments(line);
    segments.forEach((segment) => {
      const degreeMatch = segment.match(degreePattern);
      const yearMatch = segment.match(yearRangePattern)
        || segment.match(expectedPattern)
        || segment.match(monthYearPattern)
        || segment.match(/\b(19|20)\d{2}\b/);

      const dates = yearMatch ? yearMatch[0].trim() : '';
      const degree = degreeMatch ? degreeMatch[0].trim() : '';

      let institution = segment;
      if (degreeMatch) {
        institution = institution.replace(degreeMatch[0], '');
      }
      if (yearMatch) {
        institution = institution.replace(yearMatch[0], '');
      }

      institution = institution
        .replace(/[\(\),]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (institution && isInstitutionLike(institution) && (degree || dates)) {
        entries.push({
          institution,
          degree,
          year: dates,
          gpa: null,
          details: []
        });
      } else {
        leftovers.push(segment);
      }
    });
  });

  if (entries.length === 0) {
    result.rawText = text.trim();
    result.entries = [];
    return result;
  }

  result.entries = entries;
  result.confidence = leftovers.length > entries.length ? 'low' : 'medium';
  return result;
}

/**
 * Parse projects section with strict title + bullets gating
 * @param {string} text - Projects section text
 * @returns {Array} Array of project objects
 */
function parseProjects(text) {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const bulletPattern = /^[\-\*\u2022]+\s+/;
  const dateRangePattern = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*\d{4}|present|current|\d{2}\/\d{4})\s*(?:-|\u2013|\u2014|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\s*\d{4}|present|current|\d{2}\/\d{4})/i;

  const projects = [];
  let current = null;

  const isTitleCandidate = (line) => {
    if (!line) return false;
    if (bulletPattern.test(line)) return false;
    if (/^https?:\/\//i.test(line)) return false;
    if (dateRangePattern.test(line)) return false;
    if (isHeadingCandidate(line)) return false;
    if (line.length > 90) return false;
    const words = line.split(/\s+/);
    if (words.length > 10) return false;
    const lettersOnly = line.replace(/[^A-Za-z]/g, '');
    if (!lettersOnly) return false;
    const uppercaseCount = lettersOnly.replace(/[^A-Z]/g, '').length;
    const uppercaseRatio = uppercaseCount / lettersOnly.length;
    const titleCase = words.every((word) => /^[A-Z][A-Za-z0-9&().-]*$/.test(word));
    return uppercaseRatio >= 0.6 || titleCase;
  };

  const flushCurrent = () => {
    if (current && current.name && current.bullets.length > 0) {
      projects.push(current);
    }
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (/^projects/i.test(line)) {
      continue;
    }

    if (isTitleCandidate(line)) {
      flushCurrent();
      current = {
        name: line.replace(/:\s*$/, '').trim(),
        description: '',
        bullets: [],
        tech: []
      };
      continue;
    }

    if (bulletPattern.test(line)) {
      if (current) {
        const cleaned = line.replace(bulletPattern, '').trim();
        if (cleaned) {
          current.bullets.push(cleaned);
        }
      }
      continue;
    }

    if (current && /^https?:\/\//i.test(line)) {
      current.link = line.trim();
      continue;
    }

    if (current && line) {
      current.bullets.push(line.trim());
    }
  }

  flushCurrent();
  return projects;
}

/**
 * Parse skills section with categorization
 * @param {string} text - Skills section text
 * @returns {Object} Categorized skills
 */
function parseSkills(text) {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const verbPattern = /\b(led|managed|built|created|designed|implemented|developed|optimized|integrated|collaborated|delivered|contributed|worked)\b/i;
  const datePattern = /\b(19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i;
  const bannedWordPattern = /\bengineer\b/i;

  const rawTokens = [];

  lines.forEach((line) => {
    if (verbPattern.test(line)) return;
    if (datePattern.test(line)) return;

    // Check if line followed a header that contains skills
    const cleaned = line.replace(/^[\s\-\*\+\u2022\u25AA\u25B6]+/, '').trim();
    if (!cleaned) return;

    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      const skillPart = parts.length > 1 ? parts[1].trim() : parts[0].trim();
      rawTokens.push(...skillPart.split(/[,\|;/]|\s{2,}/));
    } else if (cleaned.includes(',') || cleaned.includes('|') || cleaned.includes(';') || cleaned.includes('/')) {
      rawTokens.push(...cleaned.split(/[,\|;/]|\s{2,}/));
    } else if (cleaned.split(/\s+/).length > 4) {
      // Fallback for single-space separated list
      rawTokens.push(...cleaned.split(/\s+/));
    } else {
      // Space separated fallback
      const words = cleaned.split(/\s{2,}/).filter(w => w.length > 1);
      if (words.length > 1) {
        rawTokens.push(...words);
      } else {
        rawTokens.push(cleaned);
      }
    }
  });

  const normalized = new Set();
  rawTokens.forEach((token) => {
    const cleaned = token
      .replace(/^[\s\-\*\+\u2022\u25AA\u25B6]+/, '')
      .replace(/[.;]+$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!cleaned) return;
    if (verbPattern.test(cleaned)) return;
    if (datePattern.test(cleaned)) return;
    if (cleaned.length > 50) return;
    if (cleaned.length < 2) return;
    normalized.add(cleaned);
  });

  return Array.from(normalized);
}

/**
 * Parse certifications section
 * @param {string} text - Certifications section text
 * @returns {Array} Array of certification objects
 */
function parseCertifications(text) {
  if (!text || !text.trim()) return [];
  const certifications = [];
  const seen = new Set();

  const cleanText = text.replace(/^(certifications?|certificates?)\s*:?\s*/i, '');
  // Replace long spaces or mid-line dashes with newlines to catch multiple certs on one line
  const normalizedText = cleanText.replace(/\s{3,}|(?<=[a-z])\s+[-–—]\s+(?=[A-Z])/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(Boolean);
  const bulletPattern = /^[\s\-\*\+]+/;
  const verbPattern = /\b(implemented|executed|developed|optimized|collaborated|contributed|led|designed|built|supported|integrated|managed|created|delivered|worked)\b/i;

  lines.forEach((line) => {
    const cleaned = line.replace(bulletPattern, '').trim();
    if (!cleaned || cleaned.length < 3) return;
    if (/PAGE BREAK|\[\[PAGE_BREAK\]\]/i.test(cleaned)) return;

    // Increased tolerance for long lines if they contain common certification keywords
    const wordCount = cleaned.split(/\s+/).length;
    const isLikelyCert = /badge|certified|certification|certificate|foundation|architect|practitioner|associate|professional/i.test(cleaned);

    if (wordCount > 15 && !isLikelyCert) return;
    if (cleaned.length > 200) return;
    if (verbPattern.test(cleaned) && !isLikelyCert) return;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const match = cleaned.match(/^(.+?)\s*[-—–]\s*(.+?)\s*\((.+?)\)/) || cleaned.match(/^(.+?)\s*[-—–]\s*(.+)/);
    if (match) {
      certifications.push({
        name: match[1].trim(),
        issuer: match[2].trim(),
        date: match[3] ? match[3].trim() : null
      });
      return;
    }

    certifications.push({
      name: cleaned,
      issuer: null,
      date: null
    });
  });

  return certifications;
}

/**
 * Main enhanced resume parsing function
 * @param {string} resumeText - Raw resume text
 * @returns {Object} Structured resume data
 */
export function parseResumeToStructuredJSON(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
    throw new Error('Invalid resume text input');
  }

  console.log(' Starting advanced resume parsing...');

  const sanitizedText = sanitizeResumeText(resumeText);
  const canonical = reconstructCanonicalSections(sanitizedText);

  const cleanedTextLines = collapseWrappedLines(sanitizedText).split('\n');
  console.log('--- CLEANED LINES START ---');
  console.log(cleanedTextLines.slice(0, 50).join('\n'));
  console.log('--- CLEANED LINES END ---');

  console.log('--- CANONICAL HEADER START ---');
  console.log(canonical.headerText);
  console.log('--- CANONICAL HEADER END ---');
  const rawSummary = canonical.debug.rawCandidates
    .map((entry) => `${entry.section}@${entry.index}:${entry.normalized}`)
    .join(' | ');
  console.log(` [Parser] Raw heading candidates: ${rawSummary || 'none'}`);

  const acceptedSummary = canonical.debug.acceptedHeadings
    .map((entry) => `${entry.section}@${entry.index}:${entry.normalized}`)
    .join(' | ');
  console.log(` [Parser] Accepted headings: ${acceptedSummary || 'none'}`);

  const chosenSummary = (canonical.debug.chosenHeadings || [])
    .map((entry) => `${entry.section}@${entry.index}:${entry.normalized}`)
    .join(' | ');
  console.log(` [Parser] Chosen headings: ${chosenSummary || 'none'}`);

  const totalLines = sanitizedText.split('\n').length;
  if ((canonical.debug.chosenHeadings || []).length > 0) {
    const boundaries = [...canonical.debug.chosenHeadings]
      .sort((a, b) => a.index - b.index)
      .map((heading, idx, arr) => {
        const end = arr[idx + 1]?.index ?? totalLines;
        return `${heading.section}(${heading.index}-${end})`;
      })
      .join(' | ');
    console.log(` [Parser] Section boundaries: ${boundaries}`);
  }

  if (!canonical.success) {
    console.log(' [Parser] Canonical section reconstruction failed. Returning raw blocks.');
    return {
      metadata: {
        parsedAt: new Date().toISOString(),
        originalLength: sanitizedText.length,
        sectionsFound: [],
        reconstructionFailed: true
      },
      personalInfo: parsePersonalInfo(canonical.rawBlocks[0] || ''),
      summary: null,
      summaryRawText: canonical.rawBlocks[0] || '',
      skills: [],
      skillsRawText: canonical.rawBlocks.join('\n\n'),
      experience: [],
      experienceRawText: canonical.rawBlocks.join('\n\n'),
      education: [],
      educationRawText: canonical.rawBlocks.join('\n\n'),
      projects: [],
      projectsRawText: canonical.rawBlocks.join('\n\n'),
      certifications: [],
      certificationsRawText: canonical.rawBlocks.join('\n\n')
    };
  }

  const sections = canonical.sections;
  const experienceResult = parseExperience(sections.experienceText);
  const educationResult = parseEducation(sections.educationText);
  const skills = parseSkills(sections.skillsText);
  const projects = parseProjects(sections.projectsText);
  const certifications = parseCertifications(sections.certificationsText);
  const useEducationEntries = educationResult.confidence === 'low'
    ? []
    : educationResult.entries;
  const summaryText = sections.summaryText.trim();

  const parsedResume = {
    metadata: {
      parsedAt: new Date().toISOString(),
      originalLength: sanitizedText.length,
      sectionsFound: Object.entries(sections)
        .filter(([, value]) => value && value.trim().length > 0)
        .map(([key]) => key)
    },
    personalInfo: parsePersonalInfo(canonical.headerText),
    summary: summaryText || null,
    experience: experienceResult.entries,
    education: useEducationEntries,
    skills,
    projects,
    certifications
  };

  if (!summaryText && sections.summaryText.trim()) {
    parsedResume.summaryRawText = sections.summaryText.trim();
  }

  if (skills.length === 0 && sections.skillsText.trim()) {
    parsedResume.skillsRawText = sections.skillsText.trim();
  }

  if (projects.length === 0 && sections.projectsText.trim()) {
    parsedResume.projectsRawText = sections.projectsText.trim();
  }

  if (certifications.length === 0 && sections.certificationsText.trim()) {
    parsedResume.certificationsRawText = sections.certificationsText.trim();
  }

  console.log(` [Parser] Experience entries extracted: ${parsedResume.experience.length}`);
  console.log(` [Parser] Experience confidence: ${experienceResult.confidence}`);
  if (experienceResult.debug) {
    console.log(` [Parser] Experience candidates: ${experienceResult.debug.candidates}, accepted: ${experienceResult.debug.accepted}, rejected: ${experienceResult.debug.rejected}`);
  }
  if (experienceResult.fallbackReason) {
    console.log(` [Parser] Experience fallback reason: ${experienceResult.fallbackReason}`);
  }
  if ((parsedResume.experience.length === 0 || experienceResult.confidence === 'low') && sections.experienceText) {
    parsedResume.experienceRawText = sections.experienceText.trim();
  }

  if (educationResult.confidence === 'low' && sections.educationText) {
    parsedResume.educationRawText = sections.educationText.trim();
  }

  console.log(` Parsed resume with ${parsedResume.experience.length} jobs, ${parsedResume.education.length} degrees, ${Object.values(parsedResume.skills).flat().length} skills`);

  return parsedResume;
}

/**
 * Export parsed resume as clean, formatted JSON
 * @param {Object} parsedResume - Structured resume object
 * @returns {string} Formatted JSON string
 */
export function exportParsedResumeAsJSON(parsedResume) {
  return JSON.stringify(parsedResume, null, 2);
}

/**
 * Generate a summary of the parsing results
 * @param {Object} parsedResume - Structured resume object
 * @returns {Object} Parsing summary
 */
export function generateParsingSummary(parsedResume) {
  return {
    candidateName: parsedResume.personalInfo.name,
    contactComplete: !!(parsedResume.personalInfo.email && parsedResume.personalInfo.phone),
    experienceYears: parsedResume.experience.length,
    educationCount: parsedResume.education.length,
    skillsCount: Object.values(parsedResume.skills).flat().length,
    certificationsCount: parsedResume.certifications.length,
    sectionsDetected: parsedResume.metadata.sectionsFound,
    completeness: {
      hasContact: !!(parsedResume.personalInfo.email || parsedResume.personalInfo.phone),
      hasSummary: !!parsedResume.summary,
      hasExperience: parsedResume.experience.length > 0,
      hasEducation: parsedResume.education.length > 0,
      hasSkills: Object.values(parsedResume.skills).flat().length > 0
    }
  };
}

















