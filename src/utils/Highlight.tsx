import React from 'react';

export type HighlightProps = {
  title?: string;
  shadow?: boolean;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Highlight box for markdown usage.
 * - Blue border (light/dark aware)
 * - Subtle blue-tinted background (light darker in light mode, lighter in dark mode)
 * - Optional shadow via `shadow` prop or presence of `shadow` attribute in markdown
 * - Optional `title` rendered overlapping the border (legend-like), masking the border behind the text
 */
export const Highlight: React.FC<HighlightProps> = ({ title, shadow, className, children }) => {
  const base = [
    'relative rounded-lg border',
    'border-blue-300 dark:border-blue-500',
    // Light: a bit darker than white; Dark: a bit lighter than default dark bg
    'bg-blue-50 dark:bg-blue-900/30',
    'p-4',
  ];
  if (shadow) base.push('shadow-md');

  return (
    <div className={[...base, className ?? ''].filter(Boolean).join(' ')}>
      {title ? (
        <div
          className={[
            'absolute -top-3 left-4 px-2',
            'text-xs sm:text-sm font-semibold',
            'text-blue-800 dark:text-blue-300',
            // Use the page background to "cut" through the border line
            'bg-[var(--color-bg)]',
          ].join(' ')}
        >
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
};

// Adapter used by ReactMarkdown custom component mapping
export const HighlightMarkdown = (props: any) => {
  // Treat presence of attribute as truthy (e.g., <highlight shadow>)
  const hasAttr = (v: any) => v !== undefined && v !== null && v !== false && v !== 'false';
  const node = props.node as any;
  const title = props.title ?? node?.properties?.title;
  const shadow = hasAttr(props.shadow ?? node?.properties?.shadow);
  const className = props.className ?? node?.properties?.className;
  return (
    <Highlight title={title as string | undefined} shadow={shadow} className={className}>
      {props.children}
    </Highlight>
  );
};

export default Highlight;
