/**
 * Enhanced Resume Parser with Structure Preservation
 * Handles different resume formats while maintaining original page count and density
 */


/**
 * Parse resume sections from text with enhanced structure awareness
 * @param {string} resumeText - Raw resume text
 * @param {object} structure - File structure metadata
 * @returns {object} Parsed resume sections with structure info
 */
export function parseResumeWithStructure(rawResumeText, structure = {}) {
  // Globally strip internal structural markers that confuse section parsing and bullet extraction
  const resumeText = (rawResumeText || '')
    .replace(/--- PAGE BREAK ---/g, '\n')
    .replace(/=== PAGE BREAK ===/g, '\n');

  console.log(` [Enhanced Parser] Starting parse with ${structure.originalPageCount || structure.estimatedPageCount || 1} pages...`);

  const sections = {
    personalInfo: null,
    summary: null,
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    awards: [],
    publications: [],
    domains: [],
    other: [],
    structure: structure,
    formatInfo: {
      originalPageCount: structure.originalPageCount || structure.estimatedPageCount || 1,
      isMultiPage: (structure.originalPageCount || structure.estimatedPageCount || 1) > 1,
      preserveOriginalDensity: true
    }
  };

  // Extract personal information with enhanced patterns
  sections.personalInfo = extractPersonalInfo(resumeText);
  console.log(` [Enhanced Parser] Personal info extracted: ${sections.personalInfo.name || 'Unknown'}`);

  // Extract summary/objective
  sections.summary = extractSummary(resumeText);
  if (sections.summary) {
    console.log(` [Enhanced Parser] Summary extracted: ${sections.summary.substring(0, 100)}...`);
  }

  // Enhanced experience extraction with multiple format support
  sections.experience = extractExperienceWithPatterns(resumeText);
  console.log(` [Enhanced Parser] Experience entries extracted: ${sections.experience.length}`);

  // Extract education with improved parsing
  sections.education = extractEducation(resumeText);
  console.log(` [Enhanced Parser] Education entries extracted: ${sections.education.length}`);

  // Extract skills with context awareness
  sections.skills = extractSkills(resumeText);
  console.log(` [Enhanced Parser] Skills extracted: ${sections.skills.length}`);

  // Extract projects
  sections.projects = extractProjects(resumeText);
  console.log(` [Enhanced Parser] Projects extracted: ${sections.projects.length}`);

  // Enhanced certifications extraction
  sections.certifications = extractCertifications(resumeText);
  console.log(` [Enhanced Parser] Certifications extracted: ${sections.certifications.length}`);

  // Extract achievements/awards
  sections.awards = extractAwards(resumeText);
  console.log(` [Enhanced Parser] Awards extracted: ${sections.awards.length}`);

  // Extract domains/expertise areas
  sections.domains = extractDomains(resumeText);
  console.log(` [Enhanced Parser] Domain expertise extracted: ${sections.domains.length}`);

  console.log(` [Enhanced Parser] Parse complete - preserving ${sections.formatInfo.originalPageCount} page structure`);

  return sections;
}

/**
 * Extract personal information with enhanced patterns
 * @param {string} resumeText - Resume text
 * @returns {object} Personal information
 */
