/**
 * Resume Parser and Formatter with Length-Based Logic
 * Handles different formatting strategies based on resume length
 */

/**
 * Estimate resume page count based on content length and structure
 * @param {string} resumeText - Raw resume text
 * @returns {number} Estimated page count
 */
function estimateResumePageCount(resumeText) {
  const textLength = resumeText.length;
  const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
  
  // Count actual job entries by looking for company - date patterns
  const jobEntries = resumeText.match(/(\w+.*?)\s+-\s+(\w+.*?)\n(19|20)\d{2}\s*-\s*(Present|\d{4})/gi) || [];
  const bulletPoints = resumeText.match(/^[\s]*[\-\*]\s+/gm) || [];
  
  console.log(` Resume Analysis: ${textLength} chars, ${lines.length} lines, ${jobEntries.length} jobs, ${bulletPoints.length} bullets`);
  
  // Heuristic calculation based on multiple factors
  let estimatedPages = 1;
  
  // Base calculation on character count (rough estimate: 2000 chars per page for detailed content)
  if (textLength > 2000) estimatedPages = Math.ceil(textLength / 2000);
  
  // Adjust based on line count (roughly 40-50 lines per page)
  const lineBasedPages = Math.ceil(lines.length / 45);
  
  // Consider job entries and bullet points (detailed content indicators)
  const contentComplexity = jobEntries.length + (bulletPoints.length / 10);
  const complexityBasedPages = Math.ceil(contentComplexity / 2);
  
  // Take the maximum of these estimates for conservative page count
  estimatedPages = Math.max(estimatedPages, lineBasedPages, complexityBasedPages);
  
  console.log(` Page estimates: chars=${Math.ceil(textLength / 2000)}, lines=${lineBasedPages}, complexity=${complexityBasedPages}`);
  
  // Cap at reasonable limits
  return Math.min(Math.max(estimatedPages, 1), 5);
}

/**
 * Parse resume sections from text
 * @param {string} resumeText - Raw resume text
 * @returns {Object} Parsed resume sections
 */
