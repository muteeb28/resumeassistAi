# ResumeBot - AI-Powered Resume Builder & Optimizer

An intelligent resume creation and optimization platform that leverages AI to help job seekers create ATS-optimized resumes tailored to specific job descriptions.

## 🚀 Features

### Core Functionality
- **AI Resume Generation**: Create professional resumes using DeepSeek AI based on job descriptions
- **Resume Optimization**: Analyze and optimize existing resumes for better ATS compatibility
- **Multiple Templates**: Choose from various professionally designed resume templates
- **Live Resume Builder**: Interactive resume builder with real-time preview
- **File Upload Support**: Upload existing resumes in PDF, DOC, or DOCX formats
- **ATS Scoring**: Get detailed scores and suggestions for resume improvement

### Template Collection
- **Free Templates**: Deedy Resume (free to use)
- **Premium Templates**: 20+ professional templates for different industries:
  - Modern Professional, Academic CV, Creative Designer
  - Tech Specialist, Banking & Finance, Engineering Pro
  - Medical Professional, McKinsey Style, Legal Professional
  - And many more specialized templates

### AI Services
- **Resume Analysis**: Comprehensive ATS scoring with category breakdowns
- **Content Optimization**: AI-powered resume enhancement and keyword optimization
- **Job Matching**: Tailor resumes to specific job descriptions and roles

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Motion** for animations
- **React Router DOM** for navigation

### AI & Services
- **OpenAI/DeepSeek API** for resume generation and analysis
- **Custom AI Services** for optimization and scoring

### File Processing
- **PDF parsing** with pdf-parse and pdfjs-dist
- **DOCX processing** with mammoth
- **HTML to PDF conversion** with jspdf and html2canvas

### Other Dependencies
- **React Dropzone** for file uploads
- **Clsx & Tailwind Merge** for conditional styling
- **Dotenv** for environment variable management

## 📦 Installation

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resumebot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗 Project Structure

```
src/
├── components/           # React components
│   ├── 3d-pin.tsx       # 3D pin animations
│   ├── AnimatedPinDemo.tsx
│   ├── create-resume-simple.tsx  # Template selection
│   ├── live-resume-builder.tsx   # Interactive builder
│   ├── optimize-resume-page.tsx  # Resume optimization
│   ├── resume-builder.tsx        # Main builder component
│   ├── resume-preview.tsx        # Resume preview
│   └── navbar.tsx               # Navigation
├── services/            # AI and business logic services
│   ├── deepseekOptimization.ts  # Resume optimization service
│   ├── resumeAnalysis.ts        # ATS analysis service
│   └── resumeGenerator.ts       # AI resume generation
├── lib/                # Utility functions
│   └── utils.ts
├── App.tsx             # Main app component with routing
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## 🎯 Key Components

### ResumeGeneratorService (`src/services/resumeGenerator.ts`)
- Generates complete resumes using AI based on job descriptions
- Supports user data integration for personalized resumes
- Fallback handling when AI services are unavailable

### ResumeAnalysisService (`src/services/resumeAnalysis.ts`)
- Analyzes resumes for ATS compatibility
- Provides scoring across multiple categories (formatting, keywords, experience, skills)
- Offers specific improvement suggestions

### DeepSeekOptimizationService (`src/services/deepseekOptimization.ts`)
- Optimizes existing resumes for specific job roles
- Extracts and processes uploaded resume files
- Creates multiple template variations

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🔧 Configuration

### TypeScript Configuration
- `tsconfig.json` - Main TypeScript config
- `tsconfig.app.json` - App-specific config
- `tsconfig.node.json` - Node-specific config

### Vite Configuration
- Hot Module Replacement (HMR) enabled
- React plugin with TypeScript support
- Tailwind CSS integration

### ESLint Setup
- Modern ESLint configuration
- React and TypeScript specific rules
- Code quality and formatting standards

## 🌐 Routes

- `/` - Home page with animated demo
- `/optimize` - Resume optimization page
- `/create` - Template selection page
- `/build/:templateId` - Resume builder for specific template
- `/live-builder/:templateId` - Interactive live resume builder

## 🤖 AI Integration

### DeepSeek AI
- Primary AI service for resume generation
- Natural language processing for job description analysis
- Content optimization and enhancement

### OpenAI Integration
- Fallback service for optimization
- Advanced text processing capabilities
- Template generation and formatting

## 📱 Features in Detail

### Resume Templates
Each template includes:
- Unique design and layout
- Industry-specific formatting
- ATS-optimized structure
- Customizable sections

### File Processing
Supported formats:
- **PDF**: Text extraction and parsing
- **DOCX**: Microsoft Word document processing
- **TXT**: Plain text file handling

### Scoring System
ATS analysis includes:
- **Overall Score** (0-100)
- **Category Breakdown**:
  - Formatting score
  - Keywords optimization
  - Experience relevance
  - Skills assessment
- **Improvement Suggestions**

## 🚀 Getting Started for Developers

### Development Workflow
1. Fork and clone the repository
2. Set up environment variables
3. Install dependencies
4. Start development server
5. Make changes and test
6. Build and deploy

### Adding New Templates
1. Create template component in `src/components/`
2. Add template metadata to `App.tsx`
3. Implement template-specific styling
4. Test across different screen sizes

### Extending AI Services
1. Add new service class in `src/services/`
2. Implement required interfaces
3. Add error handling and fallbacks
4. Test with various inputs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Provide code examples and error messages

## 🔮 Future Enhancements

- Additional AI model integrations
- More resume templates
- Advanced analytics dashboard
- User accounts and resume storage
- API for third-party integrations
- Mobile app version
