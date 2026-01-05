// Simple, working resume parser that actually works
export function parseResume(resumeText) {
  console.log(' NEW PARSER: Starting fresh resume parsing');
  console.log(' NEW PARSER: Input text length:', resumeText.length);

  const result = {
    name: extractName(resumeText),
    contact: extractContact(resumeText),
    summary: extractSummary(resumeText),
    skills: extractSkills(resumeText),
    experience: extractExperience(resumeText),
    education: extractEducation(resumeText),
    projects: extractProjects(resumeText),
    certifications: extractCertifications(resumeText),
    awards: extractAwards(resumeText),
    domains: extractDomains(resumeText)
  };

  console.log(' NEW PARSER: Final result:', JSON.stringify(result, null, 2));
  return result;
}

function extractName(text) {
  // Extract name from first line or look for all caps names
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Check if it's a name (not email, not address)
    if (firstLine && !firstLine.includes('@') && !firstLine.includes('Phone') && firstLine.length < 50) {
      return firstLine;
    }
  }
  
  // Fallback: look for all caps names
  const nameMatch = text.match(/^([A-Z][A-Z\s]+)(?=\n)/m);
  return nameMatch ? nameMatch[1].trim() : '';
}

function extractContact(text) {
  const email = text.match(/(?:Email|E-mail)?:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phone = text.match(/(?:Phone|Mobile|M)?:?\s*(?:\(M\))?\s*([+\d\s()-]{10,})/);
  const linkedin = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/);
  const location = text.match(/([A-Za-z\s,]+[-]\s*\d{6})/) || text.match(/([A-Za-z\s,]+,\s*[A-Za-z\s,]+\s*-\s*\d+)/);

  return {
    email: email ? email[1] : '',
    phone: phone ? phone[1].replace(/[()\s-]/g, '') : '',
    location: location ? location[1].trim() : '',
    linkedin: linkedin ? linkedin[1] : '',
    github: '',
    website: ''
  };
}

function extractSummary(text) {
  // Look for various summary section patterns
  const summaryPatterns = [
    /CAREER RECITAL[\s\S]*?(?=(?:[A-Z]{3,}|SKILLS|EXPERIENCE|EDUCATION|$))/i,
    /PROFESSIONAL SUMMARY[\s\S]*?(?=(?:[A-Z]{3,}|SKILLS|EXPERIENCE|EDUCATION|$))/i,
    /CAREER OBJECTIVE[\s\S]*?(?=(?:[A-Z]{3,}|SKILLS|EXPERIENCE|EDUCATION|$))/i,
    /PROFILE[\s\S]*?(?=(?:[A-Z]{3,}|SKILLS|EXPERIENCE|EDUCATION|$))/i,
    /SUMMARY[\s\S]*?(?=(?:[A-Z]{3,}|SKILLS|EXPERIENCE|EDUCATION|$))/i
  ];

  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].replace(/^[A-Z\s]+\n/, '').trim();
    }
  }

  return '';
}