function extractPersonalInfo(resumeText) {
  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const contactLines = lines.slice(0, 15); // Increased range slightly
  const contactText = contactLines.join(' ');

  // Enhanced name extraction patterns
  let name = '';

  // Pattern 1: All caps name at the beginning
  const allCapsMatch = resumeText.match(/^([A-Z][A-Z\s.-]{2,})\s*(?:\r?\n)/m);
  if (allCapsMatch && allCapsMatch[1].trim().length < 50 && allCapsMatch[1].trim().length > 2 && !allCapsMatch[1].includes('%PDF')) {
    name = allCapsMatch[1].trim();
  } else {
    // Pattern 2: Title case name (e.g., John Doe)
    const titleCaseMatch = resumeText.match(/^([A-Z][a-z0-9]+\s+[A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*)/m);
    if (titleCaseMatch && titleCaseMatch[1].length < 50 && titleCaseMatch[1].length > 2 && !titleCaseMatch[1].includes('%PDF')) {
      name = titleCaseMatch[1].trim();
    } else if (lines.length > 0) {
      // Pattern 3: First non-empty line as name, filtering out metadata and contact info
      const nameCandidate = lines.find(l => {
        const tr = l.trim();
        return tr.length > 2 &&
          tr.length < 50 &&
          !tr.startsWith('%PDF') &&
          !tr.includes('rdf:Description') &&
          !tr.includes('xmlns:') &&
          !tr.includes('<') &&
          !tr.includes('>') &&
          !tr.includes('@') &&
          !tr.includes('http') &&
          !tr.includes('|') &&
          !tr.match(/^\+?\d/);
      });
      if (nameCandidate) {
        name = nameCandidate.trim();
      }
    }
  }

  // Extract contact information with enhanced patterns
  const emailMatch = contactText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/) ||
    resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = contactText.match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/) ||
    resumeText.match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
  const linkedinMatch = contactText.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i) ||
    resumeText.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i);
  const githubMatch = contactText.match(/(github\.com\/[a-zA-Z0-9-]+)/i) ||
    resumeText.match(/(github\.com\/[a-zA-Z0-9-]+)/i);

  // Location extraction with strict patterns (City, ST or City, Country)
  // Must avoid matching sentences like "React, Node, and Firebase"
  const locationPatterns = [
    /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/,                // City, ST (e.g. New York, NY)
    /([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/         // City, Country (e.g. London, UK)
  ];

  let location = '';
  // Only look for location in top section to avoid false positives
  for (const pattern of locationPatterns) {
    const match = contactText.match(pattern);
    if (match && match[1].length < 50) {
      // Validation: exclude common coding terms if they appear
      const candidate = match[1].trim();
      if (!/react|node|js|java|python|sql|aws|cloud|erp|crm|full|stack|software|engineer/i.test(candidate)) {
        location = candidate;
        break;
      }
    }
  }

  const normalizeLink = (value) => {
    return value
      .replace(/^[\(<\[]+/, '')
      .replace(/[\])>.,;]+$/, '')
      .trim();
  };
  const urlMatches = contactText.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi) || [];
  const domainTokens = contactText
    .split(/\s+/)
    .map((token) => normalizeLink(token))
    .filter((token) => token && !token.includes('@'))
    .filter((token) => /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(token));

  const allLinks = [...urlMatches, ...domainTokens]
    .map((link) => normalizeLink(link))
    .filter(Boolean)
    // Filter out false positives like "Node.js", "React.js", "Vue.js"
    .filter(link => !/\.(js|ts|py|rb|cs|php|html|css|json)$/i.test(link))
    .filter(link => !/^(node|react|vue|next|express|angular)\./i.test(link));

  const uniqueLinks = Array.from(new Set(allLinks));
  const extraLinks = uniqueLinks.filter((link) => !/linkedin\.com|github\.com/i.test(link));
  const website = extraLinks.length > 0 ? extraLinks[0] : null;
  const links = extraLinks.length > 1 ? extraLinks.slice(1) : [];

  return {
    name: name,
    email: emailMatch ? emailMatch[1] : null,
    phone: phoneMatch ? phoneMatch[1].replace(/[-.\s]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : null,
    linkedin: linkedinMatch ? linkedinMatch[1] : null,
    github: githubMatch ? githubMatch[1] : null,
    location: location || null,
    website: website,
    links: links
  };
}

/**
 * Extract summary/objective with context preservation
 * @param {string} resumeText - Resume text
 * @returns {string|null} Summary text
 */
function extractSummary(resumeText) {
  // Multiple patterns for summary extraction
  const summaryPatterns = [
    /(?:^|\r?\n)\s*(?:EXECUTIVE SUMMARY|PROFESSIONAL SUMMARY|CAREER SUMMARY|SUMMARY OF QUALIFICATIONS|PROFILE SUMMARY|PROFESSIONAL PROFILE|CAREER PROFILE|SUMMARY|PROFILE|OBJECTIVE|ABOUT|OVERVIEW|CAREER OBJECTIVE|TECHNICAL SUMMARY|EXPERIENCE SUMMARY)\s*(?::\s*|\r?\n|$)([^]*?)(?=(?:\r?\n\s*|\s{2,})(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|PROFESSIONAL CONTOUR|WORK HISTORY|EMPLOYMENT HISTORY|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|AREA OF EXPERTISE|EDUCATION|ACADEMIC|PROJECTS|CERTIFICATIONS|AWARDS|PUBLICATIONS|LANGUAGES|$))/i
  ];

  for (const pattern of summaryPatterns) {
    const match = resumeText.match(pattern);
    if (match && match[1]) {
      let summary = match[1]
        .replace(/^(summary|profile|objective|about|overview|professional summary|career summary)\s*:?\s*/i, '')
        .trim();

      // Filter out PDF metadata that might have leaked into the summary capture
      if (summary.includes('<rdf:Description') || summary.includes('%PDF')) {
        summary = summary.split('\n').filter(line =>
          !line.includes('<rdf:Description') &&
          !line.includes('xmlns:') &&
          !line.startsWith('%PDF') &&
          !line.includes('rdf:about')
        ).join(' ').trim();
      }

      summary = summary
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ');

      if (summary.length > 0) {
        return summary;
      }
    }
  }

  // Fallback: use the intro block before the first major section heading
  const lines = resumeText.split('\n').map((line) => line.trim()).filter(Boolean);
  const headingPattern = /^(summary|professional summary|executive summary|profile|objective|about|overview|experience|work experience|professional experience|skills|education|projects|certifications|awards|publications|languages)\b/i;
  const contactPattern = /(@|linkedin\.com|github\.com|http|www\.|\+?\d[\d\s().-]{7,}\d)/i;
  const introLines = [];

  for (const line of lines) {
    if (headingPattern.test(line)) {
      break;
    }
    if (contactPattern.test(line)) {
      continue;
    }
    introLines.push(line);
  }

  const introBlock = introLines.join(' ').replace(/\s+/g, ' ').trim();
  if (introBlock.length > 80) {
    return introBlock;
  }

  return null;
}

/**
 * Enhanced experience extraction with multiple format support
 * @param {string} resumeText - Resume text
 * @returns {array} Experience entries
 */
// End of previous function


/**
 * Clean job titles and companies of common noise/boilerplate
 */
export function cleanExperienceHeaders(jobs) {
  const junkVerbs = /^(built|developed|led|implemented|managed|designed|created|engineered|integrated|migrated|optimized|delivered|spearheaded|worked|contributed|collaborated|supported|owned|everything|developer|overall)\s+(a\s+)?/i;

  const cleanStr = (s) => (s || '').replace(/^[\|\s,-]+|[\|\s,-]+$/g, '').trim();

  const splitPipedField = (value) => {
    if (!value || typeof value !== 'string') return value;
    if (!value.includes('|')) return cleanStr(value);

    // Split by pipe and filter out segments that look like description text
    const segments = value.split('|').map(s => cleanStr(s)).filter(s => {
      const isDescription = junkVerbs.test(s) || s.split(/\s+/).length > 12;
      return s && !isDescription;
    });

    return segments.join(' | ');
  };

  return jobs.map(job => {
    const cleaned = { ...job };

    // Clean all primary fields
    ['title', 'role', 'company', 'employer', 'location', 'duration', 'dates', 'date'].forEach(field => {
      if (cleaned[field]) {
        cleaned[field] = splitPipedField(cleaned[field]);
      }
    });

    // Special case: Remove trailing noise from title
    if (cleaned.title) {
      cleaned.title = cleaned.title.replace(/[\(]\s*June\s*[\)]/i, '').trim();
    }

    return cleaned;
  });
}

/**
 * Enhanced experience extraction with multiple format support
 */
function extractExperienceWithPatterns(resumeText) {
  let experience = [];

  console.log(` [Enhanced Parser] Starting experience extraction...`);

  // Find experience section
  const experienceMatch = resumeText.match(
    /(?:^|\r?\n)\s*(?:EXPERIENCE|PROFESSIONAL EXPERIENCE|PROFESSIONAL CONTOUR|WORK EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|PROFESSIONAL CONTOUR|EMPLOYMENT|CAREER HISTORY)\s*(?::\s*|\r?\n|$)[^]*?(?=\r?\n\s*(?:EDUCATION|ACADEMIC|ACADEMIC BACKGROUND|ACADEMIC QUALIFICATIONS|EDUCATIONAL BACKGROUND|QUALIFICATIONS|TECHNICAL SKILLS|SKILLS|CORE COMPETENCIES|CERTIFICATIONS|PERSONAL DETAILS|AWARDS|COURSES|LANGUAGES|PROJECTS|$))/i
  );

  if (!experienceMatch) {
    console.log(` [Enhanced Parser] No experience section found`);
    return experience;
  }

  const experienceText = experienceMatch[0];
  console.log(` [Enhanced Parser] Found experience section: ${experienceText.length} characters`);

  // Run all extraction strategies to see what we find
  const standardJobs = extractStandardFormatJobs(experienceText);
  console.log(` [Enhanced Parser] Standard format found ${standardJobs.length} jobs`);

  const companyFirstJobs = extractCompanyFirstFormatJobs(experienceText);
  console.log(` [Enhanced Parser] Company-first format found ${companyFirstJobs.length} jobs`);

  const pipeSeparatedJobs = extractPipeSeparatedFormatJobs(experienceText);
  console.log(` [Enhanced Parser] Pipe-separated format found ${pipeSeparatedJobs.length} jobs`);

  const titleDateJobs = extractTitleDateLineJobs(experienceText);
  console.log(` [Enhanced Parser] Title-date format found ${titleDateJobs.length} jobs`);

  // CRITICAL: Only use ONE strategy to avoid duplicates
  // Priority: Choose the strategy that found the most jobs (likely the correct format)
  const strategies = [
    { name: 'standard', jobs: standardJobs },
    { name: 'company-first', jobs: companyFirstJobs },
    { name: 'pipe-separated', jobs: pipeSeparatedJobs },
    { name: 'title-date', jobs: titleDateJobs }
  ];

  // Sort by number of jobs found (descending)
  strategies.sort((a, b) => b.jobs.length - a.jobs.length);

  // Use the strategy that found the most jobs
  if (strategies[0].jobs.length > 0) {
    console.log(` [Enhanced Parser] Using ${strategies[0].name} format with ${strategies[0].jobs.length} jobs`);
    experience = strategies[0].jobs;
  }

  // Strategy 5: Line-by-line parsing as fallback
  if (experience.length === 0) {
    console.log(` [Enhanced Parser] Using fallback line-based extraction`);
    experience = extractLineBasedJobs(experienceText);
  }

  // Clean up the experience headers
  experience = cleanExperienceHeaders(experience).filter(j => j.title || j.company);

  console.log(` [Enhanced Parser] Total experience entries: ${experience.length}`);
  return experience;
}

/**
 * Extract standard format jobs (Title - Company, Dates)
 */
function extractStandardFormatJobs(experienceText) {
  const jobs = [];
  const jobPattern = /([A-Z][A-Za-z\s&,.-]+?)\s*[-]\s*([A-Za-z\s&\.,]+?)\n((?:19|20)\d{2}.*?(?:Present|(?:19|20)\d{2}))/g;

  let match;
  while ((match = jobPattern.exec(experienceText)) !== null) {
    const [fullMatch, title, company, dates] = match;
    const startIndex = experienceText.indexOf(fullMatch);
    const nextJobIndex = experienceText.indexOf('\n\n', startIndex + fullMatch.length);
    const jobSection = experienceText.substring(startIndex, nextJobIndex > -1 ? nextJobIndex : experienceText.length);

    const bullets = extractBulletPoints(jobSection);

    jobs.push({
      title: title.trim(),
      company: company.trim(),
      duration: dates.trim(),
      location: '',
      description: bullets
    });
  }

  return jobs;
}

/**
 * Extract company-first format jobs
 */
function extractCompanyFirstFormatJobs(experienceText) {
  const jobs = [];
  const lines = experienceText.split('\n').map(line => line.trim()).filter(line => line);

  console.log(` [CompanyFirst] Processing ${lines.length} lines from experience section`);
  console.log(` [CompanyFirst] First 5 lines:`, lines.slice(0, 5));

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1] || '';

    // Pattern 1: Title Company, Location (Dates) - all on one line
    // Example: "Lead Mobile Developer (Contract) Auto Claims Ltd, Birmingham, UK (June 2023- May 2024)"
    // Strategy: Work backwards from the end to extract: (dates), location, company
    const endPattern = /^(.+?)\s*,\s*([A-Za-z\s\/,.-]+?)\s*\(([^)]+)\)$/;
    const endMatch = currentLine.match(endPattern);

    if (i < 10 && endMatch) {
      console.log(` [CompanyFirst] Line ${i} MATCHED single-line pattern: "${currentLine}"`);
    }

    if (endMatch) {
      const [, beforeLocation, location, dates] = endMatch;

      // Now split beforeLocation into title + company
      // Strategy: Look for job title keywords, everything after is company
      let title = '';
      let company = '';

      // Common job title patterns
      const jobTitlePattern = /^(.+?\b(?:Developer|Engineer|Manager|Lead|Director|Analyst|Designer|Architect|Consultant|Specialist)(?:\s*\([^)]+\))?)(.+)$/i;
      const titleMatch = beforeLocation.match(jobTitlePattern);

      if (titleMatch) {
        title = titleMatch[1].trim();
        company = titleMatch[2].trim();
      } else {
        // Fallback: Look for company name patterns (with Ltd, Inc, etc.)
        const companyPattern = /^(.+?)\s+([A-Z0-9][A-Za-z0-9\s&\.]*(?:\s+(?:Ltd|Inc|Corp|LLC|GmbH|Company|Technologies|Services|Solutions|Software|Systems|Group|Studio))?)$/;
        const companyMatch = beforeLocation.match(companyPattern);

        if (companyMatch) {
          title = companyMatch[1].trim();
          company = companyMatch[2].trim();
        } else {
          // Last resort: split after parentheses if present
          const parenMatch = beforeLocation.match(/^(.+\([^)]+\))\s+(.+)$/);
          if (parenMatch) {
            title = parenMatch[1].trim();
            company = parenMatch[2].trim();
          } else {
            // Really last resort: everything is title
            title = beforeLocation.trim();
            company = '';
          }
        }
      }

      // Find bullets for this job
      const bullets = [];
      let foundNonBullet = false;

      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j];
        // Stop at next job entry (another line matching our pattern)
        if (line.match(endPattern)) break;

        // Traditional bullets with bullet characters
        const bulletMatch = line.match(/^[\-\*\u2022]/);
        if (bulletMatch) {
          bullets.push(line.replace(/^[\-\*\u2022]\s*/, '').trim());
          continue;
        }

        // CRITICAL FIX: Handle bullets WITHOUT bullet characters
        // If line is substantial text (not another job header), treat as bullet
        const isJobHeader = line.match(/^[A-Z][a-z]+\s+(Engineer|Developer|Manager|Lead|Director|Analyst|Designer)/i);
        const isSkillsSection = line.match(/^(Expertise|Skills|Technical|Education|Projects|Community|Activities)/i);

        if (!isJobHeader && !isSkillsSection && line.length > 10 && /^[A-Z]/.test(line)) {
          bullets.push(line.trim());
        }
      }

      const job = {
        title: title.trim(),
        company: company.trim(),
        duration: dates.trim(),
        location: location.trim(),
        description: bullets
      };

      console.log(` [CompanyFirst] Extracted job #${jobs.length + 1}:`, {
        title: job.title,
        company: job.company,
        location: job.location,
        duration: job.duration,
        bullets: job.description.length
      });

      jobs.push(job);
      continue;
    }

    // Pattern 2: Company, Location (Dates) on one line, Title on next
    // Example: "Auto Claims Ltd, Birmingham, UK (June 2023- May 2024)" followed by "Lead Mobile Developer"
    const companyMatch = currentLine.match(/^([A-Za-z\s&\.,'-]+?),\s*([A-Za-z\s\/,.-]+?)\s*\(([^)]+)\)$/);
    if (companyMatch && nextLine && nextLine.length > 0 && !nextLine.match(/^[\-\*\u2022]/)) {
      const [, company, location, dates] = companyMatch;
      const title = nextLine;

      // Find bullets for this job
      const bullets = [];
      for (let j = i + 2; j < lines.length; j++) {
        const line = lines[j];
        if (line.match(/^[A-Za-z\s&\.,'-]+?,\s*[A-Za-z\s\/,.-]+?\s*\([^)]+\)/)) break; // Next job
        const bulletMatch = line.match(/^[\-\*\u2022]/);
        if (bulletMatch) {
          bullets.push(line.replace(/^[\-\*\u2022]\s*/, '').trim());
        }
      }

      jobs.push({
        title: title.trim(),
        company: company.trim(),
        duration: dates.trim(),
        location: location.trim(),
        description: bullets
      });
    }
  }

  return jobs;
}

/**
 * Extract pipe-separated format jobs
 * Handles formats like: "Lead Mobile Developer (Contract) | Auto Claims Ltd | June 2023 - May 2024"
 */
function extractPipeSeparatedFormatJobs(experienceText) {
  const jobs = [];
  const lines = experienceText.split('\n').map(line => line.trim()).filter(line => line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and section headers
    if (!line || line.match(/^(EXPERIENCE|SKILLS|EDUCATION)/i)) {
      continue;
    }

    // Pattern: Title | Company | Location | Dates OR Title | Company | Dates
    // The dates always contain a year (4 digits)
    const hasPipes = line.includes('|');
    const hasYear = /\d{4}/.test(line);

    if (hasPipes && hasYear) {
      const parts = line.split('|').map(p => p.trim());

      // Need at least 3 parts (title, company, dates)
      if (parts.length >= 3) {
        let title = '', company = '', location = '', dates = '';

        // Find which part has the year (that's the dates)
        const dateIndex = parts.findIndex(p => /\d{4}/.test(p));

        if (dateIndex >= 2) {
          // Everything before dateIndex-1 is title, dateIndex-1 is company/location
          title = parts.slice(0, dateIndex - 1).join(' | ');

          // Check if the part before dates looks like a location (has comma or is a city/country)
          const beforeDates = parts[dateIndex - 1];
          const hasComma = beforeDates.includes(',');
          const looksLikeLocation = hasComma || /\b(UK|USA|US|India|Japan|Germany|France|Canada)\b/i.test(beforeDates);

          if (looksLikeLocation && dateIndex >= 3) {
            // Format: Title | Company | Location | Dates
            company = parts[dateIndex - 2];
            location = beforeDates;
          } else {
            // Format: Title | Company | Dates
            company = beforeDates;
            location = '';
          }

          dates = parts.slice(dateIndex).join(' ');
        }

        // Validate: Skip if this looks like a bullet point
        if (title.startsWith('-') || title.startsWith('•')) {
          continue;
        }

        // Find bullets for this job
        const bullets = [];
        for (let j = i + 1; j < lines.length; j++) {
          const bulletLine = lines[j];

          // Stop at next job (line with pipes and year)
          if (bulletLine.includes('|') && /\d{4}/.test(bulletLine)) break;

          // Stop at section headers
          if (bulletLine.match(/^(EXPERIENCE|SKILLS|EDUCATION|PROJECTS)/i)) break;

          // Collect bullet points
          if (bulletLine.startsWith('-') || bulletLine.startsWith('•') || bulletLine.startsWith('*')) {
            bullets.push(bulletLine.replace(/^[\-\*\u2022]\s*/, '').trim());
          }
        }

        if (title && company) {
          jobs.push({
            title: title.trim(),
            company: company.trim(),
            duration: dates.trim(),
            location: location.trim(),
            description: bullets
          });

          console.log(` [PipeSeparated] Found: "${title.trim()}" at "${company.trim()}" (${dates.trim()})`);
        }
      }
    }

    // Old pattern with 4 parts (title, company, location, dates)
    const oldPattern = /([A-Za-z\s&\.]+?)\s*\|\s*([A-Za-z\s,.-]+?)\s*\|\s*([^|]*(?:19|20)\d{2}[^|]*)\n([A-Za-z\s&]+?)(?=\n|$)/;
    const oldMatch = experienceText.substring(experienceText.indexOf(line)).match(oldPattern);

    if (oldMatch) {
      let [fullMatch, company, location, dates, title] = oldMatch;

      company = company.trim();
      title = title.trim();

      // Validate: Reject if company or title part looks like bullet text or is too long
      const isBulletLike = (s) => /^[\-\*\u2022\u25AA\u25B6]/.test(s) || s.length > 80;
      if (isBulletLike(company) || isBulletLike(title) || /^[a-z]/.test(company)) {
        continue;
      }

      const startIndex = experienceText.indexOf(fullMatch);
      const nextJobIndex = experienceText.indexOf('\n\n', startIndex + fullMatch.length);
      const jobSection = experienceText.substring(startIndex, nextJobIndex > -1 ? nextJobIndex : experienceText.length);

      const bullets = extractBulletPoints(jobSection);

      jobs.push({
        title: title,
        company: company,
        duration: dates.trim(),
        location: location.trim(),
        description: bullets
      });
    }
  }

  return cleanExperienceHeaders(jobs);
}

/**
 * Extract Title Date format jobs (e.g. "Software Engineer OCT 2024 – PRESENT")
 */
function extractTitleDateLineJobs(experienceText) {
  const jobs = [];
  // Pattern: Title (at start of line) ... Date (at end of line)
  // Date format: (JAN|FEB...)? \d{4} - (Present|Now|Current|...)
  const lines = experienceText.split('\n').filter(l => l.trim());
  const datePattern = /\(?((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4}|present|current)\s*(?:[-–—]|\sto\s)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)?\.?\s*\d{4}|present|current)\)?/i;

  let currentJob = null;
  let bullets = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || /EXPERIENCE|WORK HISTORY/i.test(line)) continue;

    const dateMatch = line.match(datePattern);
    const bulletMatch = line.match(/^[\-\*\u2022\u25AA\u25B6]\s*/);

    // Verbs that usually start bullet points, not job titles
    const isDescriptionVerb = /^(built|developed|led|implemented|managed|designed|created|engineered|integrated|migrated|optimized|delivered|spearheaded|worked|contributed|collaborated|languages|skills|education|experience)\b/i.test(line);

    // If line has a date range and looks like a header (not a bullet, not a verb-start)
    if (dateMatch && !bulletMatch && !isDescriptionVerb && line.length < 120 && !/^(skills|education|experience|summary|projects|certifications)$/i.test(line.replace(/[:\-\s]+$/, ''))) {
      if (currentJob) {
        currentJob.description = bullets;
        jobs.push(currentJob);
      }

      // If it has a date, assume it's a job header line.
      // Try to split Title and Date
      const datePart = dateMatch[0];
      let titlePart = line.replace(datePart, '').trim();
      let company = '';

      // Handle "Title | Company | Date" format on single line
      if (titlePart.includes('|')) {
        const parts = titlePart.split('|').map(p => p.trim());
        titlePart = parts[0];
        const potentialCompany = parts.length > 1 ? parts[1] : '';

        // Validate potential company from pipe split
        // Reject if lowercase start, sentence-like, or too long description
        if (potentialCompany && /^[A-Z0-9]/.test(potentialCompany) && !potentialCompany.includes(', and ') && !potentialCompany.endsWith('.') && potentialCompany.length < 60) {
          company = potentialCompany;
        }
      } else {
        // Look ahead for company (standard Title \n Company format) as fallback
        // ... (existing lookahead logic will follow here if I don't replace it, but I must act carefully)
      }

      // Look ahead for company
      // Common pattern: 
      // Title ... Date
      // Company Name
      // Scan up to 2 lines ahead to find a valid company name
      for (let offset = 1; offset <= 2 && (i + offset) < lines.length; offset++) {
        const checkLine = lines[i + offset].trim();
        if (!checkLine) continue;

        const isBullet = /^[\-\*\u2022\u25AA\u25B6]/.test(checkLine);
        const isDateHeader = datePattern.test(checkLine);
        const startsUppercase = /^[A-Z0-9]/.test(checkLine);
        // Reject if it looks like a sentence fragment from previous description
        const isSentenceFragment = checkLine.includes(', and ') || (checkLine.startsWith('management,') && checkLine.length > 20) || (checkLine.endsWith('.') && checkLine.length > 50);

        if (!isBullet && !isDateHeader && startsUppercase && !isSentenceFragment) {
          company = checkLine;
          i += offset; // Advance the loop to skip the company line
          break;
        }

        // If we hit a bullet or date header, stop looking
        if (isBullet || isDateHeader) break;
      }

      currentJob = {
        title: titlePart || line,
        company: company,
        duration: datePart,
        location: '',
        description: []
      };

      bullets = [];
    } else if (currentJob) {
      // It's a description line
      // Append to previous bullet if it looks like a continuation (starts lowercase)
      // This fixes "Sales," -> "Accounts..." splitting
      const startsWithLowercase = /^[a-z]/.test(line);
      if (startsWithLowercase && bullets.length > 0 && !bulletMatch) {
        bullets[bullets.length - 1] += ' ' + line;
      } else {
        bullets.push(line.replace(/^[\-\*\u2022\u25AA\u25B6]\s*/, ''));
      }
    }
  }

  if (currentJob) {
    currentJob.description = bullets;
    jobs.push(currentJob);
  }

  return jobs;
}

