import React from 'react';

interface ResumePageProps {
  className?: string;
  children: React.ReactNode;
}

const ResumePage: React.FC<ResumePageProps> = ({ className = '', children }) => (
  <div className={`resume-page pdf-friendly ${className}`.trim()}>
    {children}
  </div>
);

export default ResumePage;
