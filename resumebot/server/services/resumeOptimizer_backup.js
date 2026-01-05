import { GoogleGenerativeAI } from '@google/generative-ai';
import { cleanExtractedText, validateResumeText } from './fileProcessor.js';
import crypto from 'crypto';

// Initialize Gemini AI
let genAI;
let model;

// Simple logger to reduce console spam
const log = {
  info: (message) => console.log(` ${message}`),
  error: (message) => console.error(` ${message}`),
  success: (message) => console.log(` ${message}`),
  debug: (message) => console.log(` ${message}`)
};

// Simplified JSON parser for Gemini responses
function parseGeminiResponse(rawResponse) {
  let cleanedResponse = rawResponse.trim();
  
  // Remove markdown code blocks
  if (cleanedResponse.includes('```json')) {
    const match = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) cleanedResponse = match[1].trim();
  } else if (cleanedResponse.includes('```')) {
    const match = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
    if (match) cleanedResponse = match[1].trim();
  }
  
  // Extract JSON object
  const jsonStart = cleanedResponse.indexOf('{');
  const jsonEnd = cleanedResponse.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
  }
  
  // Fix common JSON issues
  cleanedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
  
  try {
    return JSON.parse(cleanedResponse);
  } catch (error) {
    throw new Error(`Failed to parse Gemini response: ${error.message}`);
  }
}

// Simple function to create concise version of resume data
function createConciseVersion(data) {
  const concise = { ...data };
  
  // Trim summary to 2 sentences max
  if (concise.summary) {
    const sentences = concise.summary.split(/[.!?]+/);
    if (sentences.length > 2) {
      concise.summary = sentences.slice(0, 2).join('. ').trim() + '.';
    }
  }
  
  // Limit arrays to reasonable sizes for concise format
  if (Array.isArray(concise.skills)) concise.skills = concise.skills.slice(0, 10);
  if (Array.isArray(concise.experience)) concise.experience = concise.experience.slice(0, 3);
  if (Array.isArray(concise.projects)) concise.projects = concise.projects.slice(0, 2);
  if (Array.isArray(concise.certifications)) concise.certifications = concise.certifications.slice(0, 5);
  
  return concise;
}

// Extract basic resume data from text
function extractBasicResumeData(resumeText) {
  const data = {
    name: "Professional Resume",
    contact: { email: "", phone: "", location: "" },
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  };

  // Extract name (first line usually)
  const lines = resumeText.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine && firstLine.length < 50 && !firstLine.includes('@')) {
      data.name = firstLine;
    }
  }

  // Extract email
  const emailMatch = resumeText.match(/[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/);
  if (emailMatch) data.contact.email = emailMatch[0];

  // Extract phone
  const phoneMatch = resumeText.match(/(?:\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
  if (phoneMatch) data.contact.phone = phoneMatch[0];

  // Extract skills from SKILLS section
  const skillsMatch = resumeText.match(/SKILLS[:\s]*([\s\S]*?)(?=\n\n|EXPERIENCE|EDUCATION|$)/i);
  if (skillsMatch) {
    data.skills = skillsMatch[1]
      .split(/[,\n]+/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 1 && skill.length < 30)
      .slice(0, 15);
  }

  // Basic summary - first paragraph or professional summary section
  const summaryMatch = resumeText.match(/(?:SUMMARY|PROFILE)[:\s]*([\s\S]*?)(?=\n\n|EXPERIENCE|SKILLS|$)/i);
  if (summaryMatch) {
    data.summary = summaryMatch[1].trim().split('\n')[0]; // First line only
  } else {
    // Fallback: create basic summary
    data.summary = `${data.skills.slice(0, 3).join(', ')} professional with proven experience.`;
  }

  return data;
}

// Initialize Gemini AI
export function initializeGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    log.error('Missing GEMINI_API_KEY environment variable');
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    log.success('Gemini AI initialized successfully');
    return true;
  } catch (error) {
    log.error('Failed to initialize Gemini AI: ' + error.message);
    throw error;
  }
}

// Simple Gemini API call with timeout
async function callGeminiAPI(prompt, timeoutMs = 30000) {
  if (!model) {
    await initializeGeminiAI();
  }

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini API timeout')), timeoutMs)
  );

  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

    const response = await result.response;
    const rawText = response.text();
    return parseGeminiResponse(rawText);
  } catch (error) {
    log.error('Gemini API call failed: ' + error.message);
    throw error;
  }
}

// Main resume optimization function - simplified and working
export async function optimizeResume(resumeText, targetRole, options = {}) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const { progressCallback } = options;
  
  // Progress helper
  const sendProgress = (step, message, data = null) => {
    if (progressCallback && typeof progressCallback === 'function') {
      progressCallback(step, message, data);
    }
  };

  try {
    log.info(`[${requestId}] Starting resume optimization for role: ${targetRole}`);
    sendProgress('analyzing', 'Analyzing resume content...');

    // Clean and extract basic data from resume
    const cleanedText = cleanExtractedText(resumeText);
    const basicData = extractBasicResumeData(cleanedText);
    
    sendProgress('optimizing', 'Optimizing resume with AI...');
    log.debug(`[${requestId}] Extracted data - Name: ${basicData.name}, Skills: ${basicData.skills.length}`);

    // Try Gemini optimization first
    let optimizedData = null;
    try {
      const prompt = createOptimizationPrompt(cleanedText, targetRole);
      optimizedData = await callGeminiAPI(prompt);
      log.success(`[${requestId}] AI optimization successful`);
    } catch (error) {
      log.error(`[${requestId}] AI optimization failed: ${error.message}`);
      // Fall back to basic data
    }

    sendProgress('generating', 'Generating resume templates...');

    // Create templates
    const templates = [];
    
    if (optimizedData && optimizedData.templates) {
      // Use AI-optimized templates
      templates.push(...optimizedData.templates);
      log.success(`[${requestId}] Using ${templates.length} AI-optimized templates`);
    } else {
      // Fallback to basic templates
      log.info(`[${requestId}] Using fallback templates`);
      
      templates.push({
        id: `${basicData.name} - Senior Modern`,
        name: `${basicData.name} - Senior Modern`,
        description: "Executive-level template with modern design",
        content: basicData,
        style: "senior-modern",
        isOptimized: false
      });
      
      templates.push({
        id: `${basicData.name} - Concise Classic`,
        name: `${basicData.name} - Concise Classic`, 
        description: "Clean, ATS-friendly format",
        content: createConciseVersion(basicData),
        style: "concise-classic",
        isOptimized: false
      });
    }

    sendProgress('completed', 'Resume optimization completed!', {
      templates: templates.length,
      targetRole
    });

    // Return results
    const result = {
      originalText: cleanedText,
      templates,
      improvements: optimizedData?.improvements || [
        ` Resume structured for ${targetRole}`,
        " Professional formatting applied",
        " Key sections organized"
      ],
      stats: optimizedData?.stats || {
        atsScore: 75,
        keywordsAdded: 5,
        improvementsMade: 3,
        matchScore: 70
      },
      keyChanges: optimizedData?.keyChanges || `Resume optimized for ${targetRole} role`,
      targetRole
    };

    log.success(`[${requestId}] Resume optimization completed with ${result.templates.length} templates`);
    return result;

  } catch (error) {
    log.error(`[${requestId}] Resume optimization failed: ${error.message}`);
    sendProgress('error', error.message);
    throw error;
  }
}

