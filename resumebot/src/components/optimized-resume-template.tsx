import { memo } from "react";

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
}

interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  graduationDate: string;
  gpa: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
}

interface ResumeData {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
}

interface OptimizedResumeTemplateProps {
  resumeData: ResumeData;
}

const ResumeHeader = memo(({ personalInfo }: { personalInfo: PersonalInfo }) => (
  <div className="text-center mb-2">
    <div className="text-right text-[8px] mb-2" style={{color: '#9ca3af'}}>
      Last Updated on {new Date().toLocaleDateString()}
    </div>
    <h1 className="text-[20px] font-light tracking-wide mb-2">
      {personalInfo.name ? (
        <>
          <span className="font-extralight">{personalInfo.name.split(' ')[0] || ''}</span>{' '}
          <span className="font-normal" style={{color: '#000000'}}>{personalInfo.name.split(' ').slice(1).join(' ') || ''}</span>
        </>
      ) : (
        <>
          <span className="font-extralight">YOUR</span>{' '}
          <span className="font-normal" style={{color: '#000000'}}>NAME</span>
        </>
      )}
    </h1>
    <div className="text-[8px] border-b pb-3 mb-2" style={{color: '#4b5563', borderColor: '#d1d5db'}}>
      {personalInfo.website || 'yourwebsite.com'} | {personalInfo.email || 'email@example.com'} | {personalInfo.phone || '(555) 123-4567'}
    </div>
  </div>
));

const EducationSection = memo(({ education }: { education: Education[] }) => (
  <div className="mb-4">
    <h2 className="text-[8px] font-light uppercase tracking-wide mb-2" style={{color: '#6b7280'}}>Education</h2>
    {education.filter(edu => edu.degree || edu.school).map((edu) => (
      <div key={edu.id} className="mb-2">
        <div className="font-semibold uppercase text-[8px]">{edu.school || 'University Name'}</div>
        <div className="text-[8px]" style={{color: '#374151'}}>{edu.degree || 'Degree'}</div>
        {edu.gpa && <div className="text-[8px]" style={{color: '#374151'}}>GPA: {edu.gpa}</div>}
        <div className="text-[8px]" style={{color: '#6b7280'}}>{edu.graduationDate || 'Expected Year'}</div>
        {edu.location && <div className="text-[8px]" style={{color: '#6b7280'}}>{edu.location}</div>}
      </div>
    ))}
    {education.filter(edu => edu.degree || edu.school).length === 0 && (
      <div className="mb-2">
        <div className="font-semibold uppercase text-[8px]">Your University</div>
        <div className="text-[8px]" style={{color: '#374151'}}>Your Degree</div>
        <div className="text-[8px]" style={{color: '#6b7280'}}>Expected Year</div>
        <div className="text-[8px]" style={{color: '#6b7280'}}>City, State</div>
      </div>
    )}
  </div>
));

const LinksSection = memo(({ personalInfo }: { personalInfo: PersonalInfo }) => (
  <div className="mb-4">
    <h2 className="text-[8px] font-light uppercase tracking-wide mb-2" style={{color: '#6b7280'}}>Links</h2>
    <div className="text-[8px] leading-tight space-y-2">
      {personalInfo.github && (
        <div>GitHub:// <span className="font-semibold">{personalInfo.github.replace('github.com/', '').replace('https://', '').replace('http://', '')}</span></div>
      )}
      {personalInfo.linkedin && (
        <div>LinkedIn:// <span className="font-semibold">{personalInfo.linkedin.replace('linkedin.com/in/', '').replace('https://', '').replace('http://', '')}</span></div>
      )}
      {personalInfo.website && (
        <div>Website:// <span className="font-semibold">{personalInfo.website.replace('https://', '').replace('http://', '')}</span></div>
      )}
      {!personalInfo.github && !personalInfo.linkedin && (
        <>
          <div>GitHub:// <span className="font-semibold">yourusername</span></div>
          <div>LinkedIn:// <span className="font-semibold">yourname</span></div>
        </>
      )}
    </div>
  </div>
));

const SkillsSection = memo(({ skills }: { skills: string[] }) => (
  <div className="mb-4">
    <h2 className="text-[8px] font-light uppercase tracking-wide mb-4" style={{color: '#6b7280'}}>Skills</h2>
    <div>
      <div className="font-semibold text-[8px] mb-2">Programming</div>
      <div className="text-[8px] leading-tight">
        {skills.length > 0 ? (
          <>
            <div><span className="font-semibold">Proficient:</span></div>
            <div>{skills.slice(0, 4).join(' • ')}</div>
            {skills.length > 4 && (
              <>
                <div className="mt-2"><span className="font-semibold">Familiar:</span></div>
                <div>{skills.slice(4).join(' • ')}</div>
              </>
            )}
          </>
        ) : (
          <>
            <div><span className="font-semibold">Over 5000 lines:</span></div>
            <div>Java • Shell • Python • Javascript</div>
            <div>OCaml • Matlab • Rails • LaTeX</div>
            <div className="mt-2"><span className="font-semibold">Over 1000 lines:</span></div>
            <div>C • C++ • CSS • PHP • Assembly</div>
            <div className="mt-2"><span className="font-semibold">Familiar:</span></div>
            <div>AS3 • iOS • Android • MySQL</div>
          </>
        )}
      </div>
    </div>
  </div>
));