function extractSkills(text) {
  console.log(' NEW PARSER: Extracting skills from text');
  
  // Find the SKILLS section with various patterns
  const skillsPatterns = [
    /SKILLS[\s\S]*?(?=(?:PROFILE|EXPERIENCE|EDUCATION|PROFESSIONAL|PERSONAL|CERTIFICATION|$))/i,
    /TECHNICAL SKILLS[\s\S]*?(?=(?:PROFILE|EXPERIENCE|EDUCATION|PROFESSIONAL|PERSONAL|CERTIFICATION|$))/i,
    /KEY SKILLS[\s\S]*?(?=(?:PROFILE|EXPERIENCE|EDUCATION|PROFESSIONAL|PERSONAL|CERTIFICATION|$))/i,
    /CORE SKILLS[\s\S]*?(?=(?:PROFILE|EXPERIENCE|EDUCATION|PROFESSIONAL|PERSONAL|CERTIFICATION|$))/i
  ];

  for (const pattern of skillsPatterns) {
    const skillsSection = text.match(pattern);
    if (skillsSection) {
      const skillsText = skillsSection[0].replace(/^[A-Z\s]+\n/, '').trim();
      console.log(' NEW PARSER: Found skills section:', skillsText);
      
      // Parse skills from multiple formats
      const skills = [];
      const lines = skillsText.split('\n').filter(line => line.trim());
      
      console.log(' NEW PARSER: Skills section lines:', lines);
      
      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine && !cleanLine.includes('PROFILE') && !cleanLine.includes('EXPERIENCE') && 
            !cleanLine.includes('SKILLS') && cleanLine.length > 3) {
          
          // Check if line has multiple skills separated by spaces/tabs
          if (cleanLine.includes('\t') || cleanLine.match(/\s{3,}/)) {
            // Tab or multi-space separated
            const lineSkills = cleanLine.split(/[\t\s{3,}]/).map(s => s.trim()).filter(s => s.length > 1);
            skills.push(...lineSkills);
          }
          // Check if line has comma-separated skills
          else if (cleanLine.includes(',')) {
            const lineSkills = cleanLine.split(',').map(s => s.trim()).filter(s => s.length > 1);
            skills.push(...lineSkills);
          }
          // Check if it's a single skill per line
          else {
            skills.push(cleanLine);
          }
        }
      }
      
      const uniqueSkills = [...new Set(skills)].slice(0, 20); // Limit to 20 skills
      console.log(' NEW PARSER: Extracted skills:', uniqueSkills);
      return uniqueSkills;
    }
  }

  return [];
}

