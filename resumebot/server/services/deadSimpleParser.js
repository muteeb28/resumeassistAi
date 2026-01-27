/**
 * DEAD SIMPLE PARSER V4
 * ZERO MERGE POLICY - Each line is its own item. Period.
 * No merging, no concatenation, no "smart" line joining.
 */

// Section headers - all possible variations
const SECTION_PATTERNS = {
  SUMMARY: /^(PROFESSIONAL SUMMARY|SUMMARY|PROFILE|OBJECTIVE|CAREER SUMMARY|EXECUTIVE SUMMARY)/i,
  SKILLS: /^(EXPERTISE AND SKILLS|EXPERTISE|SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|KEY SKILLS|TECHNOLOGIES)/i,
  EXPERIENCE: /^(EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|PROFESSIONAL EXPERIENCE|CAREER HISTORY|PROFESSIONAL CONTOUR|WORK HISTORY|CAREER|EMPLOYMENT HISTORY|ROLES|POSITIONS|JOB HISTORY)/i,
  PROJECTS: /^(PROJECTS|PERSONAL PROJECTS|KEY PROJECTS|NOTABLE PROJECTS)/i,
  COMMUNITY: /^(COMMUNITY & ACTIVITIES|COMMUNITY|CO-CURRICULAR ACTIVITIES|CO-CURRICULAR|ACTIVITIES|VOLUNTEER)/i,
  EDUCATION: /^(EDUCATION|ACADEMIC|QUALIFICATIONS|EDUCATIONAL BACKGROUND)/i,
  CERTIFICATIONS: /^(CERTIFICATIONS|CERTIFICATES|LICENSES|CREDENTIALS)/i,
  AWARDS: /^(AWARDS|HONORS|ACHIEVEMENTS|RECOGNITION)/i
};

// Extended bullet point characters (including Unicode)
const BULLET_REGEX = /^[-•●○◦▪▸►✓✔→⁃∙·*]\s*/;

// Month names for date detection
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// Check if a string is JUST a month abbreviation (invalid as company name)
function isMonthOnly(str) {
  const normalized = str.toLowerCase().trim();
  return MONTHS.includes(normalized);
}

// Check if a string looks like a date fragment (invalid as company name)
function isDateFragment(str) {
  const normalized = str.toLowerCase().trim();
  // Single month: "OCT", "Jan", etc.
  if (MONTHS.includes(normalized)) return true;
  // Month + year fragment: "Oct 20", "Jan '22"
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*['']?\d{0,4}$/i.test(normalized)) return true;
  // Just a year: "2022", "2023"
  if (/^\d{4}$/.test(normalized)) return true;
  // Year range fragment: "2022 -", "- 2023"
  if (/^[\d\s\-–—]+$/.test(normalized)) return true;
  return false;
}

// Check if a string contains a date range
function containsDate(str) {
  // Full year: 2020, 2021, etc.
  if (/\b(19|20)\d{2}\b/.test(str)) return true;
  // Month year: Jan 2020, January 2020
  if (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(19|20)\d{2}\b/i.test(str)) return true;
  // Short year: Jan '22, May 22
  if (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*['']?\d{2}\b/i.test(str)) return true;
  // Relative: Present, Current, Now
  if (/\b(present|current|now|ongoing|today)\b/i.test(str)) return true;
  return false;
}