/**
 * Extract line-based jobs as fallback
 */
function extractLineBasedJobs(experienceText) {
  const jobs = [];
  const lines = experienceText.split('\n').map(line => line.trim()).filter(line => line);

  // Simple heuristic: look for lines that might be job titles/companies
  let currentJob = null;
  let bullets = [];

  for (const line of lines) {
    if (line.toLowerCase().includes('experience')) continue;

    const bulletMatch = line.match(/^([A-Z][A-Z\s&]{2,})?[\-\*\u2022\u25AA\u25B6]\s*/) || line.match(/^\d+[\.\)]\s*/);

    // Check if this looks like a bullet point
    if (bulletMatch || (bullets.length > 0 && line.match(/^[a-z]/))) {
      if (currentJob) {
        // Special case: if bullet starts with all-caps company name
        const companyPart = line.match(/^([A-Z][A-Z\s&]{2,})[\-\*\u2022\u25AA\u25B6]/);
        if (companyPart && !currentJob.company) {
          currentJob.company = companyPart[1].trim();
        }
        bullets.push(line.replace(/^([A-Z][A-Z\s&]{2,})?[\-\*\u2022\u25AA\u25B6\d\.\)]+\s*/, '').trim());
      }
    }
    // Check if this looks like a new job entry
    else if (line.length > 10 && line.length < 100) {
      // Save previous job if exists
      if (currentJob) {
        currentJob.description = bullets;
        jobs.push(currentJob);
      }

      // Start new job
      currentJob = {
        title: line,
        company: '',
        duration: '',
        location: '',
        description: []
      };
      bullets = [];
    }
  }

  // Add last job
  if (currentJob) {
    currentJob.description = bullets;
    jobs.push(currentJob);
  }

  return cleanExperienceHeaders(jobs).filter(j => j.description.length > 0 || j.title.length > 15);
}

