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
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-100 shadow-sm [box-shadow:inset_0_1px_2px_rgba(0,0,0,0.08)] hover:[box-shadow:inset_0_1px_2px_rgba(0,0,0,0.08),0_2px_6px_-1px_rgba(0,0,0,0.15)] transition-colors ${className ?? ''}`}
      aria-label={label ? `Skill: ${label}` : undefined}
    >
      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary-500 dark:bg-primary-400 shadow [box-shadow:0_0_0_1px_rgba(255,255,255,0.5)]" aria-hidden="true" />
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