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
export function parseResumeWithStructure(resumeText, structure = {}) {
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
  const contactLines = lines.slice(0, 12);
  const contactText = contactLines.join(' ');

  // Enhanced name extraction patterns
  let name = '';

  // Pattern 1: All caps name at the beginning
  const allCapsMatch = resumeText.match(/^([A-Z][A-Z\s]+(?=\n))/m);
  if (allCapsMatch && allCapsMatch[1].length < 50) {
    name = allCapsMatch[1].trim();
  } else {
    // Pattern 2: Title case name
    const titleCaseMatch = resumeText.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m);
    if (titleCaseMatch && titleCaseMatch[1].length < 50 && !titleCaseMatch[1].includes('%PDF')) {
      name = titleCaseMatch[1].trim();
    } else if (lines.length > 0) {
      // Pattern 3: First non-empty line as name, filtering out metadata
      const firstLine = lines.find(l => !l.startsWith('%PDF') && !l.includes('rdf:Description') && !l.includes('xmlns:'));
      if (firstLine && firstLine.length < 50 && !firstLine.includes('@') && !firstLine.includes('http')) {
        name = firstLine;
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

  // Location extraction with multiple patterns
  const locationPatterns = [
    /([A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Za-z]+)/,  // City, State, Country
    /([A-Za-z\s]+,\s*[A-Z]{2,3})/,                // City, State
    /([A-Za-z\s]+,\s*[A-Za-z]+)/                  // City, Country
  ];

  let location = '';
  for (const pattern of locationPatterns) {
    const match = resumeText.match(pattern);
    if (match && match[1].length < 50) {
      location = match[1].trim();
      break;
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
    .filter(Boolean);
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
    /(?:EXECUTIVE SUMMARY|PROFESSIONAL SUMMARY|CAREER SUMMARY|SUMMARY OF QUALIFICATIONS|PROFILE SUMMARY|PROFESSIONAL PROFILE|CAREER PROFILE|SUMMARY|PROFILE|OBJECTIVE|ABOUT|OVERVIEW)[:\s]*([^]*?)(?=\n(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|SKILLS|EDUCATION|PROJECTS|CERTIFICATIONS|AWARDS|PUBLICATIONS|LANGUAGES|$))/i
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
function extractExperienceWithPatterns(resumeText) {
  const experience = [];

  console.log(` [Enhanced Parser] Starting experience extraction...`);

  // Find experience section
  const experienceMatch = resumeText.match(
    /(?:EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL CONTOUR|EMPLOYMENT)[^]*?(?=\n(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|PERSONAL DETAILS|AWARDS|$))/i
  );

  if (!experienceMatch) {
    console.log(` [Enhanced Parser] No experience section found`);
    return experience;
  }

  const experienceText = experienceMatch[0];
  console.log(` [Enhanced Parser] Found experience section: ${experienceText.length} characters`);

  // Multiple parsing strategies

  // Strategy 1: Standard format (Title - Company, Dates)
  const standardJobs = extractStandardFormatJobs(experienceText);
  if (standardJobs.length > 0) {
    console.log(` [Enhanced Parser] Strategy 1 (Standard): ${standardJobs.length} jobs found`);
    experience.push(...standardJobs);
  }

  // Strategy 2: Company-first format (Company, Location (Dates) + Title)
  if (experience.length === 0) {
    const companyFirstJobs = extractCompanyFirstFormatJobs(experienceText);
    if (companyFirstJobs.length > 0) {
      console.log(` [Enhanced Parser] Strategy 2 (Company-first): ${companyFirstJobs.length} jobs found`);
      experience.push(...companyFirstJobs);
    }
  }

  // Strategy 3: Pipe-separated format (Company | Location | Dates)
  if (experience.length === 0) {
    const pipeSeparatedJobs = extractPipeSeparatedFormatJobs(experienceText);
    if (pipeSeparatedJobs.length > 0) {
      console.log(` [Enhanced Parser] Strategy 3 (Pipe-separated): ${pipeSeparatedJobs.length} jobs found`);
      experience.push(...pipeSeparatedJobs);
    }
  }

  // Strategy 4: Line-by-line parsing as fallback
  if (experience.length === 0) {
    const lineBasedJobs = extractLineBasedJobs(experienceText);
    console.log(` [Enhanced Parser] Strategy 4 (Line-based): ${lineBasedJobs.length} jobs found`);
    experience.push(...lineBasedJobs);
  }

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

  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1] || '';

    // Look for company, location (dates) pattern
    const companyMatch = currentLine.match(/^([A-Za-z\s&\.,'-]+?),\s*([A-Za-z\s\/,.-]+?)\s*\(([^)]+)\)/);
    if (companyMatch && nextLine && nextLine.length > 0 && !nextLine.match(/^[\-\*\u2022]/)) {
      const [, company, location, dates] = companyMatch;
      const title = nextLine;

      // Find bullets for this job
      const bullets = [];
      for (let j = i + 2; j < lines.length; j++) {
        const line = lines[j];
        if (line.match(/^[A-Za-z\s&\.,'-]+?,\s*[A-Za-z\s\/,.-]+?\s*\([^)]+\)/)) break; // Next job
        if (line.match(/^[\-\*\u2022]/)) {
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
 */
function extractPipeSeparatedFormatJobs(experienceText) {
  const jobs = [];
  const jobPattern = /([A-Za-z\s&\.]+?)\s*\|\s*([A-Za-z\s,.-]+?)\s*\|\s*([^|]*(?:19|20)\d{2}[^|]*)\n([A-Za-z\s&]+?)(?=\n|$)/g;

  let match;
  while ((match = jobPattern.exec(experienceText)) !== null) {
    const [fullMatch, company, location, dates, title] = match;
    const startIndex = experienceText.indexOf(fullMatch);
    const nextJobIndex = experienceText.indexOf('\n\n', startIndex + fullMatch.length);
    const jobSection = experienceText.substring(startIndex, nextJobIndex > -1 ? nextJobIndex : experienceText.length);

    const bullets = extractBulletPoints(jobSection);

    jobs.push({
      title: title.trim(),
      company: company.trim(),
      duration: dates.trim(),
      location: location.trim(),
      description: bullets
    });
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

    // Check if this looks like a bullet point
    if (line.match(/^[\-\*]\s/) || line.match(/^\d+\./) || bullets.length > 0 && line.match(/^[a-z]/)) {
      if (currentJob) {
        bullets.push(line.replace(/^[\-\*\d\.\s]+/, '').trim());
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

  return jobs;
}

/**
 * Extract bullet points from job section
 */
function extractBulletPoints(jobSection) {
  const bulletPatterns = [
    /^[\-\*]\s+(.+)/gm,
    /^\d+\.\s+(.+)/gm,
    /^\s+(.+)/gm
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

  const educationMatch = resumeText.match(/(?:EDUCATION|ACADEMIC)[^]*?(?=\n(?:SKILLS|EXPERIENCE|PROJECTS|CERTIFICATIONS|$))/i);
  if (!educationMatch) return education;

  const educationText = educationMatch[0];
  const lines = educationText.split('\n').filter(line => line.trim()).slice(1); // Skip "EDUCATION" header

  let currentEdu = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // University/Institution line
    if (line.match(/university|college|institute|school/i)) {
      if (currentEdu) education.push(currentEdu);
      currentEdu = { institution: line, degree: '', year: '', location: '' };
    }
    // Degree line
    else if (line.match(/bachelor|master|phd|diploma|degree|b\.tech|m\.tech|bsc|msc/i) && currentEdu) {
      currentEdu.degree = line;
    }
    // Year line
    else if (line.match(/19\d{2}|20\d{2}/) && currentEdu) {
      currentEdu.year = line;
    }
    // Location line
    else if (currentEdu && currentEdu.degree && !currentEdu.location) {
      currentEdu.location = line;
    }
  }

  if (currentEdu) education.push(currentEdu);

  return education;
}

/**
 * Extract skills with context awareness
 * @param {string} resumeText - Resume text
 * @returns {array} Skills list
 */
function extractSkills(resumeText) {
  const skillsPatterns = [
    /(?:SKILLS|TECHNOLOGIES|COMPETENCIES|TECHNICAL SKILLS)[:\s]*([^]*?)(?=\n(?:EXPERIENCE|EDUCATION|PROJECTS|$))/i,
    /(?:PROGRAMMING LANGUAGES|TOOLS)[:\s]*([^]*?)(?=\n(?:EXPERIENCE|EDUCATION|PROJECTS|$))/i
  ];

  for (const pattern of skillsPatterns) {
    const match = resumeText.match(pattern);
    if (match && match[1]) {
      const skillsText = match[1].replace(/^(skills|technologies|competencies|technical skills|programming languages|tools)\s*:?\s*/i, '');

      // Split by common delimiters
      const skills = skillsText
        .split(/[,\n|]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 1 && skill.length < 50)
        .filter(skill => !skill.match(/^(and|or|including|such as)$/i))
        .slice(0, 30); // Limit to reasonable number

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
    /(?:PROJECTS?|PROJECT EXPERIENCE|PROJECT WORK|PERSONAL PROJECTS|SIDE PROJECTS|KEY PROJECTS|NOTABLE PROJECTS|PORTFOLIO)[^]*?(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|AWARDS|PUBLICATIONS|LANGUAGES|$))/i
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

    if (isTitleCandidate) {
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
    /(?:CERTIFICATIONS?|CERTIFICATES?)[:\s]*([^]*?)(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|PROJECTS|AWARDS|$))/i,
    /(?:PROFESSIONAL CERTIFICATIONS|CREDENTIALS)[:\s]*([^]*?)(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|PROJECTS|$))/i
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
  const experience = normalizeExperience(safeSections.experience);
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
 * Legacy compatibility function
 * @param {string} resumeText - Resume text
 * @returns {object} Parsed resume (legacy format)
 */
export function parseAndFormatResume(resumeText) {
  // Use enhanced parsing with default structure
  const parsed = parseResumeWithStructure(resumeText, { originalPageCount: 1 });
  return formatResumePreservingStructure(parsed, 'general');
}