/**
 * Extract bullet points from job section
 */
function extractBulletPoints(jobSection) {
  const bulletPatterns = [
    /^[-\*\u2022\u2023\u25AA\u25AB\u25B6\u25B7]\s*(.+)/gm,
    /^\d+[\.\)]\s*(.+)/gm,
    /^\s{2,}(.+)/gm
  ];

  let bullets = [];

  for (const pattern of bulletPatterns) {
    const matches = Array.from(jobSection.matchAll(pattern));
    if (matches.length > 0) {
      bullets = matches.map(match => match[1].trim());
      break;
    }
  }

  return bullets;
}

/**
 * Extract education with improved parsing
 * @param {string} resumeText - Resume text
 * @returns {array} Education entries
 */
function extractEducation(resumeText) {
  const education = [];

  const educationMatch = resumeText.match(/(?:^|\r?\n)\s*(?:EDUCATION|ACADEMIC|ACADEMIC BACKGROUND|ACADEMIC QUALIFICATIONS|EDUCATIONAL BACKGROUND|QUALIFICATIONS)\s*(?::\s*|\r?\n|$)[^]*?(?=\r?\n\s*(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|PROJECTS|CERTIFICATIONS|AWARDS|LANGUAGES|--- PAGE BREAK ---|=== PAGE BREAK ===|$))/i);

  let educationText;
  if (!educationMatch) {
    // Try a simpler fall back regex if the lookahead is failing
    const simpleMatch = resumeText.match(/(?:^|\r?\n)\s*(?:EDUCATION|ACADEMIC|ACADEMIC BACKGROUND|ACADEMIC QUALIFICATIONS|EDUCATIONAL BACKGROUND|QUALIFICATIONS)\s*(?::\s*|\r?\n|$)([^]*)/i);
    if (simpleMatch) {
      console.log(' [Enhanced Parser] Fallback simple regex matched for Education');
      educationText = simpleMatch[0];
    } else {
      console.log(' [Enhanced Parser] No Education section found');
      return education;
    }
  } else {
    educationText = educationMatch[0];
  }

  // Pre-clean education text from internal markers
  educationText = educationText
    .replace(/--- PAGE BREAK ---/g, '\n')
    .replace(/=== PAGE BREAK ===/g, '\n');

  console.log(` [Enhanced Parser] Raw Education Text: ${educationText.substring(0, 50)}...`);

  let lines = educationText.split('\n').filter(line => line.trim()).slice(1);

  // Pre-process: Handle pipe-separated lines and multiple year patterns
  const processedLines = [];
  for (const line of lines) {
    if (line.includes('|')) {
      // If line has multiple years AND pipes, it's likely merged entries
      const yearMatches = line.match(/\b(19|20)\d{2}\b/g) || [];
      if (yearMatches.length >= 2) {
        line.split('|').forEach(p => processedLines.push(p.trim()));
        continue;
      }
    }
    processedLines.push(line);
  }
  lines = processedLines;
  console.log(` [Enhanced Parser] Processed Education Lines: ${lines.length}`);

  let currentEdu = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Check for GPA/CGPA/Percentage
    let score = null;
    const gpaMatch = line.match(/(?:GPA|CGPA|Percentage|Score)\s*[:=]?\s*(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?|[\d\.]+%)/i);
    if (gpaMatch) {
      score = gpaMatch[1];
    }

    // Check for Degree
    const isDegree = /bachelor|master|phd|diploma|degree|b\.tech|m\.tech|bsc|msc|bca|mca|b\.e|m\.e|associate|ssc|hsc|cbse|icse|secondary|major in/i.test(line);

    // Check for Institution
    const isSchoolKeyword = /university|college|institute|school|academy/i.test(line);
    const hasDateAtEnd = /\b(19|20)\d{2}\b$/.test(line);

    let isSchool = isSchoolKeyword || (hasDateAtEnd && !isDegree && line.length > 5);

    if (!isSchool && !isDegree && i < lines.length - 1) {
      const nextLine = lines[i + 1].trim();
      const nextIsDate = /^(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|Present|Current))?$/i.test(nextLine);
      if (nextIsDate && line.length > 3 && /^[A-Z]/.test(line)) {
        isSchool = true;
      }
    }

    if (isSchool) {
      if (currentEdu) education.push(currentEdu);
      currentEdu = { institution: line, degree: '', year: '', location: '', score: score || '' };

      const yearMatch = line.match(/((?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|Present|Current))|\b(19|20)\d{2}\b/i);
      if (yearMatch) {
        currentEdu.year = yearMatch[0];
        currentEdu.institution = currentEdu.institution.replace(yearMatch[0], '').trim().replace(/,\s*$/, '');
      }
      if (score) {
        currentEdu.institution = currentEdu.institution.replace(gpaMatch[0], '').trim().replace(/[|,\s]+$/, '');
      }
    } else if (isDegree) {
      if (currentEdu) {
        currentEdu.degree = line;
        if (score && !currentEdu.score) currentEdu.score = score;
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        if (yearMatch && !currentEdu.year) currentEdu.year = yearMatch[0];

        if (score) currentEdu.degree = currentEdu.degree.replace(gpaMatch[0], '').trim();
        if (yearMatch) currentEdu.degree = currentEdu.degree.replace(yearMatch[0], '').trim();
        currentEdu.degree = currentEdu.degree.replace(/[|,\s]+$/, '');
      }
    } else if (currentEdu && !currentEdu.degree && line.length < 100) {
      const isDateLine = /^(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|Present|Current))?$/i.test(line);
      if (isDateLine) {
        currentEdu.year = line;
      } else {
        currentEdu.degree = line;
      }
    }
  }

  if (currentEdu) education.push(currentEdu);

  // Deduplication & Safety Checks
  console.log(` [Enhanced Parser] Deduplication. Candidate count: ${education.length}`);
  const uniqueEducation = [];
  for (const edu of education) {
    // REFINED Safety: Only skip if it's clearly not an institution name
    if (edu.institution.length > 150 || (edu.institution.match(/\d{4}/g) || []).length > 2) {
      continue;
    }
    // Deep deduplication
    const isDup = uniqueEducation.some(u =>
      u.institution.toLowerCase().includes(edu.institution.toLowerCase()) ||
      edu.institution.toLowerCase().includes(u.institution.toLowerCase())
    );
    if (!isDup) uniqueEducation.push(edu);
  }

  return uniqueEducation;
}

