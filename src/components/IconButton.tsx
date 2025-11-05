import React from 'react';
import { FaGithub, FaLinkedin, FaWindows, FaApple, FaLinux, FaDownload, FaGlobe, FaFirefox, FaChrome } from 'react-icons/fa';

type Platform = 'windows' | 'macos' | 'linux';
type Browser = 'firefox' | 'chrome';
type Kind = 'github' | 'linkedin' | 'download' | 'website' | 'browser';

export type IconButtonProps = {
  href?: string;
  kind?: Kind;
  platform?: Platform; // used when kind === 'download'
  browser?: Browser; // used when kind === 'browser'
  download?: boolean;
  children?: React.ReactNode;
  className?: string;
  title?: string;
  target?: string;
  rel?: string;
};

function clsx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

const baseClasses =
  'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold shadow-sm no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1';

function colorClasses(kind?: Kind, platform?: Platform, browser?: Browser): string {
  // Use brand accent ring with subtle background tint; dark mode handled by CSS variables
  if (kind === 'github') return 'app-border bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-solid)]';
  if (kind === 'linkedin') return 'app-border bg-[var(--color-surface)] text-[var(--color-primary)] hover:bg-[var(--color-surface-solid)]';
  if (kind === 'website') return 'app-border bg-[var(--color-surface)] text-sky-600 dark:text-sky-300 hover:bg-[var(--color-surface-solid)]';
  if (kind === 'browser') {
    switch (browser) {
      case 'firefox':
        return 'app-border bg-[var(--color-surface)] text-orange-600 dark:text-orange-400 hover:bg-[var(--color-surface-solid)]';
      case 'chrome':
        return 'app-border bg-[var(--color-surface)] text-blue-600 dark:text-blue-400 hover:bg-[var(--color-surface-solid)]';
      default:
        return 'app-border bg-[var(--color-surface)] text-slate-600 dark:text-slate-300 hover:bg-[var(--color-surface-solid)]';
    }
  }
  if (kind === 'download') {
    switch (platform) {
      case 'windows':
        return 'app-border bg-[var(--color-surface)] text-blue-600 dark:text-blue-300 hover:bg-[var(--color-surface-solid)]';
      case 'macos':
        return 'app-border bg-[var(--color-surface)] text-slate-800 dark:text-slate-200 hover:bg-[var(--color-surface-solid)]';
      case 'linux':
        return 'app-border bg-[var(--color-surface)] text-amber-600 dark:text-amber-400 hover:bg-[var(--color-surface-solid)]';
      default:
        return 'app-border bg-[var(--color-surface)] text-emerald-600 dark:text-emerald-400 hover:bg-[var(--color-surface-solid)]';
    }
  }
  return 'app-border bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-solid)]';
}

function pickIcon(kind?: Kind, platform?: Platform, browser?: Browser): React.ReactNode {
  if (kind === 'github') return <FaGithub aria-hidden />;
  if (kind === 'linkedin') return <FaLinkedin aria-hidden />;
  if (kind === 'website') return <FaGlobe aria-hidden />;
  if (kind === 'browser') {
    switch (browser) {
      case 'firefox':
        return <FaFirefox aria-hidden />;
      case 'chrome':
        return <FaChrome aria-hidden />;
      default:
        return <FaGlobe aria-hidden />;
    }
  }
  if (kind === 'download') {
    switch (platform) {
      case 'windows':
        return <FaWindows aria-hidden />;
      case 'macos':
        return <FaApple aria-hidden />;
      case 'linux':
        return <FaLinux aria-hidden />;
      default:
        return <FaDownload aria-hidden />;
    }
  }
  return null;
}