function parseResumeSections(resumeText) {
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
    other: []
  };

  // Extract personal information (name, contact details)
  // First try to match all caps names (like "NAVIN MISHRA"), then title case
  const nameMatch = resumeText.match(/^([A-Z][A-Z\s]+(?=\n))/m) || 
                    resumeText.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/m);
  const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  const linkedinMatch = resumeText.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/);
  const githubMatch = resumeText.match(/(github\.com\/[a-zA-Z0-9-]+)/);

  sections.personalInfo = {
    name: nameMatch ? nameMatch[1] : 'Unknown',
    email: emailMatch ? emailMatch[1] : null,
    phone: phoneMatch ? phoneMatch[1] : null,
    linkedin: linkedinMatch ? linkedinMatch[1] : null,
    github: githubMatch ? githubMatch[1] : null
  };

  // Extract summary/objective
  const summaryMatch = resumeText.match(/(?:summary|objective|profile)[\s\S]*?(?=\n\n|\n[A-Z]|$)/i);
  if (summaryMatch) {
    sections.summary = summaryMatch[0].replace(/^(summary|objective|profile)\s*:?\s*/i, '').trim();
  }

  // Extract experience with improved parsing - handle multiple formats
  const experienceMatch = resumeText.match(/(?:EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL CONTOUR)[\s\S]*?(?=\n(?:EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|PERSONAL DETAILS)|$)/i);
  if (experienceMatch) {
    const experienceText = experienceMatch[0];
    console.log(' Found experience section, analyzing patterns...');
    
    // Pattern 1: Title - Company followed by dates (Standard format)
    const jobPattern1 = /([A-Z][A-Za-z\s&]+?)\s*-\s*([A-Za-z\s&\.]+?)\n((?:19|20)\d{2}.*?(?:Present|(?:19|20)\d{2}))/g;
    
    // Pattern 2: Company, Location (Dates) followed by Title (Navin's format)
    // This pattern doesn't require years in dates to handle formats like "May 22  June 25"
    const jobPattern2 = /^([A-Za-z\s&\.,]+?),\s*([A-Za-z\s\/]+?)\s*\(([^)]+)\)\s*\n([A-Za-z\s&]+?)(?=\nKey|$)/gm;
    
    // Pattern 3: Company | Location | Dates followed by Title
    const jobPattern3 = /([A-Za-z\s&\.]+?)\s*\|\s*([A-Za-z\s,]+?)\s*\|\s*([^|]*(?:19|20)\d{2}[^|]*)\n([A-Za-z\s&]+?)(?=\n|$)/g;
    
    // Try Pattern 1 first
    let match;
    while ((match = jobPattern1.exec(experienceText)) !== null) {
      const [fullMatch, title, company, dates] = match;
      const startIndex = experienceText.indexOf(fullMatch);
      const nextJobIndex = experienceText.indexOf('\n\n', startIndex + fullMatch.length);
      const jobSection = experienceText.substring(startIndex, nextJobIndex > -1 ? nextJobIndex : experienceText.length);
      
      const bullets = jobSection.match(/^[\s]*[\-\*]\s+(.+)/gm) || [];
      
      sections.experience.push({
        title: title.trim(),
        company: company.trim(),
        duration: dates.trim(),
        location: '',
        description: bullets.map(bullet => bullet.replace(/^[\s]*[\-\*]\s+/, '').trim())
      });
    }
    
    // Try Pattern 2 if no matches (Navin's format)
    if (sections.experience.length === 0) {
      console.log(' Trying Pattern 2: Company, Location (Dates) + Title format...');
      
      // Use a simpler line-by-line approach for Navin's format
      const lines = experienceText.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i].trim();
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        
        // Look for company, location (dates) pattern
        const companyMatch = currentLine.match(/^([A-Za-z\s&\.,]+?),\s*([A-Za-z\s\/]+?)\s*\(([^)]+)\)/);
        if (companyMatch && nextLine && nextLine.length > 0 && !nextLine.startsWith('Key') && !nextLine.startsWith('') && !nextLine.includes('Deliverables')) {
          const [, company, location, dates] = companyMatch;
          const title = nextLine;
          
          // Find bullets for this job (look ahead until next company or end)
          const bullets = [];
          for (let j = i + 2; j < lines.length; j++) {
            const line = lines[j].trim();
            if (!line) continue;
            if (line.match(/^[A-Za-z\s&\.,]+?,\s*[A-Za-z\s\/]+?\s*\([^)]+\)/)) break; // Next job
            if (line.startsWith('') || line.startsWith('') || line.startsWith('-')) {
              bullets.push(line.replace(/^[\s]*[\-\*]\s*/, '').trim());
            }
          }
          
          console.log(` Found job: ${title} at ${company} (${dates})`);
          sections.experience.push({
            title: title.trim(),
            company: company.trim(),
            duration: dates.trim(),
            location: location.trim(),
            description: bullets
          });
        }
      }
    }
    
    // Try Pattern 3 if still no matches
    if (sections.experience.length === 0) {
      console.log(' Trying Pattern 3: Company | Location | Dates format...');
      while ((match = jobPattern3.exec(experienceText)) !== null) {
        const [fullMatch, company, location, dates, title] = match;
        const startIndex = experienceText.indexOf(fullMatch);
        const nextJobIndex = experienceText.indexOf('\n\n', startIndex + fullMatch.length);
        const jobSection = experienceText.substring(startIndex, nextJobIndex > -1 ? nextJobIndex : experienceText.length);
        
        const bullets = jobSection.match(/^[\s]*[\-\*]\s+(.+)/gm) || [];
        
        sections.experience.push({
          title: title.trim(),
          company: company.trim(),
          duration: dates.trim(),
          location: location.trim(),
          description: bullets.map(bullet => bullet.replace(/^[\s]*[\-\*]\s+/, '').trim())
        });
      }
    }
    
    console.log(` Extracted ${sections.experience.length} experience entries`);
  }

  // Extract education with improved parsing
  const educationMatch = resumeText.match(/(?:EDUCATION)[\s\S]*?(?=\n(?:SKILLS|EXPERIENCE|PROJECTS|CERTIFICATIONS)|$)/i);
  if (educationMatch) {
    const educationText = educationMatch[0];
    const lines = educationText.split('\n').filter(line => line.trim());
    
    let currentEdu = null;
    for (let line of lines.slice(1)) { // Skip "EDUCATION" header
      line = line.trim();
      if (!line) continue;
      
      if (line.match(/university|college|institute|school/i)) {
        if (currentEdu) sections.education.push(currentEdu);
        currentEdu = { institution: line, degree: '', year: '' };
      } else if (line.match(/bachelor|master|phd|diploma|degree/i) && currentEdu) {
        currentEdu.degree = line;
      } else if (line.match(/19\d{2}|20\d{2}/) && currentEdu) {
        currentEdu.year = line;
      }
    }
    if (currentEdu) sections.education.push(currentEdu);
  }

  // Extract skills
  const skillsMatch = resumeText.match(/(?:skills|technologies|competencies)[\s\S]*?(?=\n(?:experience|education|projects)|$)/i);
  if (skillsMatch) {
    const skillsText = skillsMatch[0].replace(/^(skills|technologies|competencies)\s*:?\s*/i, '');
    sections.skills = skillsText.split(/[,\n]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
  }

  // Extract certifications - improved to handle multiple formats
  const certificationsMatch = resumeText.match(/(?:CERTIFICATIONS?|CERTIFICATES?)[\s\S]*?(?=\n(?:EXPERIENCE|EDUCATION|SKILLS|DOMAIN|CAREER)|$)/i);
  if (certificationsMatch) {
    const certText = certificationsMatch[0].replace(/^(certifications?|certificates?)\s*:?\s*/i, '');
    // Split by bullet points and newlines, clean up
    const certLines = certText.split(/\n|/).map(cert => cert.replace(/^[\s\-\*]+/, '').trim()).filter(cert => cert.length > 2);
    sections.certifications = certLines;
    console.log(` Extracted ${certLines.length} certifications`);
  }

  return sections;
}