// Clean page break markers and other artifacts
function cleanText(text) {
  return text
    .replace(/---\s*PAGE\s*BREAK\s*---/gi, '\n')
    .replace(/\[Page\s*\d+\]/gi, '')
    .replace(/Page\s*\d+\s*of\s*\d+/gi, '')
    .replace(/\f/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

// Validate company name - reject garbage
function isValidCompany(str) {
  if (!str || str.length < 2) return false;
  if (str.length > 100) return false;
  if (isDateFragment(str)) return false;
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(str)) return false;
  return true;
}

// Job title keywords
const JOB_KEYWORDS = ['Developer', 'Engineer', 'Manager', 'Lead', 'Director', 'Senior', 'Junior',
  'Analyst', 'Designer', 'Architect', 'Consultant', 'Specialist', 'Coordinator', 'Administrator',
  'Executive', 'Officer', 'Head', 'VP', 'Chief', 'Intern', 'Associate', 'Programmer', 'Technician'];

function normalizeHeader(line) {
  return line
    .toUpperCase()
    .replace(/[:\.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSection(line) {
  const normalized = normalizeHeader(line);

  // Section headers should be short (under 60 chars) and not contain sentences
  // Reject lines that are too long or contain lowercase words after the header
  if (normalized.length > 60) return null;

  // Reject if it looks like a sentence (has many words after the potential header)
  const words = normalized.split(/\s+/);
  if (words.length > 5) return null;

  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(normalized)) {
      // Additional validation: the whole line should be roughly just the header
      // Not "EXPERTISE IN MACHINE LEARNING AND DATA SCIENCE" (sentence)
      // But "EXPERTISE AND SKILLS" or "SKILLS" (header)
      return section;
    }
  }
  return null;
}

/**
 * Parse job header line - extract company, title, location, dates
 */
function parseJobHeader(line) {
  let title = '', company = '', location = '', dates = '';

  // Format 1: "Company, Location (Dates)" or "Title Company, Location (Dates)"
  const format1 = line.match(/^(.+?)\s*,\s*([^(]+?)\s*\(([^)]+)\)$/);
  if (format1 && containsDate(format1[3])) {
    const beforeComma = format1[1].trim();
    location = format1[2].trim();
    dates = format1[3].trim();

    // Try to split title and company using job keywords
    const words = beforeComma.split(/\s+/);
    let splitIdx = -1;
    for (let w = words.length - 1; w >= 0; w--) {
      if (JOB_KEYWORDS.some(k => words[w].toLowerCase().includes(k.toLowerCase()))) {
        splitIdx = w;
        break;
      }
    }

    if (splitIdx >= 0 && splitIdx < words.length - 1) {
      title = words.slice(0, splitIdx + 1).join(' ');
      company = words.slice(splitIdx + 1).join(' ');
    } else {
      company = beforeComma;
    }

    // Validate company
    if (!isValidCompany(company)) {
      console.log(`[SKIP] Invalid company name: "${company}"`);
      return null;
    }

    return { title, company, location, dates };
  }

  // Format 2: "Company (Dates)" or "Title Company (Dates)"
  const format2 = line.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (format2 && containsDate(format2[2])) {
    const beforeParen = format2[1].trim();
    dates = format2[2].trim();

    const words = beforeParen.split(/\s+/);
    let splitIdx = -1;
    for (let w = words.length - 1; w >= 0; w--) {
      if (JOB_KEYWORDS.some(k => words[w].toLowerCase().includes(k.toLowerCase()))) {
        splitIdx = w;
        break;
      }
    }

    if (splitIdx >= 0 && splitIdx < words.length - 1) {
      title = words.slice(0, splitIdx + 1).join(' ');
      company = words.slice(splitIdx + 1).join(' ');
    } else {
      company = beforeParen;
    }

    if (!isValidCompany(company)) {
      console.log(`[SKIP] Invalid company name: "${company}"`);
      return null;
    }

    return { title, company, location: '', dates };
  }

  // Format 3: Embedded date range (no parentheses)
  // "Company Name, Jan 2020 – Present" or "Company Name – Jan 2020 - Present"
  const dateRangeMatch = line.match(/^(.+?)\s*[,\-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*['']?\d{2,4}\s*[–—-]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|Now)[a-z]*\.?\s*['']?\d{0,4})\s*$/i);
  if (dateRangeMatch) {
    const beforeDate = dateRangeMatch[1].trim();
    dates = dateRangeMatch[2].trim();

    const parts = beforeDate.split(/\s*,\s*/);
    if (parts.length >= 2) {
      company = parts[0];
      location = parts.slice(1).join(', ');
    } else {
      company = beforeDate;
    }

    if (!isValidCompany(company)) {
      console.log(`[SKIP] Invalid company name: "${company}"`);
      return null;
    }

    return { title: '', company, location, dates };
  }

  return null;
}

/**
 * Main parser - ZERO MERGE POLICY
 */
export function parseResumeDeadSimple(text) {
  console.log('\n========== DEAD SIMPLE PARSER V4 (ZERO MERGE) ==========');

  const cleanedText = cleanText(text);
  const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l);

  // Extract name (first non-empty line that's not a section header)
  let name = '';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    if (!detectSection(lines[i]) && lines[i].length > 2 && lines[i].length < 60) {
      name = lines[i];
      break;
    }
  }

  // Extract contact info from header (first 10 lines to catch more patterns)
  let email = '', linkedin = '', github = '', twitter = '', phone = '';
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    console.log(`[HEADER LINE ${i}] "${line}"`);

    if (!email) {
      email = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] || '';
      if (email) console.log(`[EMAIL FOUND] ${email}`);
    }

    if (!phone) {
      // Match phone numbers: 9070005552, (907) 000-5552, +1-907-000-5552, etc.
      phone = line.match(/(?:\+?1[-\s]?)?\(?([0-9]{3})\)?[-\s]?([0-9]{3})[-\s]?([0-9]{4})/)?.[0] || '';
      if (phone) console.log(`[PHONE FOUND] ${phone}`);
    }

    if (!linkedin && /linkedin/i.test(line)) {
      const match = line.match(/(https?:\/\/)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
      if (match) {
        linkedin = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        console.log(`[LINKEDIN FOUND] ${linkedin}`);
      }
    }

    if (!github && /github/i.test(line)) {
      // Match full GitHub URL or partial like "github.com/username"
      const match = line.match(/(https?:\/\/)?github\.com\/([a-zA-Z0-9-]+)/i);
      if (match) {
        // Use the full match, or construct URL if protocol missing
        github = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        console.log(`[GITHUB FOUND] ${github} (from: "${line}")`);
      }
    }

    if (!twitter && /twitter|x\.com/i.test(line)) {
      const match = line.match(/(https?:\/\/)?(twitter|x)\.com\/([a-zA-Z0-9_]+)/i);
      if (match) {
        twitter = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
        console.log(`[TWITTER FOUND] ${twitter}`);
      }
    }
  }

  console.log(`[CONTACT INFO] email=${email}, phone=${phone}, linkedin=${linkedin}, github=${github}, twitter=${twitter}`);

  // State
  let currentSection = null;
  const summaryLines = [];
  const skills = [];
  const jobs = [];
  const projects = [];
  const community = [];
  const education = [];
  const certifications = [];

  let currentJob = null;
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const detected = detectSection(line);

    // Section boundary
    if (detected) {
      console.log(`[SECTION] ${detected} at line ${i + 1}: "${line.substring(0, 60)}${line.length > 60 ? '...' : ''}"`);

      // Save current job
      if (currentSection === 'EXPERIENCE' && currentJob) {
        jobs.push(currentJob);
        currentJob = null;
      }

      // Save current project
      if (currentSection === 'PROJECTS' && currentProject) {
        currentProject = null;
      }

      currentSection = detected;
      continue;
    }

    // Skip contact info lines
    if (line.includes('@') && line.includes('.')) continue;
    if (/linkedin\.com|github\.com|twitter\.com|x\.com/i.test(line)) continue;

    switch (currentSection) {
      case 'SUMMARY': {
        // Each line is added separately - NO MERGING
        if (line.trim()) {
          summaryLines.push(line.trim());
          console.log(`[SUMMARY LINE] "${line.substring(0, 80)}${line.length > 80 ? '...' : ''}"`);
        }
        break;
      }

      case 'SKILLS': {
        const cleaned = line.replace(BULLET_REGEX, '').trim();
        if (!cleaned) break;

        // First try splitting by delimiters (comma, semicolon, pipe)
        let items = cleaned.split(/[,;|•·]/).map(s => s.trim()).filter(s => s && s.length > 1);

        // If no delimiters found (only 1 item), try splitting by spaces
        if (items.length === 1 && items[0].split(/\s+/).length > 4) {
          items = cleaned.split(/\s+/).map(s => s.trim()).filter(s => s && s.length > 1);
          console.log(`[SKILLS SPACE-SPLIT] Found ${items.length} items`);
        }

        for (const item of items) {
          // Reject items that look like sentences (too many words)
          const wordCount = item.split(/\s+/).length;

          // Reject action phrases that look like job descriptions
          const isActionPhrase = /^(design|build|develop|create|implement|manage|lead|work|ensure|maintain|optimize|improve)\s+/i.test(item);

          // Reject items with articles (the, a, an)
          const hasArticles = /\b(the|a|an)\b/i.test(item);

          // Accept: 1-4 words, under 50 chars, not an action phrase, no articles
          if (wordCount <= 4 && item.length < 50 && !isActionPhrase && !hasArticles) {
            skills.push(item);
            console.log(`[SKILL ADDED] "${item}"`);
          }
        }
        break;
      }

      case 'EXPERIENCE': {
        // Try to parse as job header
        const jobHeader = parseJobHeader(line);

        if (jobHeader) {
          // Save previous job
          if (currentJob) {
            jobs.push(currentJob);
          }

          currentJob = {
            title: jobHeader.title,
            company: jobHeader.company,
            location: jobHeader.location,
            duration: jobHeader.dates,
            description: []
          };
          console.log(`[JOB] ${jobHeader.title || '(no title)'} at ${jobHeader.company} (${jobHeader.dates})`);
        } else if (!jobHeader && !currentJob && !BULLET_REGEX.test(line) && line.length > 5) {
          // No structured header, but we're in EXPERIENCE section with content
          // Check if this looks like a title line (contains job keywords or dates)
          const hasJobKeyword = JOB_KEYWORDS.some(k => line.toLowerCase().includes(k.toLowerCase()));
          const hasDate = containsDate(line);

          if (hasJobKeyword || hasDate) {
            // Start a new job entry - preserve what we can
            currentJob = {
              title: '',
              company: '',
              location: '',
              duration: '',
              description: []
            };

            // Try to extract title and dates from line
            if (hasDate) {
              // Line format: "Title DATE_RANGE"
              const dateMatch = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*['']?\d{2,4}\s*[–—-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|Now)[a-z]*\.?\s*['']?\d{0,4}/i);
              if (dateMatch) {
                currentJob.duration = dateMatch[0];
                currentJob.title = line.replace(dateMatch[0], '').trim();
              } else {
                currentJob.title = line;
              }
            } else {
              currentJob.title = line;
            }

            console.log(`[JOB FALLBACK] Title: "${currentJob.title}", Dates: "${currentJob.duration}"`);
          } else {
            console.log(`[NO JOB MATCH] "${line.substring(0, 80)}${line.length > 80 ? '...' : ''}"`);
          }
        } else if (currentJob) {
          // We have a current job - check what this line is

          // Check if it's a company line (all caps, short, no bullet)
          if (!currentJob.company && !BULLET_REGEX.test(line) && line.length < 80 && line === line.toUpperCase() && /[A-Z]/.test(line)) {
            currentJob.company = line.trim();
            console.log(`[JOB COMPANY] ${line.trim()}`);
            break;
          }

          // Check if this line is a job title (for jobs where title is on separate line)
          if (!currentJob.title && !BULLET_REGEX.test(line) && line.length < 80) {
            if (JOB_KEYWORDS.some(k => line.toLowerCase().includes(k.toLowerCase()))) {
              currentJob.title = line.trim();
              console.log(`[JOB TITLE] ${line.trim()}`);
              break;
            }
          }

          // Before treating as bullet, check if this is actually a NEW job header
          const hasJobKeyword = JOB_KEYWORDS.some(k => line.toLowerCase().includes(k.toLowerCase()));
          const hasDate = containsDate(line);
          const startsWithCapital = /^[A-Z]/.test(line);

          // Job titles must start with capital letter, have keywords or dates, and not be a bullet
          if (!BULLET_REGEX.test(line) && (hasJobKeyword || hasDate) && startsWithCapital && line.length < 100) {
            // This looks like a new job header - save current and start new
            jobs.push(currentJob);

            currentJob = {
              title: '',
              company: '',
              location: '',
              duration: '',
              description: []
            };

            // Extract title and dates
            const dateMatch = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*['']?\d{2,4}\s*[–—-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|Now)[a-z]*\.?\s*['']?\d{0,4}/i);
            if (dateMatch) {
              currentJob.duration = dateMatch[0];
              currentJob.title = line.replace(dateMatch[0], '').trim();
            } else {
              currentJob.title = line;
            }

            console.log(`[JOB SPLIT] New job detected: "${currentJob.title}", Dates: "${currentJob.duration}"`);
          } else {
            // This is a bullet point - ADD AS-IS, NO MERGING
            const cleaned = line.replace(BULLET_REGEX, '').trim();
            if (cleaned && cleaned.length > 3) {
              currentJob.description.push(cleaned);
            }
          }
        }
        break;
      }

      case 'PROJECTS': {
        const cleaned = line.replace(BULLET_REGEX, '').trim();
        if (!cleaned) break;

        // Common tech keywords to detect tech stack lines
        const TECH_KEYWORDS = ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'html', 'css',
          'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'git', 'api', 'apis', 'rest', 'graphql',
          'angular', 'vue', 'express', 'django', 'flask', 'spring', 'salesforce', 'demandware',
          'google analytics', 'wordpress', 'php', 'ruby', 'rails', 'c++', 'c#', '.net', 'azure'];

        // Check if line is primarily a tech stack (multiple tech keywords, few other words)
        const lowerCleaned = cleaned.toLowerCase();
        const techMatches = TECH_KEYWORDS.filter(tech => lowerCleaned.includes(tech));
        const wordCount = cleaned.split(/\s+/).length;
        const isTechLine = techMatches.length >= 2 || (techMatches.length >= 1 && wordCount <= 6 && !cleaned.includes('.'));

        // Single tech word that shouldn't be a project header
        const isSingleTechWord = TECH_KEYWORDS.some(tech => lowerCleaned === tech || lowerCleaned === tech + 's');

        // Detect project header (ALL CAPS or Title Case short line)
        // But NOT if it's a single tech keyword
        const isHeader = !isSingleTechWord && (
          (cleaned === cleaned.toUpperCase() && cleaned.length > 3 && cleaned.length < 60 && /[A-Z]/.test(cleaned) && cleaned.split(/\s+/).length >= 2) ||
          (/^[A-Z][a-zA-Z\s\-&]+$/.test(cleaned) && cleaned.length < 50 && cleaned.split(/\s+/).length >= 2 && cleaned.split(/\s+/).length <= 5)
        );

        if (isHeader && !/^https?:\/\//i.test(cleaned)) {
          currentProject = {
            name: cleaned,
            description: '',
            bullets: [],
            tech: [],
            link: ''
          };
          projects.push(currentProject);
          console.log(`[PROJECT] ${cleaned}`);
        } else if (currentProject) {
          // Check if line is ONLY a URL label with no URL
          if (/^\s*(URL:|Link:|Website:)\s*$/gi.test(cleaned)) {
            // Skip - it's just a label with no content
            break;
          }

          // Handle "Link: URL" or "URL: URL" format
          const linkPrefixMatch = cleaned.match(/^(URL|Link|Website):\s*(https?:\/\/[^\s,]+)/i);
          if (linkPrefixMatch) {
            if (!currentProject.link) {
              currentProject.link = linkPrefixMatch[2];
              console.log(`[PROJECT LINK] ${linkPrefixMatch[2]}`);
            }
            break; // Don't add as bullet
          }

          // Extract URL from text if present (embedded in sentence)
          const urlMatch = cleaned.match(/https?:\/\/[^\s,]+/i);
          if (urlMatch) {
            if (!currentProject.link) {
              currentProject.link = urlMatch[0];
            }
            // Remove URL from text for cleaner bullet
            let textWithoutUrl = cleaned
              .replace(/https?:\/\/[^\s,]+/gi, '')
              .replace(/\s*(URL:|Link:|Website:|including:)\s*/gi, '')
              .replace(/\s*[,;:\s]+$/g, '')  // Remove trailing punctuation
              .trim();
            if (textWithoutUrl && textWithoutUrl.length > 5 && !/^[,.\s]*$/.test(textWithoutUrl)) {
              currentProject.bullets.push(textWithoutUrl);
            }
          } else if (/^https?:\/\//i.test(cleaned)) {
            // Line is just a URL
            if (!currentProject.link) {
              currentProject.link = cleaned;
            }
          } else if (isTechLine) {
            // This is a tech stack line - parse into tech array
            const techItems = cleaned
              .replace(/^(Tech:|Technologies:|Stack:)\s*/gi, '')  // Remove tech labels
              .split(/[,;|•·]/)
              .map(s => s.trim())
              .filter(s => s && s.length > 1);
            for (const item of techItems) {
              if (item.length < 40) {
                currentProject.tech.push(item);
              }
            }
            console.log(`[PROJECT TECH] ${techItems.join(', ')}`);
          } else if (isSingleTechWord) {
            // Single tech word - add to tech array (remove "Tech:" prefix if present)
            const cleanTech = cleaned.replace(/^(Tech:|Technologies:|Stack:)\s*/gi, '').trim();
            if (cleanTech) {
              currentProject.tech.push(cleanTech);
              console.log(`[PROJECT TECH] ${cleanTech}`);
            }
          } else {
            // Regular bullet/description - clean trailing artifacts
            let cleanedBullet = cleaned
              .replace(/\s*(URL:|Link:|Website:)\s*$/gi, '')
              .replace(/\s*[,;:\s]+$/g, '')
              .trim();
            if (cleanedBullet && cleanedBullet.length > 3) {
              currentProject.bullets.push(cleanedBullet);
            }
          }
        } else if (!currentProject && !isSingleTechWord && !isTechLine) {
          // No current project but got content - create unnamed project
          currentProject = {
            name: cleaned.length < 60 ? cleaned : 'Project',
            description: '',
            bullets: [],
            tech: [],
            link: ''
          };
          projects.push(currentProject);
          console.log(`[PROJECT] ${currentProject.name}`);
        }
        break;
      }

      case 'COMMUNITY': {
        const cleaned = line.replace(BULLET_REGEX, '').trim();
        if (!cleaned) break;

        // Each community item is its own entry - NO MERGING
        community.push({
          role: cleaned,
          organization: ''
        });
        break;
      }

      case 'EDUCATION': {
        const cleaned = line.replace(BULLET_REGEX, '').trim();
        if (cleaned && cleaned.length > 3) {
          education.push(cleaned);
        }
        break;
      }

      case 'CERTIFICATIONS': {
        const cleaned = line.replace(BULLET_REGEX, '').trim();
        if (cleaned && cleaned.length > 3) {
          certifications.push(cleaned);
          console.log(`[CERTIFICATION] "${cleaned}"`);
        }
        break;
      }
    }
  }

  // Save last job
  if (currentJob) {
    jobs.push(currentJob);
  }

  // Build summary - join with space, but validate completeness
  let summary = summaryLines.join(' ');

  // Validate summary doesn't end with incomplete word
  const incompleteEndings = /\s+(with|and|or|the|a|an|to|for|in|on|at|of|by|as|including|such|like|using|via)\s*$/i;
  if (incompleteEndings.test(summary)) {
    console.warn('[WARN] Summary appears truncated - ends with:', summary.match(incompleteEndings)?.[0]);
    // Try to complete from next section if possible
  }

  // Dedupe skills
  const uniqueSkills = [...new Set(skills)];

  console.log(`\n[RESULTS - V4 ZERO MERGE]`);
  console.log(`  Name: ${name}`);
  console.log(`  Summary: ${summary.length} chars`);
  console.log(`  Skills: ${uniqueSkills.length}`);
  console.log(`  Jobs: ${jobs.length}`);
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Education: ${education.length}`);
  console.log(`  Certifications: ${certifications.length}`);

  // Log ALL job details for debugging
  jobs.forEach((job, idx) => {
    console.log(`\n[JOB ${idx + 1}] ${job.title} at ${job.company}`);
    console.log(`  Dates: ${job.duration}`);
    console.log(`  Bullets: ${job.description.length}`);
    if (job.description.length > 0) {
      job.description.forEach((b, i) => {
        console.log(`    ${i + 1}. ${b.substring(0, 100)}${b.length > 100 ? '...' : ''}`);
      });
    }
  });

  console.log('\n==========================================\n');

  return {
    personalInfo: { name, email, phone, location: '', linkedin, github, twitter },
    summary,
    experience: jobs,
    skills: uniqueSkills,
    education,
    projects,
    certifications,
    awards: [],
    community
  };
}

// ============================================================================
// V2 OUTPUT FORMAT
// ============================================================================

const DEFAULT_SECTION_ORDER = {
  summary: 0,
  experience: 10,
  education: 20,
  skills: 30,
  projects: 40,
  certifications: 50,
  community: 60,
  awards: 70,
};

const DEFAULT_SECTION_LAYOUT = {
  summary: 'text',
  experience: 'timeline',
  education: 'education',
  skills: 'list',
  projects: 'projects',
  certifications: 'certifications',
  community: 'timeline',
  awards: 'list',
};

const DEFAULT_SECTION_LABELS = {
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  community: 'Community & Activities',
  awards: 'Awards & Honors',
};

function createSection(id, items, rawText = null) {
  return {
    id,
    label: DEFAULT_SECTION_LABELS[id] || id.charAt(0).toUpperCase() + id.slice(1),
    layout: DEFAULT_SECTION_LAYOUT[id] || 'text',
    order: DEFAULT_SECTION_ORDER[id] ?? 100,
    visible: items.length > 0 || (rawText && rawText.trim().length > 0),
    rawText: rawText || undefined,
    items,
  };
}

export function parseResumeDeadSimpleV2(text) {
  const parsed = parseResumeDeadSimple(text);

  const links = [];
  if (parsed.personalInfo.linkedin) links.push(parsed.personalInfo.linkedin);
  if (parsed.personalInfo.github) links.push(parsed.personalInfo.github);
  if (parsed.personalInfo.twitter) links.push(parsed.personalInfo.twitter);

  const sections = {};

  if (parsed.summary) {
    sections.summary = createSection('summary', [{
      type: 'text',
      content: parsed.summary,
    }]);
  }

  if (parsed.experience && parsed.experience.length > 0) {
    sections.experience = createSection('experience', parsed.experience.map(exp => ({
      type: 'timeline',
      title: exp.title || '',
      organization: exp.company || '',
      location: exp.location || '',
      dates: exp.duration || '',
      bullets: Array.isArray(exp.description) ? exp.description : [],
    })));
  }

  if (parsed.skills && parsed.skills.length > 0) {
    sections.skills = createSection('skills', parsed.skills.map(skill => ({
      type: 'list',
      value: skill,
    })));
  }

  if (parsed.education && parsed.education.length > 0) {
    const eduItems = parseEducationLines(parsed.education);
    sections.education = createSection('education', eduItems,
      eduItems.length === 0 ? parsed.education.join('\n') : undefined);
  }

  if (parsed.projects && parsed.projects.length > 0) {
    sections.projects = createSection('projects', parsed.projects.map(proj => ({
      type: 'project',
      name: proj.name || '',
      description: proj.description || '',
      tech: proj.tech || [],
      bullets: proj.bullets || [],
      link: proj.link || '',
    })));
  }

  if (parsed.certifications && parsed.certifications.length > 0) {
    sections.certifications = createSection('certifications', parsed.certifications.map(cert => ({
      type: 'certification',
      name: typeof cert === 'string' ? cert : cert.name || '',
      issuer: typeof cert === 'object' ? cert.issuer : undefined,
      date: typeof cert === 'object' ? cert.date : undefined,
    })));
  }

  if (parsed.community && parsed.community.length > 0) {
    sections.community = createSection('community', parsed.community.map(item => ({
      type: 'timeline',
      title: item.role || '',
      organization: item.organization || '',
      description: item.description || '',
      bullets: item.bullets || [],
    })));
  }

  if (parsed.awards && parsed.awards.length > 0) {
    sections.awards = createSection('awards', parsed.awards.map(award => ({
      type: 'list',
      value: typeof award === 'string' ? award : award.name || '',
    })));
  }

  return {
    version: 2,
    basics: {
      name: parsed.personalInfo.name || '',
      title: '',
      email: parsed.personalInfo.email || '',
      phone: parsed.personalInfo.phone || '',
      location: parsed.personalInfo.location || '',
      links,
      summary: parsed.summary || '',
    },
    sections,
  };
}

function parseEducationLines(lines) {
  const items = [];

  for (const line of lines) {
    if (!line || typeof line !== 'string') continue;

    // Format: "Degree - School (Year)"
    const withYear = line.match(/^(.+?)\s*[–-]\s*(.+?)\s*\((\d{4}(?:\s*[-–]\s*\d{4})?)\)$/);
    if (withYear) {
      const part1 = withYear[1].trim();
      const part2 = withYear[2].trim();
      const dates = withYear[3].trim();

      const schoolKeywords = /university|college|institute|school|academy/i;
      const degreeKeywords = /bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|degree|diploma/i;

      let school, degree;
      if (schoolKeywords.test(part1) || degreeKeywords.test(part2)) {
        school = part1;
        degree = part2;
      } else if (schoolKeywords.test(part2) || degreeKeywords.test(part1)) {
        school = part2;
        degree = part1;
      } else {
        degree = part1;
        school = part2;
      }

      items.push({ type: 'education', school, degree, dates });
      continue;
    }

    // Format: "Degree, School"
    const withComma = line.match(/^(.+?)\s*,\s*(.+)$/);
    if (withComma) {
      const part1 = withComma[1].trim();
      const part2 = withComma[2].trim();

      const schoolKeywords = /university|college|institute|school|academy/i;
      let school, degree;
      if (schoolKeywords.test(part1)) {
        school = part1;
        degree = part2;
      } else {
        degree = part1;
        school = part2;
      }

      items.push({ type: 'education', school, degree });
      continue;
    }

    // Fallback
    if (line.trim().length > 3) {
      items.push({ type: 'education', school: line.trim() });
    }
  }

  return items;
}