// Create optimization prompt for Gemini
function createOptimizationPrompt(resumeText, targetRole) {
  return `You are a professional resume optimizer. Optimize this resume for a ${targetRole} position.

Original Resume:
${resumeText}

Return a JSON response with this exact structure:
{
  "templates": [
    {
      "id": "name - Senior Modern",
      "name": "name - Senior Modern", 
      "description": "Executive template with comprehensive sections",
      "content": {
        "name": "Full Name",
        "contact": {"email": "", "phone": "", "location": ""},
        "summary": "Professional summary",
        "skills": ["skill1", "skill2"],
        "experience": [{"title": "", "company": "", "dates": "", "description": [""]}],
        "education": [{"degree": "", "university": "", "year": ""}],
        "projects": [],
        "certifications": []
      },
      "style": "senior-modern",
      "isOptimized": true
    },
    {
      "id": "name - Concise Classic",
      "name": "name - Concise Classic",
      "description": "Clean, ATS-friendly format", 
      "content": {
        "name": "Full Name",
        "contact": {"email": "", "phone": "", "location": ""},
        "summary": "Concise summary",
        "skills": ["skill1", "skill2"],
        "experience": [{"title": "", "company": "", "dates": "", "description": [""]}],
        "education": [{"degree": "", "university": "", "year": ""}],
        "projects": [],
        "certifications": []
      },
      "style": "concise-classic",
      "isOptimized": true
    }
  ],
  "improvements": ["improvement1", "improvement2"],
  "stats": {"atsScore": 85, "keywordsAdded": 5, "improvementsMade": 3, "matchScore": 80},
  "keyChanges": "Summary of key changes made"
}

Important: Return ONLY valid JSON, no markdown or extra text.`;
}