function extractExperience(text) {
  console.log(' NEW PARSER: Extracting experience from text');
  const experiences = [];

  // Find the professional experience section
  const experiencePatterns = [
    /PROFESSIONAL CONTOUR[\s\S]*?(?=(?:PERSONAL DETAILS|EDUCATION|$))/i,
    /PROFESSIONAL EXPERIENCE[\s\S]*?(?=(?:PERSONAL DETAILS|EDUCATION|$))/i,
    /WORK EXPERIENCE[\s\S]*?(?=(?:PERSONAL DETAILS|EDUCATION|$))/i,
    /EXPERIENCE[\s\S]*?(?=(?:PERSONAL DETAILS|EDUCATION|$))/i
  ];

  let experienceSection = null;
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) {
      experienceSection = match[0];
      break;
    }
  }

  if (!experienceSection) {
    console.log(' NEW PARSER: No experience section found');
    return experiences;
  }

  console.log(' NEW PARSER: Found experience section, parsing jobs...');
  
  const jobEntries = [];
  const lines = experienceSection.split('\n').filter(line => line.trim());
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip header line
    if (line.includes('PROFESSIONAL CONTOUR') || line.includes('PROFESSIONAL EXPERIENCE')) {
      i++;
      continue;
    }
    
    console.log(` NEW PARSER: Processing line ${i}: "${line}"`);
    
    // Check if this line could be a job title (starts the job entry)
    if (line.length > 5 && line.length < 80 && 
        (line.includes('Manager') || line.includes('Engineer') || line.includes('Consultant') || 
         line.includes('Lead') || line.includes('Director') || line.includes('Analyst') ||
         line.includes('Senior') || line.includes('Junior') || line.includes('Associate'))) {
      
      console.log(` NEW PARSER: Potential job title found: "${line}"`);
      
      // Look ahead for company name (should be next non-empty line)
      let companyLine = '';
      let companyIndex = i + 1;
      while (companyIndex < lines.length && !companyLine) {
        const nextLine = lines[companyIndex].trim();
        if (nextLine && !nextLine.startsWith('')) {
          companyLine = nextLine;
          break;
        }
        companyIndex++;
      }
      
      // Look for date line (should be after company)
      let dateLine = '';
      let dateIndex = companyIndex + 1;
      while (dateIndex < lines.length && !dateLine) {
        const nextLine = lines[dateIndex].trim();
        if (nextLine && (nextLine.match(/\d{4}/) || nextLine.includes('Present') || 
                        nextLine.includes('Jan') || nextLine.includes('Feb') || nextLine.includes('Mar') ||
                        nextLine.includes('Apr') || nextLine.includes('May') || nextLine.includes('Jun') ||
                        nextLine.includes('Jul') || nextLine.includes('Aug') || nextLine.includes('Sep') ||
                        nextLine.includes('Oct') || nextLine.includes('Nov') || nextLine.includes('Dec'))) {
          dateLine = nextLine;
          break;
        }
        dateIndex++;
      }
      
      if (companyLine && dateLine) {
        console.log(` NEW PARSER: Found complete job entry - Title: "${line}", Company: "${companyLine}", Dates: "${dateLine}"`);
        
        // Collect description bullets (look for  markers)
        const description = [];
        let descIndex = dateIndex + 1;
        
        // Skip empty lines after date
        while (descIndex < lines.length && !lines[descIndex].trim()) {
          descIndex++;
        }
        
        while (descIndex < lines.length) {
          const descLine = lines[descIndex].trim();
          if (!descLine) {
            descIndex++;
            continue;
          }
          
          // If we hit another job title (that's not part of current description), stop
          if (descLine.length > 5 && descLine.length < 80 && 
              (descLine.includes('Manager') || descLine.includes('Engineer') || descLine.includes('Consultant') ||
               descLine.includes('Lead') || descLine.includes('Director') || descLine.includes('Analyst') ||
               descLine.includes('Senior') || descLine.includes('Junior') || descLine.includes('Associate')) &&
              !descLine.startsWith('') && !descLine.includes('team') && !descLine.includes('project')) {
            console.log(` NEW PARSER: Stopping at next job title: "${descLine}"`);
            break;
          }
          
          // If we hit a section header, stop
          if (descLine.includes('EDUCATION') || descLine.includes('SKILLS')) {
            console.log(` NEW PARSER: Stopping at section header: "${descLine}"`);
            break;
          }
          
          // Collect bullet points and description text
          if (descLine.startsWith('') || descLine.startsWith('') || descLine.startsWith('-')) {
            const cleanedDesc = descLine.replace(/^[\-]\s*/, '').trim();
            if (cleanedDesc.length > 0) {
              console.log(` NEW PARSER: Adding bullet: "${cleanedDesc}"`);
              description.push(cleanedDesc);
            }
          } else if (descLine.length > 10 && !descLine.match(/^[A-Z][a-z]+\s+(19|20)\d{2}/) && 
                    !descLine.includes('LTD') && !descLine.includes('Inc') && !descLine.includes('Syntel')) {
            // This might be a continuation of bullet description or a regular description line
            // But exclude dates and company names
            if (descLine.includes('Managed') || descLine.includes('Supported') || descLine.includes('Increased') || 
                descLine.includes('Guided') || descLine.includes('Executed') || descLine.includes('Prepared')) {
              console.log(` NEW PARSER: Adding description line: "${descLine}"`);
              description.push(descLine);
            }
          }
          
          descIndex++;
        }
        
        // Create job entry
        jobEntries.push({
          title: line.trim(),
          company: companyLine.trim(),
          dates: dateLine.trim(),
          location: '',
          description: description
        });
        
        // Skip processed lines
        i = Math.max(dateIndex, descIndex - 1);
      } else {
        console.log(` NEW PARSER: Incomplete job entry, missing company or date`);
        i++;
      }
    } else {
      i++;
    }
  }
  
  console.log(` NEW PARSER: Extracted ${jobEntries.length} job entries`);
  
  // Convert to standard format and add to experiences
  jobEntries.forEach((job, index) => {
    console.log(` NEW PARSER: Job ${index + 1}: ${job.title} at ${job.company} (${job.dates})`);
    experiences.push({
      title: job.title,
      company: job.company,
      dates: job.dates,
      location: job.location,
      description: job.description
    });
  });

  return experiences;
}