/**
 * Format resume for single/two-page layout (condensed)
 * @param {Object} sections - Parsed resume sections
 * @returns {Object} Condensed resume format
 */
function formatCondensedResume(sections) {
  return {
    formatType: 'condensed',
    pageCount: 1,
    layout: {
      name: sections.personalInfo.name,
      contact: {
        email: sections.personalInfo.email,
        phone: sections.personalInfo.phone,
        linkedin: sections.personalInfo.linkedin,
        github: sections.personalInfo.github
      },
      summary: sections.summary ? sections.summary.substring(0, 300) + '...' : null,
      experience: sections.experience.slice(0, 3).map(exp => ({
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        description: exp.description.slice(0, 3) // Limit to 3 bullet points
      })),
      skills: sections.skills.slice(0, 12), // Limit skills
      education: sections.education.slice(0, 2), // Limit education entries
      certifications: sections.certifications.slice(0, 3) // Limit certifications
    },
    optimization: {
      strategy: 'brevity_and_clarity',
      prioritized_sections: ['experience', 'skills', 'education'],
      content_limits: {
        experience_entries: 3,
        bullets_per_role: 3,
        skills_count: 12,
        summary_chars: 300
      }
    }
  };
}

/**
 * Format resume for multi-page layout (preserve all content)
 * @param {Object} sections - Parsed resume sections
 * @param {number} pageCount - Estimated page count
 * @returns {Object} Multi-page resume format
 */
