import React from 'react';
import { FaGithub, FaLinkedin, FaWindows, FaApple, FaLinux, FaDownload } from 'react-icons/fa';

type Platform = 'windows' | 'macos' | 'linux';
type Kind = 'github' | 'linkedin' | 'download';

export type IconButtonProps = {
  href?: string;
  kind?: Kind;
  platform?: Platform; // used when kind === 'download'
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
  'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold shadow-sm no-underline transition-colors';

function colorClasses(kind?: Kind, platform?: Platform): string {
  switch (kind) {
    case 'github':
      return 'border-slate-800 text-slate-800 bg-white hover:bg-slate-50';
    case 'linkedin':
      return 'border-sky-600 text-sky-700 bg-white hover:bg-sky-50';
    case 'download':
      switch (platform) {
        case 'windows':
          return 'border-blue-600 text-blue-700 bg-white hover:bg-blue-50';
        case 'macos':
          return 'border-zinc-800 text-zinc-900 bg-white hover:bg-zinc-50';
        case 'linux':
          return 'border-amber-600 text-amber-700 bg-white hover:bg-amber-50';
        default:
          return 'border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50';
      }
    default:
      return 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50';
  }
}

function pickIcon(kind?: Kind, platform?: Platform): React.ReactNode {
  if (kind === 'github') return <FaGithub aria-hidden />;
  if (kind === 'linkedin') return <FaLinkedin aria-hidden />;
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

function defaultLabel(kind?: Kind, platform?: Platform): string {
  if (kind === 'github') return 'GitHub';
  if (kind === 'linkedin') return 'LinkedIn';
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
  download,
  children,
  className,
  title,
  target,
  rel,
}) => {
  const labelText = React.Children.count(children)
    ? undefined
    : defaultLabel(kind, platform);

  const ariaLabel = labelText || undefined;
  const content = React.Children.count(children) ? children : labelText;

  const finalRel = rel || (target === '_blank' ? 'noreferrer noopener' : undefined);

  return (
    <a
      className={clsx('not-prose', baseClasses, colorClasses(kind, platform), className)}
      href={href}
      download={download}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      target={target}
      rel={finalRel}
    >
      {pickIcon(kind, platform)}
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

export default IconButton;