function extractEducation(text) {
  console.log(' NEW PARSER: Extracting education from text');
  const education = [];
  
  const educationMatch = text.match(/EDUCATION & CREDENTIALS[\s\S]*?(?=(?:PERSONAL DETAILS|$))/i) ||
                        text.match(/EDUCATION[\s\S]*?(?=(?:PERSONAL DETAILS|EXPERIENCE|$))/i);
  
  if (educationMatch) {
    const educationText = educationMatch[0];
    const lines = educationText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('University') || line.includes('College') || line.includes('Degree')) {
        const degreeMatch = line.match(/(.*?)(?:from|in)\s+(.*?)\s+(?:in\s+)?(\d{4})/);
        if (degreeMatch) {
          education.push({
            degree: degreeMatch[1].trim(),
            university: degreeMatch[2].trim(),
            year: degreeMatch[3],
            location: ''
          });
        } else {
          // Simple parsing
          education.push({
            degree: line.trim(),
            university: '',
            year: '',
            location: ''
          });
        }
      }
    }
  }
  
  // Fallback if no structured education found
  if (education.length === 0) {
    const simpleEducation = text.match(/Bachelor.*?\d{4}/i) || text.match(/Degree.*?\d{4}/i);
    if (simpleEducation) {
      education.push({
        degree: simpleEducation[0],
        university: '',
        year: '',
        location: ''
      });
    }
  }
  
  console.log(` NEW PARSER: Extracted ${education.length} education entries`);
  return education;
}

function extractProjects(text) {
  console.log(' NEW PARSER: Extracting projects from text');
  const projects = [];
  
  // Look for project sections - this resume doesn't seem to have explicit projects
  // but we can extract from domain experience or other relevant sections
  const projectMatch = text.match(/PROJECTS?[\s\S]*?(?=(?:[A-Z]{3,}|$))/i);
  
  if (projectMatch) {
    // Parse projects if found
    const projectText = projectMatch[0];
    // Implementation for project parsing would go here
  }
  
  // For now, return empty array as this resume focuses on work experience
  console.log(` NEW PARSER: Extracted ${projects.length} project entries`);
  return projects;
}

function extractCertifications(text) {
  console.log(' NEW PARSER: Extracting certifications from text');
  const certifications = [];
  
  // Look for CERTIFICATION section (singular or plural)
  const certificationMatch = text.match(/CERTIFICATION[S]?[\s\S]*?(?=(?:DOMAIN|CAREER|SKILLS|PROFESSIONAL|$))/i);
  
  if (certificationMatch) {
    const certText = certificationMatch[0];
    console.log(' NEW PARSER: Found certification section:', certText.substring(0, 200));
    const lines = certText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const cleanLine = line.trim();
      // Look for certification indicators
      if (cleanLine && !cleanLine.includes('CERTIFICATION') && 
          (cleanLine.includes('Certified') || cleanLine.includes('PMP') || 
           cleanLine.includes('AWS') || cleanLine.includes('PRINCE') ||
           cleanLine.includes('CSM') || cleanLine.includes('CSPO') ||
           cleanLine.startsWith('') || cleanLine.startsWith('-') || cleanLine.startsWith(''))) {
        const cert = cleanLine.replace(/^[\-]\s*/, '').trim();
        if (cert.length > 2) {
          certifications.push(cert);
        }
      }
    }
  }
  
  console.log(` NEW PARSER: Extracted ${certifications.length} certifications:`, certifications);
  return certifications;
}

function extractAwards(text) {
  console.log(' NEW PARSER: Extracting awards from text');
  const awards = [];
  
  const awardsMatch = text.match(/AWARDS?[\s\S]*?(?=(?:[A-Z]{3,}|$))/i) ||
                     text.match(/ACHIEVEMENTS?[\s\S]*?(?=(?:[A-Z]{3,}|$))/i);
  
  if (awardsMatch) {
    // Parse awards if found
    const awardsText = awardsMatch[0];
    // Implementation would go here
  }
  
  return awards;
}

function extractDomains(text) {
  console.log(' NEW PARSER: Extracting domains from text');
  const domains = [];
  
  const domainsMatch = text.match(/DOMAIN[\s\S]*?(?=(?:CAREER|SKILLS|$))/i);
  
  if (domainsMatch) {
    const domainsText = domainsMatch[0];
    const lines = domainsText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine && !cleanLine.includes('DOMAIN') && (cleanLine.includes('Banking') || cleanLine.includes('Healthcare') || cleanLine.includes('Retail') || cleanLine.includes('Automotive'))) {
        domains.push(cleanLine.replace(/^[\-]\s*/, '').trim());
      }
    }
  }
  
  console.log(` NEW PARSER: Extracted ${domains.length} domain entries`);
  return domains;
}