function defaultLabel(kind?: Kind, platform?: Platform, browser?: Browser): string {
  if (kind === 'github') return 'GitHub';
  if (kind === 'linkedin') return 'LinkedIn';
  if (kind === 'website') return 'Website';
  if (kind === 'browser') {
    if (browser === 'firefox') return 'Firefox';
    if (browser === 'chrome') return 'Chrome';
    return 'Browser';
  }
  if (kind === 'download') {
    if (platform === 'windows') return 'Download for Windows';
    if (platform === 'macos') return 'Download for macOS';
    if (platform === 'linux') return 'Download for Linux';
    return 'Download';
  }
  return 'Open';
}

/**
 * A small, brand-aware icon button meant for use in markdown-rendered content and throughout the UI.
 * Prefer using the markdown wrappers when authoring inside .md files.
 */
const IconButton: React.FC<IconButtonProps> = ({
  href,
  kind,
  platform,
  browser,
  download,
  children,
  className,
  title,
  target,
  rel,
}) => {
  const labelText = React.Children.count(children)
    ? undefined
    : defaultLabel(kind, platform, browser);

  const ariaLabel = labelText || undefined;
  const content = React.Children.count(children) ? children : labelText;

  const finalRel = rel || (target === '_blank' ? 'noreferrer noopener' : undefined);

  return (
    <a
      className={clsx('not-prose', baseClasses, colorClasses(kind, platform, browser), className)}
      href={href}
      download={download}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      target={target}
      rel={finalRel}
    >
      {pickIcon(kind, platform, browser)}
      <span className="leading-none">{content}</span>
    </a>
  );
};

// MARKDOWN WRAPPERS
// These wrappers accept html attributes from ReactMarkdown's raw HTML support.

type MarkdownAnyProps = {
  // Note: attributes from markdown come as strings; keep them permissive
  href?: string;
  className?: string;
  title?: string;
  target?: string;
  rel?: string;
  download?: string | boolean; // "" or "true" => true
  os?: Platform; // for <download os="windows" href="..."/>
  platform?: Platform; // alternative attribute name
  browser?: Browser; // for <btn kind="browser" browser="firefox" href="..."/>
  kind?: Kind;
  children?: React.ReactNode;
};

function toBool(v: string | boolean | undefined): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (v === undefined) return undefined;
  // consider empty attribute (e.g., download) as true
  const s = String(v).toLowerCase();
  if (s === '' || s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return true;
}

export const IconButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind={props.kind}
    platform={props.platform || props.os}
    browser={props.browser}
    download={toBool(props.download)}
    className={props.className}
    title={props.title}
    target={props.target}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export const GithubButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="github"
    className={props.className}
    title={props.title}
    target={props.target || '_blank'}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export const WebsiteButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="website"
    className={props.className}
    title={props.title}
    target={props.target || '_blank'}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export const LinkedInButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="linkedin"
    className={props.className}
    title={props.title}
    target={props.target || '_blank'}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export const DownloadButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="download"
    platform={props.platform || props.os}
    download={toBool(props.download) ?? true}
    className={props.className}
    title={props.title}
    target={props.target}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

// Convenience tags for platform-specific short names: <windows href="...">, <macos>, <linux>
export const WindowsButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="download"
    platform="windows"
    download={toBool(props.download) ?? true}
    className={props.className}
    title={props.title}
    target={props.target}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export const MacosButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="download"
    platform="macos"
    download={toBool(props.download) ?? true}
    className={props.className}
    title={props.title}
    target={props.target}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export const LinuxButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="download"
    platform="linux"
    download={toBool(props.download) ?? true}
    className={props.className}
    title={props.title}
    target={props.target}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

// Convenience tags for browser-specific links: <firefox href="...">, <chrome href="...">
export const FirefoxButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="browser"
    browser="firefox"
    className={props.className}
    title={props.title}
    target={props.target || '_blank'}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export const ChromeButtonMarkdown: React.FC<MarkdownAnyProps> = (props) => (
  <IconButton
    href={props.href}
    kind="browser"
    browser="chrome"
    className={props.className}
    title={props.title}
    target={props.target || '_blank'}
    rel={props.rel}
  >
    {props.children}
  </IconButton>
);

export default IconButton;
