import React from 'react';
import AboutSection from '../components/AboutSection';
import PersonalPhoto from '../components/PersonalPhoto';
import resume from '../data/resume.json';

const About: React.FC = () => {
  const profile = (resume as any).profile as { name?: string } | undefined;
  return (
    <div className="mx-auto max-w-none px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12 max-w-none markdown-wide">
        <PersonalPhoto preset="xl" />
        <AboutSection showTitle className="flex-1" />
      </div>
    </div>
  );
};

export default About;
