/**
 * UNIVERSAL RESUME PARSER
 * Handles ALL resume formats: long, short, any section headings
 * Works with Aatika's format and traditional formats
 */

export function parseResumeUniversal(resumeText) {
  console.log('\n========== UNIVERSAL PARSER START ==========');
  console.log(`Input length: ${resumeText.length} characters`);

  // Step 1: Normalize text
  const normalized = normalizeText(resumeText);
  const lines = normalized.split('\n');

  // Step 2: Find all sections dynamically
  const sections = findAllSections(lines);

  console.log(`Found sections: ${Object.keys(sections).join(', ')}`);

  // Step 3: Extract data from each section
  const result = {
    personalInfo: extractPersonalInfo(sections.header || []),
    summary: extractFromSection(sections.summary || sections.profile || sections.objective || []),
    experience: extractExperienceUniversal(sections.experience || sections.work || []),
    skills: extractSkillsUniversal(sections.skills || sections.expertise || []),
    education: extractEducationUniversal(sections.education || []),
    projects: extractProjectsUniversal(sections.projects || []),
    certifications: extractCertificationsUniversal(sections.certifications || sections.certificates || []),
    awards: extractAwardsUniversal(sections.awards || sections.achievements || sections.honors || []),
    community: extractCommunityUniversal(sections.community || []),
    other: {}
  };

  // Add any extra sections we found
  for (const [key, value] of Object.entries(sections)) {
    const knownSections = ['header', 'summary', 'profile', 'objective', 'experience', 'work',
                           'skills', 'expertise', 'education', 'projects', 'certifications',
                           'certificates', 'awards', 'achievements', 'honors', 'community'];
    if (!knownSections.includes(key)) {
      result.other[key] = value.join('\n');
    }
  }

  console.log(`\n✓ Extracted: ${result.experience.length} jobs, ${result.skills.length} skills, ${result.education.length} education`);
  console.log('========== UNIVERSAL PARSER END ==========\n');

  return result;
}

/**
 * Normalize text for consistent parsing
 */
function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .trim();
}

/**
 * Dynamically find ALL sections in the resume
 * Works with ANY section heading
 */
function findAllSections(lines) {
  const sections = {};
  let currentSection = 'header';
  let currentLines = [];

  // Common section keywords (case insensitive)
  const sectionKeywords = [
    'experience', 'work', 'employment', 'professional',
    'education', 'academic', 'qualification',
    'skills', 'expertise', 'competencies', 'technical',
    'projects', 'portfolio',
    'certifications', 'certificates', 'licenses',
    'awards', 'achievements', 'honors', 'recognition',
    'summary', 'profile', 'objective', 'about',
    'community', 'volunteer', 'activities',
    'publications', 'research', 'patents'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this line is a section heading
    // Section headings are usually:
    // 1. All caps or Title Case
    // 2. Short (< 50 chars)
    // 3. Contains a keyword
    // 4. Followed by content or a colon

    if (line.length > 0 && line.length < 50) {
      const lowerLine = line.toLowerCase().replace(/[:\-]/g, '');

      // Check if it matches a known section keyword
      const matchedKeyword = sectionKeywords.find(keyword =>
        lowerLine.includes(keyword) || lowerLine === keyword
      );

      // Also check if it's all uppercase (likely a section header)
      const isAllCaps = line === line.toUpperCase() && /[A-Z]{2,}/.test(line);

      if (matchedKeyword || (isAllCaps && !line.match(/\d{4}/) && !line.match(/@/))) {
        // Save previous section
        if (currentLines.length > 0) {
          sections[currentSection] = currentLines;
        }

        // Start new section
        currentSection = matchedKeyword || lowerLine.replace(/\s+/g, '_');
        currentLines = [];
        continue;
      }
    }

    // Add line to current section
    if (line) {
      currentLines.push(line);
    }
  }

  // Save last section
  if (currentLines.length > 0) {
    sections[currentSection] = currentLines;
  }

  return sections;
}

/**
 * Extract personal info from header
 */