function formatMultiPageResume(sections, pageCount) {
  return {
    formatType: 'multi_page',
    pageCount: pageCount,
    pages: [
      {
        pageNumber: 1,
        sections: {
          header: {
            name: sections.personalInfo.name,
            contact: sections.personalInfo
          },
          summary: sections.summary,
          experience: sections.experience.slice(0, 2) // First 2 roles on page 1
        }
      },
      {
        pageNumber: 2,
        sections: {
          header: { name: sections.personalInfo.name, pageNumber: 2 },
          experience: sections.experience.slice(2), // Remaining experience
          skills: sections.skills,
          education: sections.education
        }
      }
    ],
    fullStructure: {
      personalInfo: sections.personalInfo,
      summary: sections.summary,
      experience: sections.experience, // Preserve all experience with full details
      education: sections.education,
      skills: sections.skills,
      projects: sections.projects,
      certifications: sections.certifications,
      awards: sections.awards,
      publications: sections.publications,
      domains: sections.domains
    },
    optimization: {
      strategy: 'preserve_full_content',
      segmentation: 'logical_sections',
      content_preservation: {
        all_experience_roles: true,
        full_bullet_points: true,
        complete_skills_list: true,
        all_sections_included: true
      }
    }
  };
}

/**
 * Main resume parser and formatter function
 * @param {string} resumeText - Raw resume text input
 * @returns {Object} Formatted resume based on length
 */
export function parseAndFormatResume(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
    throw new Error('Invalid resume text input');
  }

  const pageCount = estimateResumePageCount(resumeText);
  const sections = parseResumeSections(resumeText);

  console.log(` Estimated resume pages: ${pageCount}`);
  console.log(` Parsing strategy: ${pageCount <= 2 ? 'CONDENSED' : 'MULTI-PAGE'}`);

  if (pageCount <= 2) {
    // Use condensed format for 1-2 page resumes
    const condensedResume = formatCondensedResume(sections);
    console.log(' Applied condensed formatting for brevity and clarity');
    return condensedResume;
  } else {
    // Use multi-page format for 3+ page resumes
    const multiPageResume = formatMultiPageResume(sections, pageCount);
    console.log(' Applied multi-page formatting to preserve full content');
    return multiPageResume;
  }
}

/**
 * Export resume as structured JSON
 * @param {Object} formattedResume - Formatted resume object
 * @returns {string} JSON string
 */
export function exportAsJSON(formattedResume) {
  return JSON.stringify(formattedResume, null, 2);
}

/**
 * Export resume as Markdown (suitable for multi-page rendering)
 * @param {Object} formattedResume - Formatted resume object
 * @returns {string} Markdown string
 */
export function exportAsMarkdown(formattedResume) {
  if (formattedResume.formatType === 'condensed') {
    const layout = formattedResume.layout;
    return `# ${layout.name}

**Contact:** ${layout.contact.email} | ${layout.contact.phone}
**LinkedIn:** ${layout.contact.linkedin} | **GitHub:** ${layout.contact.github}

## Summary
${layout.summary}

## Experience
${layout.experience.map(exp => 
  `### ${exp.title} - ${exp.company}
*${exp.duration}*
${exp.description.map(desc => `- ${desc}`).join('\n')}`
).join('\n\n')}

## Skills
${layout.skills.join(', ')}

## Education
${layout.education.map(edu => `**${edu.institution}** - ${edu.degree} (${edu.year})`).join('\n')}`;
  } else {
    // Multi-page markdown
    const structure = formattedResume.fullStructure;
    return `# ${structure.personalInfo.name}

${structure.summary ? `## Summary\n${structure.summary}\n` : ''}

## Professional Experience
${structure.experience.map(exp => 
  `### ${exp.title} - ${exp.company}
*${exp.duration}*
${exp.description.map(desc => `- ${desc}`).join('\n')}`
).join('\n\n')}

## Skills
${structure.skills.join(', ')}

## Education
${structure.education.map(edu => `**${edu.institution}** - ${edu.degree} (${edu.year})`).join('\n')}

${structure.certifications.length > 0 ? `## Certifications\n${structure.certifications.map(cert => `- ${cert}`).join('\n')}` : ''}`;
  }
}

// Example usage:
// const resumeText = "John Doe\nSoftware Engineer...";
// const formattedResume = parseAndFormatResume(resumeText);
// console.log(exportAsJSON(formattedResume));
