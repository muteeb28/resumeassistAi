import OpenAI from 'openai';

export interface UserData {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
    summary?: string;
  };
  experiences: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    location: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    graduationDate: string;
    location: string;
    gpa?: string;
  }>;
  skills?: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    portfolio?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    graduation: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  certifications?: string[];
}

export class ResumeGeneratorService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Generate a customized resume based on job description and optionally user data
   */
  async generateResume(jobDescription: string, templateId: string, userData?: UserData): Promise<ResumeData> {
    try {
      console.log('🤖 Starting AI resume generation...');
      console.log('📋 User data received:', userData);
      console.log('💼 Job description length:', jobDescription.length);
      console.log('🎨 Template ID:', templateId);
      
      const prompt = this.buildResumePrompt(jobDescription, templateId, userData);
      console.log('📝 Generated prompt length:', prompt.length);
      
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer and career consultant. Create compelling, ATS-optimized resumes that perfectly match job requirements while highlighting relevant skills and experience.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const result = completion.choices[0].message.content;
      console.log('🎯 AI Response received:', result);
      
      if (!result) {
        throw new Error('No resume data received from AI');
      }
      
      const parsedResult = this.parseResumeResult(result);
      console.log('✅ Successfully parsed AI resume:', parsedResult);
      return parsedResult;
    } catch (error) {
      console.error('❌ Error generating resume:', error);
      console.log('🔄 Using fallback with user data instead');
      
      // Create fallback data using actual user information instead of hardcoded data
      const fallbackData = this.createUserBasedFallback(jobDescription, userData);
      console.log('📋 Fallback data created:', fallbackData);
      return fallbackData;
    }
  }

  /**
   * Build the prompt for resume generation
   */
  private buildResumePrompt(jobDescription: string, templateId: string, userData?: UserData): string {
    const hasUserData = userData && userData.personalDetails;
    
    return `
You are an expert resume writer who specializes in creating professional resumes that match specific job requirements. Analyze the job description below and create a compelling, ATS-optimized resume.

TARGET JOB DESCRIPTION:
${jobDescription}

${hasUserData ? `
USER'S CURRENT INFORMATION:
Personal Details:
- Name: ${userData.personalDetails.fullName}
- Email: ${userData.personalDetails.email}
- Phone: ${userData.personalDetails.phone}
- Location: ${userData.personalDetails.location}
- LinkedIn: ${userData.personalDetails.linkedin}
- Website: ${userData.personalDetails.website}
- Current Summary: ${userData.personalDetails.summary}

Work Experience:
${userData.experiences.map((exp, i: number) => `
${i + 1}. ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})
   Location: ${exp.location}
   Description: ${exp.description}
`).join('')}

Education:
${userData.education.map((edu, i: number) => `
${i + 1}. ${edu.degree} from ${edu.school} (${edu.graduationDate})
   Location: ${edu.location}
   GPA: ${edu.gpa || 'Not provided'}
`).join('')}

Skills: ${userData.skills}

CUSTOMIZATION INSTRUCTIONS:
1. ANALYZE the job description to identify:
   - Required technical skills and tools
   - Preferred soft skills and qualities
   - Key responsibilities and requirements
   - Industry keywords and terminology
   - Company culture and values

2. TRANSFORM the user's content by:
   - Rewriting their professional summary to mirror the job requirements
   - Enhancing their work experience descriptions to highlight relevant achievements
   - Reorganizing and expanding their skills to match job requirements
   - Adding industry-specific keywords naturally throughout
   - Quantifying achievements with realistic numbers where missing
   - Using action verbs that match the job posting tone

3. PRIORITIZE content that matches the job description while keeping all factual information accurate.
` : `
RESUME CREATION INSTRUCTIONS:
Since no user data is provided, create a professional resume template that perfectly matches the job requirements:

1. ANALYZE the job description to identify:
   - Required technical skills and tools
   - Preferred soft skills and qualities
   - Key responsibilities and requirements
   - Industry keywords and terminology
   - Experience level and qualifications needed

2. CREATE compelling resume content that includes:
   - A professional summary that mirrors the job requirements
   - Relevant work experience that demonstrates the required skills
   - Education background appropriate for the role
   - Technical and soft skills that match the job posting
   - Projects and achievements that align with job responsibilities

3. ENSURE the resume is:
   - ATS-optimized with relevant keywords
   - Professionally written with strong action verbs
   - Quantified with realistic metrics and achievements
   - Tailored specifically to this job opportunity
`}

Template Style: ${templateId}

Please provide the resume data in the following JSON format:
{
  "personalInfo": {
    "name": "Professional Name",
    "email": "email@example.com", 
    "phone": "(555) 123-4567",
    "location": "City, State",
    "linkedIn": "linkedin.com/in/profile",
    "portfolio": "portfolio-url.com"
  },
  "summary": "Compelling 2-3 sentence professional summary that highlights relevant experience and matches the job requirements",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title", 
      "duration": "MM/YYYY - MM/YYYY",
      "description": [
        "• Achievement-focused bullet point with quantified results",
        "• Another accomplishment that demonstrates relevant skills",
        "• Third bullet showing impact and value delivered"
      ]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science in Computer Science",
      "graduation": "YYYY",
      "gpa": "3.8"
    }
  ],
  "skills": {
    "technical": ["Skills that directly match the job requirements", "Tools mentioned in job posting", "Technologies from job description"],
    "soft": ["Soft skills specifically mentioned in job posting", "Leadership qualities requested", "Communication skills emphasized"]
  },
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description of the project and its impact",
      "technologies": ["Tech1", "Tech2", "Tech3"]
    }
  ],
  "certifications": ["Certification 1", "Certification 2"]
}

CRITICAL REQUIREMENTS:
1. **Skills Section Transformation**: 
   - Extract exact technical skills, tools, and software mentioned in the job description
   - Include programming languages, frameworks, and technologies from the job posting
   - Add relevant certifications or qualifications mentioned in requirements
   - Prioritize skills that appear multiple times in the job description

2. **Experience Description Enhancement**:
   - Rewrite job descriptions to emphasize achievements that match job requirements
   - Include industry-specific terminology from the job posting
   - Add quantified achievements that align with job responsibilities
   - Use action verbs that mirror the job description language

3. **Professional Summary Customization**:
   - Mirror the exact qualifications and experience requirements
   - Include key phrases and keywords from the job posting
   - Highlight years of experience that match their requirements
   - Emphasize personality traits and soft skills they're seeking

4. **Keyword Integration**:
   - Naturally incorporate exact keywords and phrases from job description
   - Include company-specific terminology if mentioned
   - Add industry buzzwords and technical jargon used in the posting
   - Ensure ATS optimization with relevant keyword density

5. **Content Prioritization**:
   - Lead with information most relevant to the job requirements
   - Emphasize experiences that align with job responsibilities
   - Highlight education and projects that match their needs
   - De-emphasize or reframe less relevant background

STRICT RULES:
- Keep all factual information (names, companies, schools, dates) accurate
- Only enhance descriptions, summaries, and skill presentations  
- Do not fabricate experiences, education, or achievements
- Focus on reframing existing background to match job requirements
- Make the resume feel like it was written specifically for this job
`;
  }

  /**
   * Parse the AI-generated resume result
   */
  private parseResumeResult(result: string): ResumeData {
    try {
      // Extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.personalInfo || !parsed.summary || !parsed.experience) {
        throw new Error('Invalid resume structure');
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing resume result:', error);
      throw new Error('Failed to parse AI-generated resume');
    }
  }

  /**
   * Create fallback resume data using actual user information
   */
  private createUserBasedFallback(jobDescription?: string, userData?: UserData): ResumeData {
    // Extract some keywords from job description for skills enhancement
    const jobKeywords = jobDescription ? this.extractSkillsFromJobDescription(jobDescription) : [];
    
    // If we have user data, use it; otherwise, use the existing fallback data
    if (userData && userData.personalDetails) {
      return {
        personalInfo: {
          name: userData.personalDetails.fullName || "User",
          email: userData.personalDetails.email || "user@email.com",
          phone: userData.personalDetails.phone || "(555) 123-4567",
          location: userData.personalDetails.location || "City, State",
          linkedIn: userData.personalDetails.linkedin || undefined,
          portfolio: userData.personalDetails.website || undefined
        },
        summary: userData.personalDetails.summary || "Professional with diverse experience and strong technical skills.",
        experience: userData.experiences.filter(exp => exp.jobTitle && exp.company).map(exp => ({
          company: exp.company,
          position: exp.jobTitle,
          duration: `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`,
          description: exp.description ? exp.description.split('\n').filter(line => line.trim()).map(line => 
            line.startsWith('•') ? line : `• ${line}`
          ) : [`• Responsibilities and achievements at ${exp.company}`]
        })),
        education: userData.education.filter(edu => edu.degree && edu.school).map(edu => ({
          institution: edu.school,
          degree: edu.degree,
          graduation: edu.graduationDate,
          gpa: edu.gpa || undefined
        })),
        skills: {
          technical: userData.skills ? 
            [...userData.skills.split(',').map(s => s.trim()).filter(s => s), ...jobKeywords].slice(0, 12) : 
            jobKeywords.slice(0, 8),
          soft: ['Communication', 'Leadership', 'Problem Solving', 'Teamwork']
        },
        projects: [],
        certifications: []
      };
    } else {
      // No user data provided, use fallback with job-specific enhancements
      const fallbackData = this.getFallbackResumeData();
      
      // Enhance the fallback with job-specific keywords
      if (jobKeywords.length > 0) {
        fallbackData.skills.technical = [...new Set([...fallbackData.skills.technical, ...jobKeywords])].slice(0, 12);
      }
      
      return fallbackData;
    }
  }

  /**
   * Extract technical skills and keywords from job description
   */
  private extractSkillsFromJobDescription(jobDescription: string): string[] {
    const skillKeywords = [
      // Programming languages
      'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      // Web technologies
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'HTML', 'CSS', 'Sass', 'Bootstrap', 'Tailwind',
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL', 'NoSQL',
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git', 'GitHub', 'GitLab',
      // Tools & Frameworks
      'Linux', 'Unix', 'Agile', 'Scrum', 'REST', 'API', 'GraphQL', 'Microservices', 'TDD', 'Unit Testing'
    ];

    const extractedSkills: string[] = [];
    const lowerJobDesc = jobDescription.toLowerCase();

    skillKeywords.forEach(skill => {
      if (lowerJobDesc.includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    });

    // Extract other potential skills using regex patterns
    const skillPatterns = [
      /\b[A-Z][a-z]*\.js\b/g, // Framework patterns like Vue.js
      /\b[A-Z]{2,}\b/g, // Acronyms like REST, API
    ];

    skillPatterns.forEach(pattern => {
      const matches = jobDescription.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!extractedSkills.includes(match) && match.length > 2) {
            extractedSkills.push(match);
          }
        });
      }
    });

    return [...new Set(extractedSkills)]; // Remove duplicates
  }

  /**
   * Fallback resume data if AI generation fails
   */
  private getFallbackResumeData(): ResumeData {
    return {
      personalInfo: {
        name: "Alex Johnson",
        email: "alex.johnson@email.com",
        phone: "(555) 123-4567",
        location: "San Francisco, CA",
        linkedIn: "linkedin.com/in/alexjohnson",
        portfolio: "alexjohnson.dev"
      },
      summary: "Results-driven professional with 5+ years of experience in technology and business development. Proven track record of delivering innovative solutions and driving growth through strategic thinking and collaborative leadership.",
      experience: [
        {
          company: "TechCorp Solutions",
          position: "Senior Software Engineer",
          duration: "01/2022 - Present",
          description: [
            "• Led development of 3 major product features, resulting in 25% increase in user engagement",
            "• Collaborated with cross-functional teams to deliver projects 15% ahead of schedule",
            "• Mentored 4 junior developers and improved team code quality by 30%",
            "• Implemented automated testing processes, reducing bug reports by 40%"
          ]
        },
        {
          company: "Innovation Labs",
          position: "Software Engineer",
          duration: "06/2020 - 12/2021",
          description: [
            "• Developed and maintained scalable web applications serving 100K+ users",
            "• Optimized database queries resulting in 50% improvement in page load times",
            "• Contributed to open-source projects and technical documentation"
          ]
        },
        {
          company: "StartupXYZ",
          position: "Junior Developer",
          duration: "08/2019 - 05/2020",
          description: [
            "• Built responsive web interfaces using modern JavaScript frameworks",
            "• Participated in agile development processes and daily standups",
            "• Assisted in deployment and maintenance of production applications"
          ]
        }
      ],
      education: [
        {
          institution: "University of California, Berkeley",
          degree: "Bachelor of Science in Computer Science",
          graduation: "2019",
          gpa: "3.7"
        }
      ],
      skills: {
        technical: ["JavaScript", "React", "Node.js", "Python", "SQL", "AWS", "Git", "Docker"],
        soft: ["Leadership", "Communication", "Problem Solving", "Team Collaboration", "Project Management"]
      },
      projects: [
        {
          name: "E-commerce Platform",
          description: "Full-stack e-commerce solution with payment integration and inventory management",
          technologies: ["React", "Node.js", "MongoDB", "Stripe API"]
        },
        {
          name: "Data Analytics Dashboard",
          description: "Real-time analytics dashboard for business intelligence and reporting",
          technologies: ["Python", "Django", "PostgreSQL", "Chart.js"]
        }
      ],
      certifications: ["AWS Certified Developer", "Google Cloud Professional", "Scrum Master Certified"]
    };
  }
}