/**
 * Extract skills with context awareness
 * @param {string} resumeText - Resume text
 * @returns {array} Skills list
 */
function extractSkills(resumeText) {
  const skillsPatterns = [
    /(?:^|\r?\n)\s*(?:SKILLS|TECHNOLOGIES|COMPETENCIES|TECHNICAL SKILLS|KEY SKILLS|CORE COMPETENCIES|AREAS OF EXPERTISE|PROFICIENCIES)\s*(?::\s*|\r?\n|$)([^]*?)(?=\r?\n\s*(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|EDUCATION|ACADEMIC|PROJECTS|CERTIFICATIONS|AWARDS|LANGUAGES|$))/i,
    /(?:^|\r?\n)\s*(?:PROGRAMMING LANGUAGES|TOOLS|APPLICATIONS|FRAMEWORKS)\s*(?::\s*|\r?\n|$)([^]*?)(?=\n\s*(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|EDUCATION|ACADEMIC|PROJECTS|CERTIFICATIONS|AWARDS|LANGUAGES|$))/i
  ];

  for (const pattern of skillsPatterns) {
    const match = resumeText.match(pattern);
    if (match && match[1]) {
      const skillsText = match[1].replace(/^(skills|technologies|competencies|technical skills|programming languages|tools)\s*:?\s*/i, '');

      // Split by common delimiters
      let skills = skillsText
        .split(/[,\n|]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 1);

      // Fallback: if we have few but very long results, they might be space-separated
      if (skills.length < 4 && skills.some(s => s.length > 40)) {
        const spaceSkills = skillsText
          .split(/\s{2,}/) // Split by multiple spaces first
          .flatMap(s => s.includes('  ') ? s.split('  ') : s)
          .map(s => s.trim())
          .filter(s => s.length > 1);

        if (spaceSkills.length > skills.length) {
          skills = spaceSkills;
        }
      }

      skills = skills
        .filter(skill => skill.length < 50)
        .filter(skill => !skill.match(/^(and|or|including|such as)$/i))
        .slice(0, 40);

      if (skills.length > 0) {
        return skills;
      }
    }
  }

  return [];
}

