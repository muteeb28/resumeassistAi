# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
ResumeBot is an AI-powered resume builder and optimizer that uses DeepSeek AI and OpenAI to generate ATS-optimized resumes tailored to specific job descriptions. The application is built with React 19 + TypeScript + Vite, with both a frontend application and an optional Express backend server.

## Key Commands

### Development
```powershell
npm run dev              # Start Vite dev server (port 5173)
npm run server           # Start Express backend server (port 3007)
```

### Build & Production
```powershell
npm run build            # TypeScript compile + Vite production build
npm run preview          # Preview production build locally
```

### Code Quality
```powershell
npm run lint             # Run ESLint on all TypeScript/TSX files
```

## Environment Configuration

Create a `.env` file in the project root with:
```env
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

**IMPORTANT**: All environment variables must be prefixed with `VITE_` to be accessible in the frontend (Vite requirement). API keys are used directly in browser with `dangerouslyAllowBrowser: true` flag in the OpenAI client configuration.

## Architecture

### Dual-Mode Architecture
The application operates in two modes:

1. **Frontend-Only Mode** (Primary): All AI operations run directly in the browser
   - Services instantiate OpenAI client with DeepSeek or OpenAI base URLs
   - Uses `dangerouslyAllowBrowser: true` for browser-based API calls
   - No backend required for basic resume generation

2. **Backend Mode** (Optional): Express server provides enhanced features
   - File upload/processing with multer
   - PDF generation with Puppeteer
   - Server-Sent Events (SSE) for streaming optimization progress
   - Located in `server/` directory

### Service Layer Architecture
The core business logic is separated into specialized services under `src/services/`:

#### `resumeGenerator.ts` - AI Resume Generation
- **Purpose**: Generate complete resumes from job descriptions using DeepSeek AI
- **Key Features**:
  - Accepts optional `UserData` to personalize generated resumes
  - Extracts skills from job descriptions for keyword optimization
  - Implements intelligent fallback system when AI fails
  - If user data exists, fallback uses actual user info instead of generic templates
  - Parses AI JSON responses and validates structure
- **AI Configuration**: Uses `deepseek-chat` model via OpenAI SDK with DeepSeek base URL

#### `resumeAnalysis.ts` - ATS Scoring
- **Purpose**: Analyze resumes for ATS compatibility and provide scoring
- **Key Features**:
  - Scores across 4 categories: formatting, keywords, experience, skills
  - Generates 5 actionable improvement suggestions
  - Supports PDF and DOCX file extraction (simplified for demo)
  - Can analyze against specific job descriptions for targeted feedback
- **Output**: `ATSScore` interface with overall score (0-100), category breakdown, and suggestions

#### `deepseekOptimization.ts` - Resume Optimization
- **Purpose**: Optimize existing resumes for specific target roles using OpenAI
- **Key Features**:
  - Uses OpenAI `gpt-3.5-turbo` model (not DeepSeek)
  - Extracts and enhances resume content with job-specific keywords
  - Generates 3 template variations: Professional, Executive, Creative
  - Implements fallback optimization with keyword extraction from job descriptions
  - Basic text extraction from PDF/TXT files
- **Note**: Uses OpenAI API directly with fetch, not OpenAI SDK

### Component Architecture

#### Route Structure (via React Router)
```
/ → AnimatedPinDemo (landing page)
/optimize → OptimizeResumePage (upload & optimize existing resume)
/create → CreateResumeSimple (template selection)
/build/:templateId → ResumeBuilder (form-based resume builder)
/live-builder/:templateId → LiveResumeBuilder (real-time preview builder)
```

#### Template System
- 21 resume templates defined in `App.tsx` (`ResumeBuilderWrapper`)
- Template IDs: 'deedy', 'modern', 'academic', 'creative', etc.
- Two free templates: 'deedy' and 'modern'
- Templates passed to builders via URL params and props
- Actual template rendering handled in `ResumePreview` component

#### Resume Builder Flow
1. User fills multi-step form with personal details, experience, education, skills
2. User provides job description for AI customization
3. On submit, `ResumeGeneratorService.generateResume()` is called with:
   - Job description
   - Template ID
   - User data (optional but recommended)
4. AI generates or service creates fallback `ResumeData`
5. `ResumePreview` component renders the final resume with selected template

### Data Flow Patterns

#### Resume Generation Data Transformation
```
UserData (form input) → ResumeGeneratorService → DeepSeek AI → ResumeData (structured)
```

Key interfaces:
- **`UserData`**: Raw form input (personalDetails, experiences[], education[], skills)
- **`ResumeData`**: Structured output (personalInfo, summary, experience[], education[], skills{technical, soft}, projects[], certifications[])

#### Fallback Strategy
All AI services implement fallback mechanisms:
- **Primary**: Call AI API (DeepSeek or OpenAI)
- **On Failure**: Use user-provided data if available, otherwise use generic templates
- **Enhancements**: Extract keywords from job description to improve fallback quality

### Path Aliasing
The project uses Vite path aliasing configured in `vite.config.ts`:
```typescript
'@': './src'
```
Use `@/` to import from src root (e.g., `import { utils } from '@/lib/utils'`)

## Technical Constraints

### Browser-Based AI Calls
- All AI services run in browser with API keys exposed in frontend code
- This is a known trade-off for simplicity but not production-secure
- Services use `dangerouslyAllowBrowser: true` flag to bypass OpenAI SDK warnings

### Mixed AI Providers
- **DeepSeek**: Used for resume generation and analysis (via OpenAI SDK with custom base URL)
- **OpenAI**: Used for resume optimization (direct fetch API calls)
- Both require separate API keys in environment variables

### File Processing Limitations
- `resumeAnalysis.ts` has placeholder PDF/DOCX extraction (returns sample text)
- For production file processing, use the backend server (`server/server.js`)
- Backend has enhanced file processing with actual PDF parsing

## Development Guidelines

### When Adding New Templates
1. Add template metadata to `templates` array in `App.tsx` (line 13-35)
2. Implement template rendering in `ResumePreview` component
3. Test across different screen sizes and ensure ATS compatibility
4. Update price and `isFree` flag appropriately

### When Modifying AI Services
1. Maintain backward compatibility with `UserData` and `ResumeData` interfaces
2. Always implement fallback logic for API failures
3. Keep JSON response parsing robust (extract with regex, validate structure)
4. Log extensively for debugging AI responses (`console.log` statements in place)
5. Use `temperature: 0.3-0.7` for consistent but creative outputs

### When Working with Forms
- Form state is managed locally in components (useState)
- Multi-step forms track current step with `step` state variable
- Validation is minimal - mostly client-side checks before API calls
- Experience and education are array-based with dynamic add/remove

## Important Notes

### API Key Management
- Never commit `.env` file to version control
- All environment variables must have `VITE_` prefix to be accessible in Vite apps
- API keys are visible in browser bundle - this is current architecture limitation

### TypeScript Configuration
- Project uses TypeScript 5.8+ with strict settings
- Multiple tsconfig files: `tsconfig.json` (composite), `tsconfig.app.json` (app), `tsconfig.node.json` (node/vite)
- References link app and node configs for proper IDE support

### Server Backend (Optional)
- Backend server in `server/` directory uses ES modules (`type: "module"` in package.json)
- Supports file uploads with multer to `server/uploads/` directory
- Implements SSE for streaming optimization progress
- PDF generation with Puppeteer for high-quality exports
- CORS configured for multiple localhost ports (5173-5181, 3000-3002, 4173)

### Styling System
- Tailwind CSS v4 (latest) with Vite plugin
- Motion library for animations (successor to Framer Motion)
- Custom button component with variant support
- Dark theme (black background) used throughout UI

## Common Workflows

### Testing Resume Generation Locally
1. Start dev server: `npm run dev`
2. Navigate to `/create` to select a template
3. Click template → redirects to `/build/:templateId`
4. Fill in minimal form data (at least job description)
5. Click "Generate Resume" → AI generates resume
6. Preview renders with selected template

### Testing Resume Optimization (with Backend)
1. Start backend: `npm run server`
2. Start frontend: `npm run dev`
3. Navigate to `/optimize`
4. Upload PDF/DOCX resume file
5. Enter target role and job description
6. Backend processes file and streams optimization progress via SSE
7. Frontend displays optimized resume variations

### Debugging AI Failures
1. Check browser console for detailed logs (services log extensively)
2. Verify API keys are set correctly in `.env` and prefixed with `VITE_`
3. Check network tab for API responses (DeepSeek: https://api.deepseek.com, OpenAI: https://api.openai.com)
4. Fallback mechanisms should activate automatically on API failures
5. Test fallback by using invalid API keys intentionally
