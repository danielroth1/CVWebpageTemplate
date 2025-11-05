import React from 'react';
import resolveMarkdownImage from './markdownImageResolver';
import { SkillBadgeMarkdown } from '../components/SkillBadge';
import { YouTubeEmbedMarkdown } from '../components/YouTubeEmbed';
import {
  DownloadButtonMarkdown,
  GithubButtonMarkdown,
  IconButtonMarkdown,
  LinkedInButtonMarkdown,
  WindowsButtonMarkdown,
  MacosButtonMarkdown,
  LinuxButtonMarkdown,
  FirefoxButtonMarkdown,
  ChromeButtonMarkdown,
} from '../components/IconButton';
import { FaEnvelope } from 'react-icons/fa';
import resumeData from '../data/resume.json';
import ReactMarkdown from 'react-markdown';
import { HighlightMarkdown } from './Highlight';

export type MarkdownComponents = Parameters<typeof ReactMarkdown>[0]['components'];

export function createMarkdownComponents(originPath: string): MarkdownComponents {
  const components: any = {
    skill: SkillBadgeMarkdown,
    youtube: YouTubeEmbedMarkdown,
    btn: IconButtonMarkdown,
    github: GithubButtonMarkdown,
    linkedin: LinkedInButtonMarkdown,
    download: DownloadButtonMarkdown,
    windows: WindowsButtonMarkdown,
    macos: MacosButtonMarkdown,
    linux: LinuxButtonMarkdown,
    firefox: FirefoxButtonMarkdown,
    chrome: ChromeButtonMarkdown,
    // <highlight title="Optional" shadow>Content</highlight>
    highlight: HighlightMarkdown,
    // <email href="custom@domain.com">Label</email>
    // If no href provided, defaults to mailto: of resume profile email.
    email: (props: any) => {
      const profileEmail: string | undefined = (resumeData as any)?.profile?.email;
      const rawHref: string | undefined = props.href || props['data-href'];
      const email = rawHref || profileEmail || '';
      const mailto = email ? (email.startsWith('mailto:') ? email : `mailto:${email}`) : undefined;
      const children = props.children || 'Email Me';
      return (
        <a
          href={mailto}
          className="not-prose inline-flex items-center gap-2 rounded-md border app-border px-3 py-1.5 text-sm font-semibold shadow-sm no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 bg-[var(--color-surface)] text-[var(--color-primary)] hover:bg-[var(--color-surface-solid)]"
          target={undefined}
          rel={undefined}
        >
          <FaEnvelope aria-hidden />
          <span className="leading-none">{children}</span>
        </a>
      );
    },
    img: (props: any) => {
      const node = props.node as any;
      const srcAttr = props.src ?? node?.properties?.src;
      const alt = props.alt ?? node?.properties?.alt;
      const widthAttr = props.width ?? node?.properties?.width;
      const heightAttr = props.height ?? node?.properties?.height;
      const styleAttr = node?.properties?.style ?? props.style;
      const resolved = resolveMarkdownImage(originPath, srcAttr as string | undefined) || srcAttr;

      const parseStyle = (s: string | undefined) => {
        if (!s || typeof s !== 'string') return undefined;
        return s.split(';').reduce((acc: Record<string, string>, part) => {
          const [k, v] = part.split(':');
          if (!k || !v) return acc;
          const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          acc[key] = v.trim();
          return acc;
        }, {} as Record<string, string>);
      };
      const parsedStyle = parseStyle(styleAttr);
      const normalizeSize = (val: any) => {
        if (val == null) return undefined;
        const asNum = Number(val);
        if (!Number.isNaN(asNum) && String(val).trim() !== '') return `${asNum}px`;
        return String(val);
      };
      const explicitWidth = normalizeSize(widthAttr ?? parsedStyle?.width);
      const explicitHeight = normalizeSize(heightAttr ?? parsedStyle?.height);
      const hasExplicitSize = !!(explicitWidth || explicitHeight);
      const style: Record<string, any> = {
        ...(parsedStyle as Record<string, any>),
        ...(hasExplicitSize ? { width: '100%' } : {}),
        ...(explicitWidth ? { maxWidth: explicitWidth } : {}),
        ...(explicitHeight ? { height: explicitHeight } : {}),
      };
      const className = hasExplicitSize ? 'w-full h-auto rounded-md' : 'max-w-full h-auto rounded-md';
      return <img src={resolved} alt={alt as string | undefined} className={className} style={style} />;
    },
  };
  return components as MarkdownComponents;
}

export function useMarkdownComponents(originPath: string): MarkdownComponents {
  return React.useMemo(() => createMarkdownComponents(originPath), [originPath]);
}
