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
  const sectionPatterns = {
    personalInfo: /^(contact|personal)/i,
    summary: /^(summary|objective|profile|about|career\s+objective|professional\s+summary|career\s+recital)/i,
    experience: /^(experience|work\s+experience|professional\s+experience|employment|career|work\s+history|professional\s+contour)/i,
    education: /^(education|academic|qualifications|degrees|education\s+&\s+credentials)/i,
    skills: /^(skills|technical\s+skills|competencies|technologies|expertise|core\s+competencies)/i,
    projects: /^(projects|project\s+experience|project\s+work|portfolio|notable\s+projects|key\s+projects|personal\s+projects|side\s+projects)/i,
    certifications: /^(certifications?|certificates?|licenses?|certification)/i,
    awards: /^(awards?|honors?|achievements?|recognition)/i,
    publications: /^(publications?|papers?|articles?)/i,
    languages: /^(languages?|linguistic)/i
  };

  let currentSection = 'personalInfo';
  
  // Personal info is assumed to be at the top
  sections.personalInfo.start = 0;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) return;
    
    // Check if line matches any section header
    let matchedSection = null;
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(trimmedLine)) {
        matchedSection = sectionName;
        break;
      }
    }
    
    if (matchedSection) {
      // End current section
      if (sections[currentSection].start !== -1) {
        sections[currentSection].end = index;
        sections[currentSection].content = lines
          .slice(sections[currentSection].start, index)
          .join('\n')
          .trim();
      }
      
      // Start new section
      currentSection = matchedSection;
      sections[currentSection].start = index;
    }
  });
  
  // Close the last section
  if (sections[currentSection].start !== -1) {
    sections[currentSection].end = lines.length;
    sections[currentSection].content = lines
      .slice(sections[currentSection].start)
      .join('\n')
      .trim();
  }
  
  // Handle case where personal info extends until first real section
  const firstRealSection = Object.keys(sections).find(key => 
    key !== 'personalInfo' && sections[key].start !== -1
  );
  if (firstRealSection && sections.personalInfo.end === -1) {
    sections.personalInfo.end = sections[firstRealSection].start;
    sections.personalInfo.content = lines
      .slice(0, sections[firstRealSection].start)
      .join('\n')
      .trim();
  }

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

  const lines = text.split('\n').filter(line => line.trim());
  
  // Enhanced name detection
  const namePatterns = [
    /^([A-Z][A-Z\s]{3,})\s*$/m, // All caps name
    /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/m, // Title case
    /^([A-Z][a-z]+\s[A-Z]\.\s[A-Z][a-z]+)\s*$/m // Middle initial format
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.name = match[1].trim();
      break;
    }
  }
  
  // If no name found, use first meaningful line
  if (!info.name && lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length > 2 && !firstLine.includes('@') && !firstLine.includes('http')) {
      info.name = firstLine;
    }
  }

  // Enhanced email detection
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) info.email = emailMatch[1];

  // Enhanced phone detection (multiple formats)
  const phonePatterns = [
    /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
    /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
    /(\+?\d{1,3}\s?\d{3}\s?\d{3}\s?\d{4})/
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.phone = match[1];
      break;
    }
  }

  // Social media and portfolio links
  const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i);
  if (linkedinMatch) info.linkedin = linkedinMatch[1];
  
  const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9-]+)/i);
  if (githubMatch) info.github = githubMatch[1];
  
  const portfolioMatch = text.match(/(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
  if (portfolioMatch && !portfolioMatch[1].includes('linkedin') && !portfolioMatch[1].includes('github')) {
    info.portfolio = portfolioMatch[1];
  }

  const normalizeLink = (value) => {
    return value
      .replace(/^[\(<\[]+/, '')
      .replace(/[\])>.,;]+$/, '')
      .trim();
  };
  const urlMatches = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi) || [];
  const domainTokens = text
    .split(/\s+/)
    .map((token) => normalizeLink(token))
    .filter((token) => token && !token.includes('@'))
    .filter((token) => /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(token));
  const linkCandidates = [...urlMatches, ...domainTokens]
    .map((link) => normalizeLink(link))
    .filter((link) => link && !/linkedin\.com|github\.com/i.test(link));
  const uniqueLinks = Array.from(new Set(linkCandidates));
  if (!info.portfolio && uniqueLinks.length > 0) {
    info.portfolio = uniqueLinks[0];
  }
  const filteredLinks = uniqueLinks.filter((link) => link && link !== info.portfolio);
  info.links = filteredLinks;

  // Address detection (city, state format or full address)
  const addressPatterns = [
    /([A-Z][a-z]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /(\d+\s+[A-Za-z\s]+,\s*[A-Z][a-z]+,\s*[A-Z]{2}(?:\s+\d{5})?)/
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
  const jobs = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  // Remove section header
  const isExperienceHeader = (value) => {
    const normalized = value
      .replace(/^[#>\-\*\+\s]+/, '')
      .replace(/[*_`]+/g, '')
      .replace(/:\s*$/, '')
      .trim()
      .toLowerCase();
    return /^(experience|work\s+experience|professional\s+experience|employment|work\s+history)$/.test(normalized);
  };

  const contentLines = lines.filter(line => !isExperienceHeader(line));
  
  let i = 0;
  while (i < contentLines.length) {
    const line = contentLines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    
    let job = null;
    
    // Pattern 1: Title - Company, Location (Dates)
    const pattern1 = line.match(/^(.+?)\s*[-]\s*(.+?),\s*(.+?)\s*\((.+?)\)/);
    if (pattern1) {
      job = {
        title: pattern1[1].trim(),
        company: pattern1[2].trim(),
        location: pattern1[3].trim(),
        duration: pattern1[4].trim(),
        description: []
      };
    }
    
    // Pattern 2: Company, Location (Dates) followed by Title on next line
    const pattern2 = line.match(/^(.+?),\s*(.+?)\s*\((.+?)\)/);
    if (pattern2 && i + 1 < contentLines.length) {
      const nextLine = contentLines[i + 1].trim();
      if (nextLine && !nextLine.startsWith('') && !nextLine.startsWith('-')) {
        job = {
          title: nextLine,
          company: pattern1[1].trim(),
          location: pattern2[2].trim(),
          duration: pattern2[3].trim(),
          description: []
        };
        i++; // Skip the title line
      }
    }
    
    // Pattern 3: Title at Company (Dates)
    const pattern3 = line.match(/^(.+?)\s+at\s+(.+?)\s*\((.+?)\)/);
    if (pattern3) {
      job = {
        title: pattern3[1].trim(),
        company: pattern3[2].trim(),
        location: '',
        duration: pattern3[3].trim(),
        description: []
      };
    }
    
    // Pattern 4: Company | Title | Dates
    const pattern4 = line.match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)/);
    if (pattern4) {
      job = {
        title: pattern4[2].trim(),
        company: pattern4[1].trim(),
        location: '',
        duration: pattern4[3].trim(),
        description: []
      };
    }
    
    if (job) {
      // Collect bullet points/description
      i++;
      while (i < contentLines.length) {
        const bulletLine = contentLines[i].trim();
        if (!bulletLine) {
          i++;
          continue;
        }
        
        // Check if it's a bullet point
        if (bulletLine.match(/^[\-\*\+]\s+/) || bulletLine.match(/^[\s]*[\-\*\+]\s+/)) {
          job.description.push(bulletLine.replace(/^[\s]*[\-\*\+]\s+/, '').trim());
        } else if (bulletLine.match(/^\d+\.\s+/)) {
          job.description.push(bulletLine.replace(/^\d+\.\s+/, '').trim());
        } else {
          // Not a bullet point, might be next job
          break;
        }
        i++;
      }
      
      jobs.push(job);
    } else {
      i++;
    }
  }
  
  if (jobs.length === 0) {
    const cleanedLines = contentLines
      .map(line => line.replace(/^[\s\-\*\+]+/, '').trim())
      .filter(line => line && !isExperienceHeader(line));

    if (cleanedLines.length > 0) {
      const [titleLine, ...rest] = cleanedLines;
      const description = rest.map(line => line.replace(/^[\s\-\*\+]+/, '').trim()).filter(Boolean);
      jobs.push({
        title: titleLine,
        company: '',
        location: '',
        duration: '',
        description
      });
    }
  }

  return jobs;
}

/**
 * Parse education section
 * @param {string} text - Education section text
 * @returns {Array} Array of education objects
 */
function parseEducation(text) {
  const education = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  // Remove section header
  const contentLines = lines.filter(line => 
    !line.match(/^education/i)
  );
  
  let currentEd = null;
  
  for (const line of contentLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Pattern: Degree - Institution (Year)
    const pattern1 = trimmedLine.match(/^(.+?)\s*[-]\s*(.+?)\s*\((.+?)\)/);
    if (pattern1) {
      if (currentEd) education.push(currentEd);
      currentEd = {
        degree: pattern1[1].trim(),
        institution: pattern1[2].trim(),
        year: pattern1[3].trim(),
        gpa: null,
        details: []
      };
      continue;
    }
    
    // Pattern: Institution - Degree (Year)
    const pattern2 = trimmedLine.match(/^(.+?)\s*[-]\s*(.+?)\s*\((.+?)\)/);
    if (pattern2 && pattern2[1].match(/university|college|institute|school/i)) {
      if (currentEd) education.push(currentEd);
      currentEd = {
        degree: pattern2[2].trim(),
        institution: pattern2[1].trim(),
        year: pattern2[3].trim(),
        gpa: null,
        details: []
      };
      continue;
    }
    
    // Institution line
    if (trimmedLine.match(/university|college|institute|school/i)) {
      if (currentEd) education.push(currentEd);
      currentEd = {
        degree: '',
        institution: trimmedLine,
        year: '',
        gpa: null,
        details: []
      };
    }
    // Degree line
    else if (trimmedLine.match(/bachelor|master|phd|doctorate|diploma|certificate|b\.s\.|b\.a\.|m\.s\.|m\.a\./i) && currentEd) {
      currentEd.degree = trimmedLine;
    }
    // Year line
    else if (trimmedLine.match(/19\d{2}|20\d{2}/) && currentEd) {
      currentEd.year = trimmedLine;
    }
    // GPA line
    else if (trimmedLine.match(/gpa[\s:]+\d+\.\d+/i)) {
      if (currentEd) {
        currentEd.gpa = trimmedLine.match(/\d+\.\d+/)[0];
      }
    }
    // Other details
    else if (currentEd) {
      currentEd.details.push(trimmedLine);
    }
  }
  
  if (currentEd) education.push(currentEd);
  
  return education;
}

/**
 * Parse skills section with categorization
 * @param {string} text - Skills section text
 * @returns {Object} Categorized skills
 */
function parseSkills(text) {
  const skills = {
    technical: [],
    programming: [],
    tools: [],
    frameworks: [],
    databases: [],
    other: []
  };
  
  // Remove section header
  const cleanText = text.replace(/^(skills|technical\s+skills|competencies|technologies)\s*:?\s*/i, '');
  
  // Split by common delimiters and clean
  const skillItems = cleanText
    .split(/[,\n\|;]/)
    .map(skill => skill.replace(/^[\s\-\*\+]+/, '').trim())
    .filter(skill => skill.length > 0);
  
  // Categorize skills
  const categories = {
    programming: /java|python|javascript|c\+\+|c#|ruby|php|go|rust|swift|kotlin|scala|typescript/i,
    frameworks: /react|angular|vue|node|express|spring|django|flask|laravel|rails/i,
    databases: /mysql|postgresql|mongodb|redis|elasticsearch|sqlite|oracle/i,
    tools: /git|docker|kubernetes|jenkins|aws|azure|gcp|linux|windows/i
  };
  
  skillItems.forEach(skill => {
    let categorized = false;
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(skill)) {
        skills[category].push(skill);
        categorized = true;
        break;
      }
    }
    
    if (!categorized) {
      skills.other.push(skill);
    }
  });
  
  return skills;
}

/**
 * Parse certifications section
 * @param {string} text - Certifications section text
 * @returns {Array} Array of certification objects
 */
function parseCertifications(text) {
  const certifications = [];
  
  // Remove section header
  const cleanText = text.replace(/^(certifications?|certificates?)\s*:?\s*/i, '');
  
  const lines = cleanText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    const trimmedLine = line.replace(/^[\s\-\*\+]+/, '').trim();
    if (trimmedLine.length > 2) {
      // Try to extract certification name, issuer, and date
      const match = trimmedLine.match(/^(.+?)\s*[-]\s*(.+?)\s*\((.+?)\)/);
      if (match) {
        certifications.push({
          name: match[1].trim(),
          issuer: match[2].trim(),
          date: match[3].trim()
        });
      } else {
        certifications.push({
          name: trimmedLine,
          issuer: null,
          date: null
        });
      }
    }
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
  
  // Detect sections
  const sections = detectSections(resumeText);
  
  // Parse each section
  const parsedResume = {
    metadata: {
      parsedAt: new Date().toISOString(),
      originalLength: resumeText.length,
      sectionsFound: Object.keys(sections).filter(key => sections[key].start !== -1)
    },
    personalInfo: parsePersonalInfo(sections.personalInfo.content),
    summary: sections.summary.content.replace(/^(summary|objective|profile)\s*:?\s*/i, '').trim() || null,
    experience: parseExperience(sections.experience.content),
    education: parseEducation(sections.education.content),
    skills: parseSkills(sections.skills.content),
    projects: sections.projects.content ? sections.projects.content.split('\n').filter(line => line.trim()) : [],
    certifications: parseCertifications(sections.certifications.content),
    awards: sections.awards.content ? sections.awards.content.split('\n').filter(line => line.trim()) : [],
    publications: sections.publications.content ? sections.publications.content.split('\n').filter(line => line.trim()) : [],
    languages: sections.languages.content ? sections.languages.content.split(/[,\n]/).map(lang => lang.trim()).filter(lang => lang) : [],
    additionalInfo: sections.other.content || null
  };
  
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
