import React from 'react';

type SkillBadgeProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Renders a circular skill badge used across cards and markdown content.
 */
const SkillBadge: React.FC<SkillBadgeProps> = ({ children, className }) => {
  const label = React.Children.toArray(children)
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('')
    .trim();
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ${className ?? ''}`}
      aria-label={label ? `Skill: ${label}` : undefined}
    >
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden="true" />
      <span className="text-sm font-medium leading-none tracking-tight">
        {children}
      </span>
    </span>
  );
};

export const SkillBadgeMarkdown: React.FC<SkillBadgeProps> = ({ children, className }) => (
  <SkillBadge className={className}>{children}</SkillBadge>
);

export default SkillBadge;