const ExperienceSection = memo(({ experiences }: { experiences: Experience[] }) => (
  <div className="mb-4">
    <h2 className="text-[8px] font-light uppercase tracking-wide mb-2" style={{color: '#6b7280'}}>Experience</h2>
    
    {experiences.filter(exp => exp.title || exp.company).map((exp) => (
      <div key={exp.id} className="mb-2">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-semibold uppercase text-[8px]">{exp.company || 'Company'}</span>
            <span className="text-[8px]" style={{color: '#374151'}}> | {exp.title || 'Position'}</span>
          </div>
          <span className="text-[8px]" style={{color: '#6b7280'}}>
            {exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : 
             exp.startDate ? `${exp.startDate} – Present` : 'Date Range'}
          </span>
        </div>
        {exp.location && <div className="text-[8px] italic" style={{color: '#6b7280'}}>{exp.location}</div>}
        <div className="text-[8px] leading-tight mt-2" style={{color: '#4b5563'}}>
          {exp.description.filter(desc => desc.trim()).map((desc, i) => (
            <span key={i}>• {desc}{i < exp.description.filter(desc => desc.trim()).length - 1 ? <br /> : ''}</span>
          ))}
          {exp.description.filter(desc => desc.trim()).length === 0 && '• Add your job description here'}
        </div>
      </div>
    ))}

    {experiences.filter(exp => exp.title || exp.company).length === 0 && (
      <div className="mb-2">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-semibold uppercase text-[8px]">Your Company</span>
            <span className="text-[8px]" style={{color: '#374151'}}> | Your Position</span>
          </div>
          <span className="text-[8px]" style={{color: '#6b7280'}}>Date Range</span>
        </div>
        <div className="text-[8px] italic" style={{color: '#6b7280'}}>Location</div>
        <div className="text-[8px] leading-tight mt-2" style={{color: '#4b5563'}}>
          • Add your experience details here
        </div>
      </div>
    )}
  </div>
));

const ProjectsSection = memo(({ projects }: { projects: Project[] }) => (
  <div className="mb-4">
    <h2 className="text-[8px] font-light uppercase tracking-wide mb-2" style={{color: '#6b7280'}}>Projects</h2>
    
    {projects.filter(project => project.name || project.description).map((project) => (
      <div key={project.id} className="mb-4">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-semibold uppercase text-[8px]">{project.name || 'Project Name'}</span>
            {project.technologies && <span className="text-[8px]" style={{color: '#374151'}}> | {project.technologies}</span>}
          </div>
          {project.link && (
            <span className="text-[8px]" style={{color: '#6b7280'}}>{project.link.replace('https://', '').replace('http://', '')}</span>
          )}
        </div>
        <div className="text-[8px] leading-tight mt-2" style={{color: '#4b5563'}}>
          {project.description || 'Project description goes here'}
        </div>
      </div>
    ))}

    {projects.filter(project => project.name || project.description).length === 0 && (
      <div className="mb-4">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="font-semibold uppercase text-[8px]">Your Project</span>
            <span className="text-[8px]" style={{color: '#374151'}}> | Technologies Used</span>
          </div>
        </div>
        <div className="text-[8px] leading-tight mt-2" style={{color: '#4b5563'}}>
          Project description and achievements go here
        </div>
      </div>
    )}
  </div>
));

export const OptimizedResumeTemplate = memo(({ resumeData }: OptimizedResumeTemplateProps) => (
  <>
    <ResumeHeader personalInfo={resumeData.personalInfo} />
    
    <div className="flex gap-3 text-[8px]" style={{height: 'calc(100% - 120px)'}}>
      {/* Left Column */}
      <div style={{width: '240px', flexShrink: 0}}>
        <EducationSection education={resumeData.education} />
        <LinksSection personalInfo={resumeData.personalInfo} />
        <div className="mb-4">
          <h2 className="text-[8px] font-light uppercase tracking-wide mb-2" style={{color: '#6b7280'}}>Coursework</h2>
          <div className="text-[8px] leading-tight">
            <div className="mb-2">
              <div className="font-semibold">Graduate</div>
              <div>Advanced Machine Learning</div>
              <div>Open Source Software Engineering</div>
              <div>Advanced Interactive Graphics</div>
              <div>Data Mining • Computer Vision</div>
            </div>
            <div>
              <div className="font-semibold">Undergraduate</div>
              <div>Information Retrieval</div>
              <div>Machine Learning</div>
              <div>Computer Graphics • Computer Vision</div>
              <div>Artificial Intelligence • Robotics</div>
              <div>Image Processing</div>
              <div>Computational Photography</div>
            </div>
          </div>
        </div>
        <SkillsSection skills={resumeData.skills} />
      </div>

      {/* Right Column */}
      <div style={{flex: 1, minWidth: 0}}>
        <ExperienceSection experiences={resumeData.experiences} />
        <ProjectsSection projects={resumeData.projects} />
      </div>
    </div>
  </>
));