function extractPersonalInfo(lines) {
  const info = {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    twitter: '',
    website: ''
  };

  if (lines.length === 0) return info;

  // First non-empty line is usually the name
  info.name = lines[0] || '';

  // Join all lines to search for patterns
  const text = lines.join(' ');

  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) info.email = emailMatch[1];

  // Extract phone
  const phoneMatch = text.match(/(\+?\d[\d\s\-\(\)]{8,})/);
  if (phoneMatch) info.phone = phoneMatch[1].trim();

  // Extract LinkedIn
  const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9\-]+)/i);
  if (linkedinMatch) info.linkedin = linkedinMatch[1];

  // Extract GitHub
  const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9\-]+)/i);
  if (githubMatch) info.github = githubMatch[1];

  // Extract Twitter
  const twitterMatch = text.match(/(twitter\.com\/[a-zA-Z0-9\-]+)/i);
  if (twitterMatch) info.twitter = twitterMatch[1];

  // Extract location (City, Country pattern)
  const locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2,})/);
  if (locationMatch) info.location = `${locationMatch[1]}, ${locationMatch[2]}`;

  return info;
}

/**
 * Extract text from a section
 */
function extractFromSection(lines) {
  return lines.join(' ').trim();
}

/**
 * UNIVERSAL EXPERIENCE EXTRACTOR
 * Handles multiple formats:
 * - Single line: "Title Company, Location (Dates)"
 * - Pipe separated: "Title | Company | Dates"
 * - Multi-line: Title on one line, company/dates on next
 */
function extractExperienceUniversal(lines) {
  const jobs = [];
  let i = 0;

  console.log(`\n[Experience] Processing ${lines.length} lines`);

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // Try to detect if this is a job entry
    const jobData = detectAndParseJobEntry(lines, i);

    if (jobData.job) {
      jobs.push(jobData.job);
      console.log(`[Experience] ✓ Job #${jobs.length}: ${jobData.job.title} at ${jobData.job.company}`);
      i = jobData.nextIndex;
    } else {
      i++;
    }
  }

  return jobs;
}

/**
 * Detect and parse a job entry starting at index i
 */
function detectAndParseJobEntry(lines, startIndex) {
  const line = lines[startIndex].trim();

  // Format 1: "Title Company, Location (Dates)" - all on one line
  const format1 = parseFormat1(line);
  if (format1) {
    const bullets = collectBullets(lines, startIndex + 1);
    return {
      job: { ...format1, description: bullets.bullets },
      nextIndex: bullets.nextIndex
    };
  }

  // Format 2: "Title | Company | Dates" - pipe separated
  const format2 = parseFormat2(line);
  if (format2) {
    const bullets = collectBullets(lines, startIndex + 1);
    return {
      job: { ...format2, description: bullets.bullets },
      nextIndex: bullets.nextIndex
    };
  }

  // Format 3: Multi-line - title on one line, company/dates on next
  const format3 = parseFormat3(lines, startIndex);
  if (format3.job) {
    const bullets = collectBullets(lines, format3.companyLineIndex + 1);
    return {
      job: { ...format3.job, description: bullets.bullets },
      nextIndex: bullets.nextIndex
    };
  }

  return { job: null, nextIndex: startIndex + 1 };
}

/**
 * Parse Format 1: "Title Company, Location (Dates)"
 */