// Enhanced Gemini call with timeout, validation and retry
async function callGeminiWithValidation(prompt, targetRole, maxAttempts = 3, parentRequestId, timeoutMs = 35000) {
  const requestId = parentRequestId || crypto.randomUUID().slice(0, 8);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        console.log(` [${requestId}] Retrying (attempt ${attempt}/${maxAttempts})...`);
      }

      // Call Gemini with timeout
      console.log(` [${requestId}] Calling Gemini with ${timeoutMs/1000}s timeout`);
      console.log(` [${requestId}] Starting Promise.race between Gemini call and timeout...`);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.log(` [${requestId}] TIMEOUT TRIGGERED after ${timeoutMs/1000}s`);
          reject(new Error(`Gemini API timeout after ${timeoutMs/1000}s`));
        }, timeoutMs)
      );

      console.log(` [${requestId}] Calling model.generateContent()...`);
      const geminiPromise = model.generateContent(prompt);

      const result = await Promise.race([geminiPromise, timeoutPromise]);

      console.log(` [${requestId}] Gemini API responded (no timeout)`);
      console.log(` [${requestId}] Getting response object...`);

      const response = await result.response;
      const rawText = response.text();

      console.log(` [${requestId}] Raw response length: ${rawText.length}`);
      console.log(` [${requestId}] Raw response preview (first 300 chars):`);
      console.log(`"${rawText.substring(0, 300)}${rawText.length > 300 ? '...' : ''}"`);
      console.log(` [${requestId}] Raw response ends with: "${rawText.slice(-50)}"`);

      // Check if response contains code blocks
      if (rawText.includes('```json') || rawText.includes('```')) {
        console.log(` [${requestId}]  Response contains code blocks - will need extraction`);
      }

      // Parse JSON
      let parsed;
      try {
        parsed = safeParseJSONFromText(rawText, requestId);
        console.log(` [${requestId}] Gemini JSON parsed & validated`);
      } catch (parseError) {
        console.log(` [${requestId}] Gemini returned invalid JSON`);

        if (attempt === maxAttempts) {
          throw new Error(`JSON parsing failed after ${maxAttempts} attempts: ${parseError.message}`);
        }

        // Try again with repair prompt
        console.log(` [${requestId}] Retrying with repair prompt (attempt ${attempt + 1}/${maxAttempts})...`);
        const repairPrompt = `${prompt}\n\nIMPORTANT: Your previous response was invalid JSON. Return ONLY valid JSON with no markdown code blocks or extra text.`;
        continue;
      }

      // Validate structure
      const validation = validateParsed(parsed);
      console.log(` [${requestId}] Validation result:`, validation.isValid ? ' VALID' : ` INVALID: ${validation.errors.join(', ')}`);

      if (validation.isValid) {
        console.log(` [${requestId}] Success on attempt ${attempt}`);
        return parsed;
      }

      // Log detailed validation failures
      console.log(` [${requestId}] VALIDATION FAILED on attempt ${attempt}/${maxAttempts}:`);
      validation.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });

      // Log what we actually received to help debug
      console.log(` [${requestId}] Parsed object structure:`);
      console.log(`    Root keys: ${Object.keys(parsed)}`);
      if (parsed.templates) {
        console.log(`    Templates: ${Array.isArray(parsed.templates) ? parsed.templates.length : 'NOT_ARRAY'}`);
        if (Array.isArray(parsed.templates) && parsed.templates.length > 0) {
          parsed.templates.forEach((template, i) => {
            console.log(`    Template ${i}: ${template.name || 'NO_NAME'} (${template.style || 'NO_STYLE'})`);
            if (template.content) {
              console.log(`      Content keys: ${Object.keys(template.content)}`);
            }
          });
        }
      }

      if (attempt === maxAttempts) {
        console.log(` [${requestId}] All validation attempts failed`);
        throw new Error(`Validation failed after ${maxAttempts} attempts: ${validation.errors.join('; ')}`);
      }

      // Try again with repair prompt or simplified prompt
      if (attempt === 2 && maxAttempts === 3) {
        // On second failure, try simplified prompt
        console.log(` [${requestId}] Second validation failure - trying simplified prompt...`);
        const rolePrompts = getRoleSpecificPrompts(targetRole);
        const simplifiedPrompt = `Return ONLY valid JSON for this resume optimization:

TARGET ROLE: ${targetRole.replace('-', ' ').toUpperCase()}

Generate exactly 2 resume templates with this JSON structure:
{
  "templates": [
    {
      "id": "name - Senior Modern",
      "name": "name - Senior Modern",
      "style": "senior-modern",
      "content": {
        "name": "Full Name",
        "contact": {"email": "", "phone": "", "location": ""},
        "summary": "Professional summary text",
        "skills": ["skill1", "skill2"],
        "experience": [{"title": "", "company": "", "dates": "", "description": [""]}],
        "education": [{"degree": "", "university": "", "year": ""}],
        "projects": [],
        "certifications": []
      }
    },
    {
      "id": "name - Concise Classic",
      "name": "name - Concise Classic",
      "style": "concise-classic",
      "content": { /* same structure as above */ }
    }
  ],
  "improvements": ["improvement1", "improvement2"],
  "stats": {"atsScore": 85, "keywordsAdded": 5, "improvementsMade": 3, "matchScore": 80},
  "keyChanges": "Summary of changes made"
}

Use the extracted resume data and optimize for: ${rolePrompts.keywords}`;
        prompt = simplifiedPrompt;
      } else {
        // Normal repair prompt
        console.log(` [${requestId}] Creating repair prompt for validation issues...`);
        const repairPrompt = `${prompt}\n\nIMPORTANT: Fix these issues from your previous response: ${validation.errors.join('; ')}. Return valid JSON only.`;
        prompt = repairPrompt;
      }

    } catch (error) {
      const isTimeout = error.message.includes('timeout');
      const isService503 = error.message.includes('503') || error.message.includes('Service Unavailable');

      if (isTimeout) {
        console.log(` [${requestId}] Gemini API timeout (${timeoutMs/1000}s)`);
      } else if (isService503) {
        console.log(` [${requestId}] Gemini API 503 - Service Unavailable`);
      } else {
        console.log(` [${requestId}] Attempt ${attempt} failed: ${error.message}`);
      }

      if (attempt === maxAttempts) {
        console.log(` [${requestId}] All Gemini attempts failed`);
        console.log(` [${requestId}] Final error type: timeout=${isTimeout}, service=${isService503}`);
        // Mark as timeout or service error for fallback handling
        error.isTimeout = isTimeout;
        error.isServiceError = isService503;
        throw error;
      }

      // Wait before retry - longer for service errors
      const waitTime = isService503 ? 3000 * attempt : 1000 * attempt;
      console.log(` [${requestId}] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export function initializeGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY. Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    console.log(' Gemini AI initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error.message);
    throw error;
  }
}

/**
 * Get role-specific optimization prompts
 * @param {string} role - Target role
 * @returns {Object} Role-specific prompts and requirements
 */
function getRoleSpecificPrompts(role) {
  const rolePrompts = {
    'software-engineer': {
      focus: 'technical skills, programming languages, software development lifecycle, system architecture, code quality, and problem-solving abilities',
      keywords: 'JavaScript, Python, React, Node.js, AWS, Docker, API development, microservices, agile, SDLC, debugging, version control, database design',
      sections: 'Technical Skills, Projects, Professional Experience, Education, Certifications',
      tone: 'technical and achievement-focused, emphasizing quantifiable results and technical expertise'
    },
    'data-scientist': {
      focus: 'data analysis, machine learning, statistical modeling, data visualization, research methodologies, and business impact through data insights',
      keywords: 'Python, R, SQL, machine learning, deep learning, statistics, data visualization, pandas, scikit-learn, TensorFlow, PyTorch, Jupyter, statistical analysis, A/B testing',
      sections: 'Technical Skills, Data Science Projects, Professional Experience, Research, Education, Publications',
      tone: 'analytical and research-oriented, highlighting data-driven decision making and quantifiable business impact'
    },
    'product-manager': {
      focus: 'product strategy, roadmap planning, stakeholder management, user experience, market research, cross-functional collaboration, and business metrics',
      keywords: 'product strategy, roadmap, user experience, market research, stakeholder management, agile, scrum, KPIs, A/B testing, user research, go-to-market, competitive analysis',
      sections: 'Product Management Experience, Key Achievements, Skills, Education, Certifications',
      tone: 'strategic and results-driven, emphasizing leadership, collaboration, and business impact'
    },
    'marketing-manager': {
      focus: 'brand management, digital marketing, campaign development, market analysis, customer acquisition, and marketing ROI',
      keywords: 'digital marketing, brand management, SEO, SEM, social media, content marketing, email marketing, analytics, customer acquisition, conversion optimization, marketing automation',
      sections: 'Marketing Experience, Campaign Results, Digital Skills, Education, Certifications',
      tone: 'creative and metrics-focused, highlighting brand building and measurable marketing results'
    },
    'sales-representative': {
      focus: 'sales performance, client relationship management, revenue generation, negotiation skills, and customer satisfaction',
      keywords: 'sales performance, quota achievement, CRM, lead generation, client relationships, negotiation, closing deals, revenue growth, customer retention, territory management',
      sections: 'Sales Experience, Key Achievements, Skills, Education, Awards',
      tone: 'results-driven and relationship-focused, emphasizing sales metrics and customer success'
    },
    'business-analyst': {
      focus: 'business process analysis, requirements gathering, stakeholder communication, data analysis, and process improvement',
      keywords: 'business analysis, requirements gathering, process improvement, stakeholder management, data analysis, documentation, workflow optimization, business intelligence, SQL',
      sections: 'Business Analysis Experience, Technical Skills, Projects, Education, Certifications',
      tone: 'analytical and process-oriented, highlighting problem-solving and business optimization'
    },
    'ui-ux-designer': {
      focus: 'user experience design, user interface design, user research, prototyping, design systems, and usability testing',
      keywords: 'UI/UX design, user research, prototyping, wireframing, Figma, Sketch, Adobe Creative Suite, usability testing, design systems, responsive design, accessibility',
      sections: 'Design Experience, Portfolio Highlights, Design Skills, Education, Awards',
      tone: 'creative and user-focused, emphasizing design thinking and user-centered solutions'
    },
    'project-manager': {
      focus: 'project planning, team leadership, resource management, risk mitigation, and successful project delivery',
      keywords: 'project management, team leadership, project planning, risk management, budget management, agile, scrum, PMP, stakeholder communication, resource allocation',
      sections: 'Project Management Experience, Key Projects, Leadership Skills, Education, Certifications',
      tone: 'leadership-focused and results-oriented, emphasizing successful project outcomes and team management'
    },
    'financial-analyst': {
      focus: 'financial modeling, data analysis, forecasting, budgeting, investment analysis, and financial reporting',
      keywords: 'financial modeling, financial analysis, budgeting, forecasting, Excel, SQL, financial reporting, investment analysis, valuation, risk assessment, accounting principles',
      sections: 'Financial Experience, Technical Skills, Key Achievements, Education, Certifications',
      tone: 'analytical and detail-oriented, highlighting financial expertise and quantitative skills'
    },
    'hr-manager': {
      focus: 'talent management, employee relations, recruitment, performance management, and organizational development',
      keywords: 'talent management, recruitment, employee relations, performance management, HR policies, organizational development, training, compliance, HRIS, compensation',
      sections: 'HR Experience, People Management, Skills, Education, HR Certifications',
      tone: 'people-focused and strategic, emphasizing employee development and organizational impact'
    },
    'devops-engineer': {
      focus: 'infrastructure automation, CI/CD pipelines, cloud platforms, monitoring, and system reliability',
      keywords: 'DevOps, CI/CD, Docker, Kubernetes, AWS, Azure, Jenkins, automation, infrastructure as code, monitoring, system reliability, Linux, scripting',
      sections: 'Technical Skills, DevOps Experience, Infrastructure Projects, Education, Certifications',
      tone: 'technical and automation-focused, emphasizing system reliability and operational efficiency'
    },
    'content-writer': {
      focus: 'content creation, SEO writing, brand voice, audience engagement, and content strategy',
      keywords: 'content writing, copywriting, SEO, content strategy, social media, blog writing, technical writing, brand voice, audience engagement, content management',
      sections: 'Writing Experience, Content Portfolio, Skills, Education, Published Work',
      tone: 'creative and communication-focused, highlighting writing versatility and audience engagement'
    }
  };

  return rolePrompts[role] || rolePrompts['software-engineer']; // Default to software engineer
}

/**
 * Create persona-based resume content
 * @param {string} originalContent - Original resume content
 * @param {string} personaName - Name for the persona
 * @param {string} level - Experience level (senior, mid-level, junior)
 * @param {string} targetRole - Target role
 * @returns {string} Persona-specific resume content
 */
function createPersonaResume(originalContent, personaName, level, targetRole) {
  const rolePrompts = getRoleSpecificPrompts(targetRole);
  
  // Generate contact info based on persona name
  const contacts = {
    "John Smith": {
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA"
    },
    "Priya Sharma": {
      email: "priya.sharma@email.com", 
      phone: "(555) 234-5678",
      location: "Seattle, WA"
    },
    "Alex Johnson": {
      email: "alex.johnson@email.com",
      phone: "(555) 345-6789", 
      location: "Austin, TX"
    }
  };

  const contact = contacts[personaName] || contacts["John Smith"];
  
  // Create experience descriptions based on level
  const experienceDescriptions = {
    "senior": "Senior professional with 5+ years of experience in " + targetRole.replace('-', ' '),
    "mid-level": "Mid-level professional with 3+ years of experience in " + targetRole.replace('-', ' '), 
    "junior": "Entry-level professional with strong project portfolio in " + targetRole.replace('-', ' ')
  };

  // Template structure with persona-specific content
  const resumeTemplate = `
${personaName}
${contact.email} | ${contact.phone} | ${contact.location}

PROFESSIONAL SUMMARY
${experienceDescriptions[level]}. ${rolePrompts.focus.split(',')[0]} specialist with proven track record of delivering results.

TECHNICAL SKILLS
${rolePrompts.keywords}

${originalContent}

Key Focus Areas:
- ${rolePrompts.focus.split(',').slice(0, 3).join('\n- ')}
`;

  return resumeTemplate.trim();
}

/**
 * Optimize resume using Gemini AI or return raw data based on user preferences
 * @param {string} resumeText - Original resume text
 * @param {string} targetRole - Target role for optimization
 * @param {Object} options - Optional configuration object
 * @param {string} options.requestedTemplate - Specific template user wants ('senior-modern', 'concise-classic', 'both')
 * @param {boolean} options.skipOptimization - If true, skip Gemini and return raw data
 * @returns {Promise<Object>} Optimization result
 */
export async function optimizeResume(resumeText, targetRole, options = {}) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const { requestedTemplate = 'both', skipOptimization = false, progressCallback } = options;

  // Progress helper function
  const sendProgress = (step, message, data = null) => {
    if (progressCallback && typeof progressCallback === 'function') {
      progressCallback(step, message, data);
    }
  };
  // 1. Start of Request (Standardized)
  sendProgress('analyzing', 'Analyzing resume structure and content...');
  console.log(` [${requestId}] Starting resume optimization`);
  console.log(`    Template: ${requestedTemplate}`);
  console.log(`    Optimization requested: ${!skipOptimization}`);

  // Clean and validate the resume text
  sendProgress('cleaning', 'Cleaning and validating resume text...');
  const cleanedText = cleanExtractedText(resumeText);
  const validation = validateResumeText(cleanedText);

  // Parse raw resume data for fallback scenarios
  sendProgress('parsing', 'Parsing resume sections and extracting data...');
  console.log(` [${requestId}] About to parse cleanedText (${cleanedText.length} chars):`);
  console.log(` [${requestId}] Sample text: "${cleanedText.substring(0, 200)}..."`);
  const rawData = parseRawResumeData(cleanedText);
  console.log(` [${requestId}] Raw data after parsing:`);
  console.log(`    Name: "${rawData.name}"`);
  console.log(`    Skills: ${Array.isArray(rawData.skills) ? rawData.skills.length : 'NOT_ARRAY'} - ${rawData.skills}`);
  console.log(`    Experience: ${Array.isArray(rawData.experience) ? rawData.experience.length : 'NOT_ARRAY'}`);
  console.log(`    Education: ${Array.isArray(rawData.education) ? rawData.education.length : 'NOT_ARRAY'}`);
  console.log(`    Projects: ${Array.isArray(rawData.projects) ? rawData.projects.length : 'NOT_ARRAY'}`);
  console.log(`    Certifications: ${Array.isArray(rawData.certifications) ? rawData.certifications.length : 'NOT_ARRAY'}`);
  console.log(`    Summary: ${rawData.summary?.length || 0} chars`);
  
  // Decision logic based on user preferences
  const shouldUseGemini = !skipOptimization && requestedTemplate !== 'concise-classic-only';
  const isConciseClassicOnly = requestedTemplate === 'concise-classic' || requestedTemplate === 'concise-classic-only';
  
  // Handle different scenarios based on user preferences
  if (isConciseClassicOnly && !shouldUseGemini) {
    // 2. Concise Classic (Local Trim Only) - Standardized
    sendProgress('trimming', 'Applying concise template trimming logic...');
    console.log(` [${requestId}] Using trimForConciseClassic (no Gemini call)`);

    const trimmedData = trimForConciseClassic(rawData);
    
    // Section counts for trimmed data
    console.log(` [${requestId}] Section counts (trimmed):`);
    console.log(`   - Summary: ${trimmedData.summary?.length || 0} chars`);
    console.log(`   - Skills: ${Array.isArray(trimmedData.skills) ? trimmedData.skills.length : 0}`);
    console.log(`   - Experience: ${Array.isArray(trimmedData.experience) ? trimmedData.experience.length : 0}`);
    console.log(`   - Projects: ${Array.isArray(trimmedData.projects) ? trimmedData.projects.length : 0}`);
    console.log(`   - Education: ${Array.isArray(trimmedData.education) ? trimmedData.education.length : 0}`);
    console.log(`   - Certifications: ${Array.isArray(trimmedData.certifications) ? trimmedData.certifications.length : 0}`);
    console.log(`   - Optional (awards, publications): REMOVED`);
    
    const templates = [{
      id: `${rawData.name} - Concise Classic`,
      name: `${rawData.name} - Concise Classic`,
      description: "Clean, traditional format optimized for ATS scanning (trimmed from raw data)",
      content: trimmedData,
      style: "concise-classic",
      metadata: { source: "manual", requestId }
    }];
    
    console.log(` [${requestId}] Returning locally trimmed data`);
    console.log(`    metadata: { source: "manual", isOptimized: false }`);
    return {
      originalText: cleanedText,
      templates,
      improvements: [" Template generated from raw resume data", " Content trimmed for concise format", " No AI optimization applied"],
      stats: { atsScore: 75, keywordsAdded: 0, improvementsMade: 0, matchScore: 60 },
      keyChanges: "Template formatted from original resume without AI optimization",
      targetRole
    };
  }
  
  if (skipOptimization) {
    // Skip Optimization Scenario - Raw data for both templates
    console.log(` [${requestId}] Skip optimization requested - returning raw data`);
    
    const seniorTemplate = {
      id: `${rawData.name} - Senior Modern`,
      name: `${rawData.name} - Senior Modern`,
      description: "Executive-level template with modern design (raw data)",
      content: rawData,
      style: "senior-modern",
      metadata: { source: "manual", requestId }
    };
    
    const conciseTemplate = {
      id: `${rawData.name} - Concise Classic`,
      name: `${rawData.name} - Concise Classic`,
      description: "Clean, traditional format (raw data, trimmed)",
      content: trimForConciseClassic(rawData),
      style: "concise-classic", 
      metadata: { source: "manual", requestId }
    };
    
    const templates = requestedTemplate === 'senior-modern' ? [seniorTemplate] :
                     requestedTemplate === 'concise-classic' ? [conciseTemplate] :
                     [seniorTemplate, conciseTemplate];
    
    console.log(` [${requestId}] Generated ${templates.length} raw data templates`);
    console.log(`    metadata: { source: "manual", isOptimized: false }`);
    return {
      originalText: cleanedText,
      templates,
      improvements: [" Templates generated from raw resume data", " No AI optimization applied"],
      stats: { atsScore: 70, keywordsAdded: 0, improvementsMade: 0, matchScore: 55 },
      keyChanges: "Templates formatted from original resume without AI optimization",
      targetRole
    };
  }
  
  // Scenario 3: Use Gemini AI optimization
  console.log(` [${requestId}] STARTING GEMINI FLOW - Entering try block`);
  try {
    if (!model) {
      try {
        sendProgress('initializing', 'Initializing AI optimization service...');
        console.log(` [${requestId}] Initializing Gemini AI...`);
        initializeGeminiAI();
        console.log(` [${requestId}] Gemini AI initialized successfully`);
      } catch (error) {
        console.log(` [${requestId}] Gemini AI initialization failed: ${error.message}`);
        throw new Error('Gemini AI service not available. Please check API key configuration.');
      }
    } else {
      console.log(` [${requestId}] Gemini AI model already initialized`);
    }

    // 3. Senior Modern (Optimization Requested) - Standardized
    sendProgress('optimizing-payload', 'Preparing optimized data for AI processing...');
    console.log(` [${requestId}] Calling Gemini API (attempt 1/3)`);
    const rolePrompts = getRoleSpecificPrompts(targetRole);

    // Extract key sections for optimized payload
    const { structuredData, optimizedText } = extractKeyResumeData(rawData);
    const originalLength = cleanedText.length;
    const optimizedLength = optimizedText.length;
    const reductionPercent = Math.round((1 - optimizedLength / originalLength) * 100);

    console.log(` [${requestId}] Payload optimization:`);
    console.log(`    Original: ${originalLength} chars`);
    console.log(`    Optimized: ${optimizedLength} chars`);
    console.log(`    Reduction: ${reductionPercent}%`);

    sendProgress('ai-processing', `Processing with AI optimizer (${reductionPercent}% payload reduction)...`, {
      payloadReduction: reductionPercent,
      targetRole: targetRole
    });

    const optimizationPrompt = `You are a resume optimizer. Take the provided structured resume data and output **valid JSON** strictly following this schema:

TARGET ROLE: ${targetRole.replace('-', ' ').toUpperCase()}
FOCUS KEYWORDS: ${rolePrompts.keywords}

STRUCTURED RESUME DATA (Key Sections):
${optimizedText}

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON, no markdown, no explanations, no code blocks
- Generate exactly 2 templates: senior-modern and concise-classic
- Extract all sections from the resume text - do not put everything in summary
- If data is missing, return empty string or empty array (but never omit keys)

JSON SCHEMA TO FOLLOW EXACTLY:

{
  "templates": [
    {
      "id": "senior-modern-template",
      "name": "Senior Modern",
      "description": "Executive-level template with modern design and comprehensive sections",
      "content": {
        "name": "person's actual name",
        "contact": { 
          "email": "", 
          "phone": "", 
          "location": "", 
          "linkedin": "", 
          "github": "", 
          "website": "" 
        },
        "summary": "Detailed executive summary 3-4 sentences",
        "skills": ["skill1", "skill2", "skill3"],
        "experience": [{
          "company": "",
          "dates": "date1-date2",
          "title": "",
          "location": "",
          "description": ["detailed point1", "detailed point2", "detailed point3"]
        }],
        "education": [{
          "university": "",
          "degree": "",
          "year": "",
          "location": ""
        }],
        "projects": [{
          "name": "",
          "description": ["project point1", "project point2"],
          "technologies": ["tech1", "tech2"]
        }],
        "certifications": ["certification1", "certification2"]
      },
      "style": "senior-modern"
    },
    {
      "id": "concise-classic-template", 
      "name": "Concise Classic",
      "description": "Clean, traditional format optimized for ATS scanning",
      "content": {
        "name": "person's actual name",
        "contact": { 
          "email": "", 
          "phone": "", 
          "location": "", 
          "linkedin": "", 
          "github": "", 
          "website": "" 
        },
        "summary": "Concise professional summary 1-2 sentences",
        "skills": ["skill1", "skill2", "skill3"],
        "experience": [{
          "company": "",
          "dates": "date1-date2", 
          "title": "",
          "location": "",
          "description": ["concise point1", "concise point2"]
        }],
        "education": [{
          "university": "",
          "degree": "",
          "year": "",
          "location": ""
        }],
        "projects": [{
          "name": "",
          "description": ["project point1"],
          "technologies": ["tech1", "tech2"]
        }],
        "certifications": ["certification1", "certification2"]
      },
      "style": "concise-classic"
    }
  ],
  "improvements": [
    "List of specific improvements made"
  ],
  "stats": {
    "atsScore": number (1-100),
    "keywordsAdded": number,
    "improvementsMade": number,
    "matchScore": number (1-100)
  },
  "keyChanges": "Summary of the most important changes made for this role"
}

IMPORTANT: Generate unique content for each template style. Do NOT include code formatting (like \`\`\`json), markdown, or HTML  return raw JSON only.
`;
    console.log(` [${requestId}] About to call Gemini API with ${optimizationPrompt.length} char prompt`);
    sendProgress('ai-calling', 'Calling AI optimization service...');
    console.log(` Sending optimization request to Gemini AI for role: ${targetRole}`);
    console.log(` Prompt length: ${optimizationPrompt.length} characters`);

    // Use enhanced validation wrapper
    console.log(` [${requestId}] Calling callGeminiWithValidation() with 35s timeout...`);
    sendProgress('ai-waiting', 'Waiting for AI response (up to 35s timeout)...');

    const parsed = await callGeminiWithValidation(optimizationPrompt, targetRole, 3, requestId);

    console.log(` [${requestId}] Gemini API call completed successfully`);
    sendProgress('ai-completed', 'AI optimization completed, processing results...');

    // Extract improvements, stats, and keyChanges from Gemini response
    const improvements = parsed.improvements || [];
    const stats = parsed.stats || { atsScore: 90, keywordsAdded: 15, improvementsMade: 8, matchScore: 85 };
    const keyChanges = parsed.keyChanges || '';

    console.log(' Gemini returned templates:', parsed.templates?.length || 'NONE');
    console.log(' Template keys from Gemini:', parsed.templates?.map(t => `${t.name} (${t.style})`) || 'NO TEMPLATES');
    
    // Use all templates directly from Gemini - no more hardcoded template creation
    if (!parsed.templates || !Array.isArray(parsed.templates) || parsed.templates.length === 0) {
      throw new Error('Gemini returned no templates - invalid response format');
    }
    
    // Map Gemini templates to our expected format, preserving unique content for each style
    const geminiTemplates = parsed.templates.map((template, index) => {
      const personName = template.content?.name || "Professional Resume";
      
      // Add multi-page format indicators for Concise Classic
      const templateData = {
        id: `${personName} - ${template.name}`,
        name: `${personName} - ${template.name}`,
        description: template.description || `Template ${index + 1}`,
        content: template.content,
        style: template.style || "professional-standard",
        metadata: { 
          source: 'gemini',
          requestId
        },
        isOptimized: true
      };
      
      // Keep Concise Classic as single-page layout for now
      // Multi-page support will be added later when explicitly requested
      
      return templateData;
    });
    
    console.log(' Processed Gemini templates:', geminiTemplates.map(t => `${t.name} (${t.style})`));
    console.log(' Object.keys(optimized.templates):', Object.keys(geminiTemplates));
    console.log(' Template details:');
    geminiTemplates.forEach((template, idx) => {
      console.log(`  ${idx + 1}. ${template.name}:`);
      console.log(`     Style: ${template.style}`);
      console.log(`     Source: ${template.source || 'unknown'}`);
      console.log(`     Content keys: ${Object.keys(template.content || {})}`);
      console.log(`     Content preview: ${template.content?.name || 'NO NAME'} - ${template.content?.summary?.substring(0, 100) || 'NO SUMMARY'}...`);
    });
    
    const parsedResponse = {
      templates: geminiTemplates,
      improvements: improvements.length > 0 ? improvements : [
        " Resume content optimized for " + targetRole,
        " Role-specific keywords integrated", 
        " Professional formatting applied",
        " Achievements quantified where possible"
      ],
      stats: stats,
      keyChanges: keyChanges || ` Resume optimized for ${targetRole} role with enhanced keywords and achievements`,
      optimizationStatus: 'success'
    };
    
    // Templates already marked as gemini/optimized in the mapping above
    
    // Section counts for Gemini optimized data (Senior Modern template)
    const seniorModernTemplate = parsedResponse.templates.find(t => t.style === 'senior-modern');
    if (seniorModernTemplate && seniorModernTemplate.content) {
      const content = seniorModernTemplate.content;
      console.log(` [${requestId}] Section counts (Gemini optimized):`);
      console.log(`   - Skills: ${Array.isArray(content.skills) ? content.skills.length : 0}`);
      console.log(`   - Experience: ${Array.isArray(content.experience) ? content.experience.length : 0}`);
      console.log(`   - Education: ${Array.isArray(content.education) ? content.education.length : 0}`);
      console.log(`   - Projects: ${Array.isArray(content.projects) ? content.projects.length : 0}`);
    }
    
    console.log(` [${requestId}] Success with Gemini optimization`);
    console.log(`    metadata: { source: "gemini", isOptimized: true }`);
    
    // Ensure we have both Senior Modern and Concise Classic from Gemini
    const seniorModern = parsedResponse.templates.find(t => t.style === 'senior-modern');
    const conciseClassic = parsedResponse.templates.find(t => t.style === 'concise-classic');
    console.log(' Senior Modern from Gemini found:', seniorModern ? ' YES' : ' NO');
    console.log(' Concise Classic from Gemini found:', conciseClassic ? ' YES' : ' NO');
    
    // Validate that we have both required templates from Gemini
    if (!seniorModern || !conciseClassic) {
      console.error(' Missing required templates from Gemini response!');
      console.error('Available templates:', parsedResponse.templates.map(t => `${t.name} (${t.style})`));
      throw new Error(`Missing required templates: ${!seniorModern ? 'senior-modern' : ''} ${!conciseClassic ? 'concise-classic' : ''}`);
    }

    // Validate response structure
    if (!parsedResponse.templates || !Array.isArray(parsedResponse.templates) || parsedResponse.templates.length === 0) {
      throw new Error('Invalid response: missing resume templates');
    }

    sendProgress('finalizing', 'Finalizing optimized templates...', {
      templatesGenerated: parsedResponse.templates.length,
      improvements: improvements.length,
      atsScore: stats.atsScore
    });

    console.log(` [${requestId}] Resume optimization completed successfully with Gemini AI`);
    console.log(` [${requestId}] Generated optimized templates:`, parsedResponse.templates.map(t => `${t.name} (${t.style})`));

    return parsedResponse;

  } catch (error) {
    // 4. Enhanced Fallback Handler - Timeout & Service Error Detection
    console.log(` [${requestId}] GEMINI FLOW FAILED - Entering catch block`);
    console.log(` [${requestId}] Error message: ${error.message}`);
    console.log(` [${requestId}] Error stack: ${error.stack}`);

    const isTimeout = error.isTimeout || error.message.includes('timeout');
    const isServiceError = error.isServiceError || error.message.includes('503') || error.message.includes('Service Unavailable');

    console.log(` [${requestId}] Error classification: timeout=${isTimeout}, service=${isServiceError}`);

    if (isTimeout) {
      sendProgress('fallback-timeout', 'AI optimizer timed out - using fallback optimizer...');
      console.log(` [${requestId}] Gemini API timed out  Using fallback trimming logic`);
    } else if (isServiceError) {
      sendProgress('fallback-service', 'AI service unavailable - using fallback optimizer...');
      console.log(` [${requestId}] Gemini API service unavailable  Using fallback trimming logic`);
    } else {
      sendProgress('fallback-error', 'AI optimization failed - using fallback optimizer...');
      console.log(` [${requestId}] All Gemini attempts failed  Using fallback trimming logic`);
    }

    console.log(` [${requestId}] Proceeding with fallback data generation...`);

    // Debug rawData at fallback entry point
    console.log(` [${requestId}] FALLBACK ENTRY POINT - rawData status:`);
    console.log(`    rawData exists: ${!!rawData}`);
    console.log(`    rawData type: ${typeof rawData}`);
    if (rawData) {
      console.log(`    rawData.name: "${rawData.name}"`);
      console.log(`    rawData.skills: ${Array.isArray(rawData.skills) ? `Array(${rawData.skills.length})` : typeof rawData.skills} - ${rawData.skills}`);
      console.log(`    rawData.experience: ${Array.isArray(rawData.experience) ? `Array(${rawData.experience.length})` : typeof rawData.experience}`);
      console.log(`    rawData.education: ${Array.isArray(rawData.education) ? `Array(${rawData.education.length})` : typeof rawData.education}`);
    }

    // Enhanced Safety fallback: use trimming logic for better results
    console.log(` [${requestId}] FALLBACK DEBUG - Raw data before processing:`);
    console.log(`    Name: "${rawData.name}"`);
    console.log(`    Skills: ${Array.isArray(rawData.skills) ? rawData.skills.length : 'NOT_ARRAY'} (${rawData.skills})`);
    console.log(`    Experience: ${Array.isArray(rawData.experience) ? rawData.experience.length : 'NOT_ARRAY'}`);
    console.log(`    Education: ${Array.isArray(rawData.education) ? rawData.education.length : 'NOT_ARRAY'}`);
    console.log(`    Projects: ${Array.isArray(rawData.projects) ? rawData.projects.length : 'NOT_ARRAY'}`);
    console.log(`    Certifications: ${Array.isArray(rawData.certifications) ? rawData.certifications.length : 'NOT_ARRAY'}`);
    console.log(`    Summary: ${rawData.summary?.length || 0} chars`);

    const seniorContent = { ...rawData };
    console.log(` [${requestId}] FALLBACK DEBUG - Senior content after copy:`);
    console.log(`    Skills: ${Array.isArray(seniorContent.skills) ? seniorContent.skills.length : 'NOT_ARRAY'}`);
    console.log(`    Experience: ${Array.isArray(seniorContent.experience) ? seniorContent.experience.length : 'NOT_ARRAY'}`);

    const conciseContent = trimForConciseClassic(rawData);
    console.log(` [${requestId}] FALLBACK DEBUG - Concise content after trimming:`);
    console.log(`    Skills: ${Array.isArray(conciseContent.skills) ? conciseContent.skills.length : 'NOT_ARRAY'}`);
    console.log(`    Experience: ${Array.isArray(conciseContent.experience) ? conciseContent.experience.length : 'NOT_ARRAY'}`);
    console.log(`    Education: ${Array.isArray(conciseContent.education) ? conciseContent.education.length : 'NOT_ARRAY'}`);
    console.log(`    Projects: ${Array.isArray(conciseContent.projects) ? conciseContent.projects.length : 'NOT_ARRAY'}`);

    // Add fallback reason to template names for user clarity
    const fallbackReason = isTimeout ? "(Timeout - Fallback Optimizer)" :
                          isServiceError ? "(Service Unavailable - Fallback Optimizer)" :
                          "(Fallback Optimizer)";

    const seniorTemplate = {
      id: `${rawData.name} - Senior Modern ${fallbackReason}`,
      name: `${rawData.name} - Senior Modern ${fallbackReason}`,
      description: isTimeout ? "Executive-level template generated using fallback optimizer (Gemini timeout)" :
                  isServiceError ? "Executive-level template generated using fallback optimizer (Service unavailable)" :
                  "Executive-level template generated using fallback optimizer",
      content: seniorContent,
      style: "senior-modern",
      metadata: {
        source: 'fallback',
        requestId,
        fallbackReason: isTimeout ? 'timeout' : isServiceError ? 'service_unavailable' : 'general_error'
      },
      isOptimized: false
    };

    const conciseTemplate = {
      id: `${rawData.name} - Concise Classic ${fallbackReason}`,
      name: `${rawData.name} - Concise Classic ${fallbackReason}`,
      description: isTimeout ? "Concise template generated using fallback optimizer (Gemini timeout)" :
                  isServiceError ? "Concise template generated using fallback optimizer (Service unavailable)" :
                  "Concise template generated using fallback optimizer",
      content: conciseContent,
      style: "concise-classic",
      metadata: {
        source: 'fallback',
        requestId,
        fallbackReason: isTimeout ? 'timeout' : isServiceError ? 'service_unavailable' : 'general_error'
      },
      isOptimized: false
    };

    const templates = requestedTemplate === 'senior-modern' ? [seniorTemplate] :
                     requestedTemplate === 'concise-classic' ? [conciseTemplate] :
                     [seniorTemplate, conciseTemplate];

    // Enhanced fallback messaging based on error type
    const improvements = isTimeout ? [
      " AI optimizer timed out - using fallback trimming logic",
      " Content optimized using local trimming rules",
      " Basic resume structure preserved",
      " Try again later when AI service is responsive"
    ] : isServiceError ? [
      " AI service temporarily unavailable - using fallback optimizer",
      " Content optimized using local trimming logic",
      " Resume structure preserved",
      " AI service should be available again shortly"
    ] : [
      " AI optimization failed - using fallback optimizer",
      " Content optimized using local rules",
      " Basic resume structure preserved"
    ];

    const keyChanges = isTimeout ?
      " AI optimizer timed out - resume formatted using fallback logic" :
      isServiceError ?
      " AI service unavailable - resume formatted using fallback logic" :
      " AI optimization failed - resume formatted using fallback logic";

    const fallbackResponse = {
      originalText: cleanedText,
      templates,
      improvements,
      stats: { atsScore: 65, keywordsAdded: 0, improvementsMade: 2, matchScore: 55 },
      keyChanges,
      targetRole,
      optimizationStatus: isTimeout ? 'timeout_fallback' : isServiceError ? 'service_fallback' : 'error_fallback'
    };

    console.log(` [${requestId}] Using fallback trimming logic`);
    console.log(`    metadata: { source: "fallback", fallbackReason: "${isTimeout ? 'timeout' : isServiceError ? 'service_unavailable' : 'general_error'}" }`);
    console.log(` [${requestId}] FALLBACK COMPLETE - Returning fallback response with ${fallbackResponse.templates.length} templates`);
    return fallbackResponse;
  }
}

// No automatic initialization - will initialize when needed
