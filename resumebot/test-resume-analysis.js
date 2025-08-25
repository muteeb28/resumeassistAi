// Test resume analysis functionality
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.VITE_DEEPSEEK_API_KEY
});

const sampleResumeText = `
John Doe
Software Engineer

EXPERIENCE:
• Software Developer at TechCorp (2020-2023)
  - Developed web applications using React and Node.js
  - Collaborated with cross-functional teams
  - Improved application performance by 20%

EDUCATION:
• Bachelor of Computer Science, University of Tech (2020)

SKILLS:
• JavaScript, React, Node.js, Python, Git
`;

const sampleJobDescription = `
We are looking for a Senior Software Engineer to join our team.

Requirements:
- 3+ years of experience in React and TypeScript
- Experience with Node.js and REST APIs
- Strong problem-solving skills
- Team collaboration experience
- Knowledge of cloud platforms (AWS/Azure)

Responsibilities:
- Build scalable web applications
- Lead technical discussions
- Mentor junior developers
- Implement best practices
`;

function buildAnalysisPrompt(resumeText, jobDescription) {
  return `
Please analyze this resume for ATS (Applicant Tracking System) compatibility and provide a detailed score breakdown.

Resume Text:
${resumeText}

Job Description to match against:
${jobDescription}

Please provide your analysis in the following JSON format:
{
  "overall": <number between 0-100>,
  "categories": {
    "formatting": <number between 0-100>,
    "keywords": <number between 0-100>,
    "experience": <number between 0-100>,
    "skills": <number between 0-100>
  },
  "suggestions": [
    "<specific improvement suggestion 1>",
    "<specific improvement suggestion 2>",
    "<specific improvement suggestion 3>",
    "<specific improvement suggestion 4>",
    "<specific improvement suggestion 5>"
  ]
}

Scoring criteria:
- Formatting (0-100): ATS-friendly structure, clear sections, consistent formatting
- Keywords (0-100): Relevant industry keywords, job-specific terms, skill mentions
- Experience (0-100): Clear work history, quantified achievements, relevant experience
- Skills (0-100): Technical skills, soft skills, certifications, relevant competencies

Overall score should be calculated based on all categories. Provide 5 specific, actionable suggestions for improvement.
`;
}

async function testResumeAnalysis() {
  console.log('🔍 Testing Resume Analysis with DeepSeek API...');
  
  try {
    const prompt = buildAnalysisPrompt(sampleResumeText, sampleJobDescription);
    
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume analyzer and ATS (Applicant Tracking System) specialist. Analyze resumes and provide detailed scoring and improvement suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const analysisResult = completion.choices[0].message.content;
    console.log('✅ DeepSeek Resume Analysis Result:');
    console.log(analysisResult);
    
    // Try to parse the JSON
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('\n📊 Parsed Analysis:');
        console.log('Overall Score:', parsed.overall);
        console.log('Categories:', parsed.categories);
        console.log('Suggestions:', parsed.suggestions);
      }
    } catch (parseError) {
      console.log('\n⚠️  JSON parsing note: Response may need formatting adjustment');
    }
    
  } catch (error) {
    console.error('❌ Resume Analysis Error:');
    console.error(error.message);
    
    if (error.message.includes('402')) {
      console.log('💳 Insufficient balance - you may need to add credits to your DeepSeek account');
      console.log('🌐 Visit: https://platform.deepseek.com/ to check your balance');
    }
  }
}

testResumeAnalysis();