function parseFormat1(line) {
  // Pattern: Text ending with ", Location (Dates)"
  const match = line.match(/^(.+?)\s*,\s*([^(]+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return null;

  const beforeLocation = match[1];
  const location = match[2].trim();
  const duration = match[3].trim();

  // Check if this actually has dates
  if (!/\d{4}|present|current/i.test(duration)) return null;

  // Split beforeLocation into title and company
  const { title, company } = splitTitleCompany(beforeLocation);

  return { title, company, location, duration };
}

/**
 * Parse Format 2: "Title | Company | Dates" - pipe separated
 */
function parseFormat2(line) {
  if (!line.includes('|')) return null;

  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 2) return null;

  // Find which part has a year (that's the date)
  const dateIndex = parts.findIndex(p => /\d{4}/.test(p));

  if (dateIndex < 0) {
    // No date found, check if we have at least title and company
    if (parts.length >= 2) {
      return {
        title: parts[0],
        company: parts[1],
        location: parts[2] || '',
        duration: ''
      };
    }
    return null;
  }

  // Build the job object
  const job = {
    title: '',
    company: '',
    location: '',
    duration: parts.slice(dateIndex).join(' ').trim()
  };

  if (dateIndex >= 1) {
    job.title = parts.slice(0, dateIndex > 1 ? dateIndex - 1 : 1).join(' ').trim();
  }

  if (dateIndex >= 2) {
    const possibleCompany = parts[dateIndex - 1];
    const possibleLocation = dateIndex >= 3 ? parts[dateIndex - 2] : '';

    // Check if possibleCompany looks like a location (has country/city names)
    if (/\b(UK|USA|US|India|Japan|Germany|France|Canada|China|Singapore)\b/i.test(possibleCompany)) {
      job.location = possibleCompany;
      job.company = possibleLocation;
    } else {
      job.company = possibleCompany;
      if (dateIndex >= 3) {
        job.location = possibleLocation;
      }
    }
  }

  return job;
}

/**
 * Parse Format 3: Multi-line (title on one line, company/dates on next)
 */
function parseFormat3(lines, startIndex) {
  const line = lines[startIndex].trim();
  const nextLine = lines[startIndex + 1]?.trim() || '';

  // Check if line looks like a job title
  const hasJobKeyword = /\b(Developer|Engineer|Manager|Director|Lead|Senior|Junior|Consultant|Analyst|Designer|Architect|Specialist)\b/i.test(line);

  if (!hasJobKeyword) return { job: null };

  // Check if next line has company/location/dates
  const companyMatch = nextLine.match(/^(.+?)\s*,\s*([^(]+?)\s*\(([^)]+)\)\s*$/);
  if (companyMatch) {
    return {
      job: {
        title: line,
        company: companyMatch[1].trim(),
        location: companyMatch[2].trim(),
        duration: companyMatch[3].trim()
      },
      companyLineIndex: startIndex + 1
    };
  }

  return { job: null };
}

/**
 * Split "Title Company" into separate title and company
 */
function splitTitleCompany(text) {
  // Remove (Contract), (Full-time), etc.
  const cleaned = text.replace(/\((?:Contract|Full-time|Part-time|Remote|Freelance)\)/gi, '').trim();

  // Job title keywords
  const titleKeywords = ['Developer', 'Engineer', 'Manager', 'Director', 'Lead', 'Senior', 'Junior',
                        'Consultant', 'Analyst', 'Designer', 'Architect', 'Specialist', 'Coordinator'];

  // Find the last occurrence of a job keyword
  let titleEnd = -1;
  const words = cleaned.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    if (titleKeywords.some(k => words[i].toLowerCase().includes(k.toLowerCase()))) {
      titleEnd = i;
    }
  }

  if (titleEnd >= 0 && titleEnd < words.length - 1) {
    return {
      title: words.slice(0, titleEnd + 1).join(' '),
      company: words.slice(titleEnd + 1).join(' ')
    };
  }

  // Fallback: whole thing is title
  return { title: cleaned, company: '' };
}

/**
 * Collect bullet points following a job entry
 */
function collectBullets(lines, startIndex) {
  const bullets = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // Stop if we hit another job entry
    if (detectAndParseJobEntry(lines, i).job) {
      break;
    }

    // Stop if we hit a section header
    if (isSectionHeader(line)) {
      break;
    }

    // Collect bullet points
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || line.startsWith('○')) {
      bullets.push(line.replace(/^[-•*○]\s*/, '').trim());
      i++;
    }
    // Also collect regular lines that look like descriptions (start with capital, reasonable length)
    else if (/^[A-Z]/.test(line) && line.length > 15 && line.length < 300 && !line.match(/\d{4}/)) {
      bullets.push(line);
      i++;
    } else {
      i++;
    }
  }

  return { bullets, nextIndex: i };
}

/**
 * Check if a line is a section header
 */