/**
 * Extract projects
 * @param {string} resumeText - Resume text
 * @returns {array} Projects list
 */
function extractProjects(resumeText) {
  const projects = [];

  const projectMatch = resumeText.match(
    /(?:^|\n)\s*(?:PROJECTS?|PROJECT EXPERIENCE|PROJECT WORK|PERSONAL PROJECTS|SIDE PROJECTS|KEY PROJECTS|NOTABLE PROJECTS|PORTFOLIO|ACADEMIC PROJECTS)\s*(?::\s*|\n|$)[^]*?(?=\n\s*(?:EXPERIENCE|WORK EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|EDUCATION|ACADEMIC|SKILLS|TECHNICAL SKILLS|CERTIFICATIONS|AWARDS|PUBLICATIONS|LANGUAGES|$))/i
  );
  if (!projectMatch) return projects;

  const projectText = projectMatch[0];

  // Simple project extraction
  const projectLines = projectText.split('\n').filter(line => line.trim()).slice(1);
  let currentProject = null;

  for (let line of projectLines) {
    line = line.trim();
    if (!line) continue;

    // Project title (usually first line of each project)
    const isBullet = /^[\-\*\u2022]/.test(line);
    const wordCount = line.split(/\s+/).filter(Boolean).length;
    const looksLikeSentence = /[.!?]$/.test(line);
    const isTitleCandidate = !isBullet && line.length <= 100 && wordCount <= 10 && !looksLikeSentence;

    // Filter out URLs, file paths, and common tech stack lines that aren't titles
    const isUrl = /^(http|www\.)/i.test(line);
    const isTechList = /^(technologies|tech stack|skills):/i.test(line);
    const isActionVerb = /^(led|developed|created|built|managed|designed|implemented|contributed|engineered|maintained|collaborated|optimized|integrated)\b/i.test(line);
    const isTechKeywords = /^(javascript|python|java|react|node|aws|docker|kubernetes|sql|nosql|wordpress|firebase)(\s|$)/i.test(line);

    if (isTitleCandidate && !isUrl && !isTechList && !isActionVerb && !isTechKeywords) {
      if (currentProject) projects.push(currentProject);
      currentProject = { name: line, description: '', technologies: [] };
    }
    // Project description or tech stack
    else if (currentProject) {
      if (line.match(/technologies|tech stack|built with/i)) {
        const techMatch = line.match(/(?:technologies|tech stack|built with)[:\s]*(.+)/i);
        if (techMatch) {
          currentProject.technologies = techMatch[1]
            .split(/[,|]/)
            .map(tech => tech.trim())
            .filter(Boolean);
        }
      } else {
        currentProject.description += (currentProject.description ? ' ' : '') + line.replace(/^[\-]\s*/, '');
      }
    }
  }

  if (currentProject) projects.push(currentProject);

  return projects;
}