function isSectionHeader(line) {
  if (line.length > 50) return false;

  const upperRatio = (line.match(/[A-Z]/g) || []).length / line.length;
  return upperRatio > 0.7;
}

/**
 * UNIVERSAL SKILLS EXTRACTOR
 */
function extractSkillsUniversal(lines) {
  const skills = new Set();

  for (const line of lines) {
    // Split by common delimiters
    const items = line.split(/[,;|•·]/).map(s => s.trim());

    for (let item of items) {
      // Remove leading markers
      item = item.replace(/^[-•*○]\s*/, '').trim();

      // Skip empty or too long
      if (!item || item.length > 80) continue;

      // Clean up
      item = item.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '');

      if (item.length > 1) {
        skills.add(item);
      }
    }
  }

  return Array.from(skills);
}

/**
 * UNIVERSAL EDUCATION EXTRACTOR
 */
function extractEducationUniversal(lines) {
  const education = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for degree keywords
    if (/\b(Bachelor|Master|PhD|Ph\.D|B\.S|B\.A|M\.S|M\.A|MBA|Diploma|Certificate|Degree)\b/i.test(line)) {
      const entry = {
        degree: '',
        school: '',
        graduation: '',
        location: '',
        details: []
      };

      // Extract degree
      const degreeMatch = line.match(/(Bachelor|Master|PhD|Ph\.D|B\.S|B\.A|M\.S|M\.A|MBA|Diploma|Certificate|Degree)[^,\n]*/i);
      if (degreeMatch) entry.degree = degreeMatch[0].trim();

      // Extract school
      const schoolMatch = line.match(/([A-Z][^\n,]*(?:University|College|Institute|School)[^\n,]*)/i);
      if (schoolMatch) entry.school = schoolMatch[0].trim();

      // Extract year
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) entry.graduation = yearMatch[0];

      education.push(entry);
    }
  }

  return education;
}

/**
 * UNIVERSAL PROJECTS EXTRACTOR
 */
function extractProjectsUniversal(lines) {
  const projects = [];
  let current = null;

  for (const line of lines) {
    if (!line) continue;

    // Bullet points belong to current project
    if ((line.startsWith('-') || line.startsWith('•')) && current) {
      current.bullets.push(line.replace(/^[-•]\s*/, '').trim());
    }
    // New project (starts with capital, has colon or dash)
    else if (/^[A-Z●]/.test(line) && !line.startsWith('-')) {
      if (current) projects.push(current);

      const parts = line.split(/[:\-]/);
      current = {
        name: parts[0].replace(/^[●•]\s*/, '').trim(),
        description: parts[1]?.trim() || '',
        bullets: []
      };
    }
  }

  if (current) projects.push(current);

  return projects;
}

/**
 * UNIVERSAL CERTIFICATIONS EXTRACTOR
 */
function extractCertificationsUniversal(lines) {
  const certs = [];

  for (const line of lines) {
    if (!line) continue;

    const cleaned = line.replace(/^[-•*○]\s*/, '').trim();
    if (cleaned.length > 2) {
      certs.push(cleaned);
    }
  }

  return certs;
}

/**
 * UNIVERSAL AWARDS EXTRACTOR
 */
function extractAwardsUniversal(lines) {
  return extractCertificationsUniversal(lines); // Same logic
}

/**
 * UNIVERSAL COMMUNITY EXTRACTOR
 */
function extractCommunityUniversal(lines) {
  const activities = [];
  let current = null;

  for (const line of lines) {
    if (!line) continue;

    // Check for role/organization pattern
    const roleMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (roleMatch) {
      if (current) activities.push(current);
      current = {
        role: roleMatch[1].trim(),
        organization: roleMatch[2].trim(),
        description: ''
      };
    } else if (line.startsWith('-') || line.startsWith('•')) {
      if (current) {
        current.description = line.replace(/^[-•]\s*/, '').trim();
      }
    } else if (!current) {
      current = {
        role: line,
        organization: '',
        description: ''
      };
    }
  }

  if (current) activities.push(current);

  return activities;
}