/**
 * Enhanced certifications extraction
 * @param {string} resumeText - Resume text
 * @returns {array} Certifications list
 */
function extractCertifications(resumeText) {
  const certificationPatterns = [
    /(?:^|\n)\s*(?:CERTIFICATIONS?|CERTIFICATES?|LICENSES?|PROFESSIONAL QUALIFICATIONS)\s*(?::\s*|\n|$)([^]*?)(?=\n\s*(?:EXPERIENCE|WORK EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|EDUCATION|ACADEMIC|SKILLS|TECHNICAL SKILLS|PROJECTS|AWARDS|LANGUAGES|$))/i,
    /(?:^|\n)\s*(?:PROFESSIONAL CERTIFICATIONS|CREDENTIALS|COURSES)\s*(?::\s*|\n|$)([^]*?)(?=\n\s*(?:EXPERIENCE|WORK EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY|EDUCATION|ACADEMIC|SKILLS|TECHNICAL SKILLS|PROJECTS|LANGUAGES|$))/i
  ];

  for (const pattern of certificationPatterns) {
    const match = resumeText.match(pattern);
    if (match && match[1]) {
      const certText = match[1].replace(/^(certifications?|certificates?|professional certifications|credentials)\s*:?\s*/i, '');

      // Split by newlines and bullet points
      const certifications = certText
        .split(/\n/)
        .map(cert => cert.replace(/^[\-\*\s]+/, '').trim())
        .filter(cert => cert.length > 2 && cert.length < 200)
        .filter(cert => !cert.match(/^(and|or|including)$/i));

      if (certifications.length > 0) {
        console.log(` [Enhanced Parser] Certifications found: ${certifications.length}`);
        return certifications;
      }
    }
  }

  return [];
}

/**
 * Extract awards/achievements
 * @param {string} resumeText - Resume text
 * @returns {array} Awards list
 */
function extractAwards(resumeText) {
  const awards = [];

  const awardMatch = resumeText.match(/(?:AWARDS?|ACHIEVEMENTS?|HONORS?)[^]*?(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|$))/i);
  if (!awardMatch) return awards;

  const awardText = awardMatch[0];
  const awardLines = awardText.split(/\n/).map(line => line.trim()).filter(line => line.length > 2).slice(1);

  return awardLines;
}

/**
 * Extract domain expertise
 * @param {string} resumeText - Resume text
 * @returns {array} Domains list
 */
function extractDomains(resumeText) {
  const domains = [];

  const domainPatterns = [
    /(?:DOMAIN EXPERTISE|DOMAINS|INDUSTRY EXPERIENCE)[^]*?(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|$))/i,
    /(?:AREAS OF EXPERTISE|SPECIALIZATION)[^]*?(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|$))/i
  ];

  for (const pattern of domainPatterns) {
    const match = resumeText.match(pattern);
    if (match) {
      const domainText = match[0];
      const domainLines = domainText.split(/\n|,/).map(line => line.trim()).filter(line => line.length > 2).slice(1);
      domains.push(...domainLines);
      break;
    }
  }

  return domains;
}

/**
 * Format resume without page preservation logic.
 * @param {object} parsedSections - Parsed resume sections or AI parsed data
 * @returns {object} Formatted resume content for templates
 */
export function formatResumePreservingStructure(parsedSections) {
  const safeSections = parsedSections || {};
  const personalInfo = safeSections.personalInfo || safeSections.contactInfo || safeSections.contact || {};
  const summary = safeSections.summary || safeSections.professionalSummary || safeSections.profile || '';
  const skills = normalizeSkills(safeSections.skills);
  const rawExperience = normalizeExperience(safeSections.experience);
  const experience = cleanExperienceHeaders(rawExperience);
  const education = normalizeEducation(safeSections.education);
  const projects = normalizeProjects(safeSections.projects);
  const certifications = normalizeCertifications(safeSections.certifications);

  const content = {
    name: personalInfo.name || '',
    contact: {
      email: personalInfo.email || '',
      phone: personalInfo.phone || '',
      location: personalInfo.location || '',
      linkedin: personalInfo.linkedin || personalInfo.linkedIn || '',
      github: personalInfo.github || '',
      website: personalInfo.website || personalInfo.portfolio || '',
      links: Array.isArray(personalInfo.links) ? personalInfo.links : []
    },
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
    awards: Array.isArray(safeSections.awards) ? safeSections.awards : [],
    domains: Array.isArray(safeSections.domains) ? safeSections.domains : []
  };

  return {
    layout: content,
    fullStructure: content,
    optimization: {
      strategy: 'simple_format'
    }
  };
}

function normalizeSkills(skills) {
  if (Array.isArray(skills)) return skills;
  if (skills && typeof skills === 'object') {
    return Object.values(skills)
      .flat()
      .filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(/[,|\n]/).map((skill) => skill.trim()).filter(Boolean);
  }
  return [];
}

function normalizeExperience(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    title: entry.title || entry.position || entry.role || '',
    company: entry.company || entry.employer || entry.organization || '',
    dates: entry.dates || entry.date || entry.duration || '',
    location: entry.location || '',
    description: entry.description || entry.points || entry.bullets || entry.responsibilities || []
  }));
}

function normalizeEducation(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    institution: entry.institution || entry.university || entry.school || '',
    degree: entry.degree || entry.program || '',
    year: entry.year || entry.dates || entry.graduation || '',
    location: entry.location || '',
    gpa: entry.gpa || ''
  }));
}

function normalizeProjects(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    name: entry.name || entry.title || '',
    description: entry.description || entry.summary || '',
    technologies: entry.technologies || entry.techStack || entry.stack || []
  }));
}

function normalizeCertifications(entries) {
  if (!entries) return [];
  if (Array.isArray(entries)) return entries;
  if (typeof entries === 'string') {
    return entries.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Export formatted resume as JSON with metadata
 * @param {object} formattedResume - Formatted resume
 * @returns {string} JSON string with metadata
 */
export function exportFormattedResumeAsJSON(formattedResume) {
  const exportData = {
    metadata: {
      formatType: formattedResume.formatType || 'single_page',
      optimizationStrategy: formattedResume.optimization?.strategy,
      exportTimestamp: new Date().toISOString()
    },
    content: formattedResume.layout || formattedResume.fullStructure,
    optimization: formattedResume.optimization
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Deduplicate job entries based on company and title similarity
 * @param {array} jobs - Array of job entries
 * @returns {array} Deduplicated job entries
 */
function deduplicateJobs(jobs) {
  const unique = [];
  const seen = new Set();

  for (const job of jobs) {
    const key = `${(job.company || '').toLowerCase().trim()}_${(job.title || '').toLowerCase().trim()}`.substring(0, 50);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(job);
    } else {
      console.log(` [Dedupe] Skipping duplicate: ${job.title} at ${job.company}`);
    }
  }

  return unique;
}

/**
 * Legacy compatibility function
 * @param {string} resumeText - Resume text
 * @returns {object} Parsed resume (legacy format)
 */
export function parseAndFormatResume(resumeText) {
  // Use enhanced parsing with default structure
  const parsed = parseResumeWithStructure(resumeText, { originalPageCount: 1 });
  return formatResumePreservingStructure(parsed, 'general');
}
