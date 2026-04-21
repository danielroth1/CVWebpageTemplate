/**
 * AsciidocRenderer – renders an HTML string (produced by asciidocLoader.ts)
 * as React elements, mapping the same custom tags that Markdown uses to the
 * exact same React components.
 *
 * Custom tag support (identical to Markdown):
 *   <skill>React</skill>
 *   <youtube id="..." title="..." width="...">
 *   <webm src="..." max-width="..." autoplay auto-loop start="...">
 *   <github href="...">Label</github>
 *   <download href="...">Label</download>
 *   <linux|windows|macos|firefox|chrome|website|linkedin href="...">Label</…>
 *   <btn href="..." icon="...">Label</btn>
 *   <email href="...">Label</email>
 *   <highlight title="..." shadow>Content</highlight>
 *   <img src="./relative.png" width="..." height="...">
 *
 * Images and videos are resolved relative to the originPath using the same
 * resolvers used by the Markdown pipeline.
 */

import React from 'react';
import parse, { type DOMNode, type Element, domToReact } from 'html-react-parser';
import resolveMarkdownImage from './markdownImageResolver';
import resolveMarkdownVideo, { resolveVideoVariants } from './markdownVideoResolver';
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
  WebsiteButtonMarkdown,
  FirefoxButtonMarkdown,
  ChromeButtonMarkdown,
} from '../components/IconButton';
import { FaEnvelope } from 'react-icons/fa';
import resumeData from '../data/resume.json';
import { HighlightMarkdown } from './Highlight';
import { DotGraphMarkdown } from '../components/DotGraph';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isElement(node: DOMNode): node is Element {
  return (node as any).type === 'tag';
}

function parseStyleString(s: string | undefined): Record<string, string> {
  if (!s || typeof s !== 'string') return {};
  return s.split(';').reduce(
    (acc: Record<string, string>, part) => {
      const idx = part.indexOf(':');
      if (idx === -1) return acc;
      const k = part.slice(0, idx).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const v = part.slice(idx + 1).trim();
      if (k && v) acc[k] = v;
      return acc;
    },
    {},
  );
}

function normalizeSize(val: string | number | undefined): string | undefined {
  if (val == null) return undefined;
  const asNum = Number(val);
  if (!Number.isNaN(asNum) && String(val).trim() !== '') return `${asNum}px`;
  return String(val);
}

function hasAttr(v: any): boolean {
  return v !== undefined && v !== null && v !== false && v !== 'false';
}

// ---------------------------------------------------------------------------
// Replace function factory
// ---------------------------------------------------------------------------

type ReplaceReturn = React.ReactElement | false | undefined;

function createReplace(originPath: string): (node: DOMNode) => ReplaceReturn {
  function replace(node: DOMNode): ReplaceReturn {
    if (!isElement(node)) return undefined;
    const el = node as Element;
    const tag = el.name?.toLowerCase() ?? '';
    const a = el.attribs ?? {};
    // children as React nodes, recursing through the same replace function
    const children =
      el.children && el.children.length > 0
        ? domToReact(el.children as DOMNode[], { replace })
        : undefined;

    switch (tag) {
      case 'skill': {
        const skillChildren = children ?? a['text'] ?? '';
        return React.createElement(SkillBadgeMarkdown, { ...a, key: undefined, children: skillChildren });
      }

      case 'youtube':
        return React.createElement(YouTubeEmbedMarkdown, { ...a, key: undefined });

      case 'webm': {
        const src = a.src ?? '';
        const styleAttr = a.style;
        const maxWidthAttr = a['max-width'] ?? a['maxwidth'];
        const widthAttr = a.width;
        const autoplayAttr = a.autoplay;
        const loopAttr = a['auto-loop'] ?? a.autoloop ?? a.loop;
        const controlsAttr = a.controls;
        const posterAttr = a.poster;
        const preloadAttr = a.preload;
        const startAttr = a.start;

        const resolved = resolveMarkdownVideo(originPath, src) || src;
        const variants = resolveVideoVariants(originPath, src);
        const poster = posterAttr
          ? resolveMarkdownImage(originPath, posterAttr) || posterAttr
          : undefined;

        if (!resolved) {
          return React.createElement('div', { className: 'not-prose text-red-600 text-sm' }, 'Video source not found');
        }

        const parsedStyle = parseStyleString(styleAttr);
        const maxWidth = normalizeSize(maxWidthAttr ?? parsedStyle.maxWidth ?? widthAttr ?? parsedStyle.width);

        const autoplay = hasAttr(autoplayAttr);
        const loop = hasAttr(loopAttr);
        const controls = !(controlsAttr === 'false');

        const containerStyle: Record<string, any> = {
          ...parsedStyle,
          width: '100%',
          ...(maxWidth ? { maxWidth } : {}),
        };

        const parseStartSeconds = (val: any): number | undefined => {
          if (val == null) return undefined;
          const n = Number(val);
          return Number.isFinite(n) && n >= 0 ? n : undefined;
        };
        const startSec = parseStartSeconds(startAttr);

        const sources: Array<{ src: string; type: string }> = [];
        if (variants.mp4Min) sources.push({ src: variants.mp4Min, type: 'video/mp4' });
        if (variants.mp4) sources.push({ src: variants.mp4, type: 'video/mp4' });
        if (typeof resolved === 'string' && /\.mp4($|\?)/i.test(resolved))
          sources.push({ src: resolved, type: 'video/mp4' });
        if (variants.webmMin) sources.push({ src: variants.webmMin, type: 'video/webm' });
        if (variants.webm) sources.push({ src: variants.webm, type: 'video/webm' });
        if (typeof resolved === 'string' && /\.webm($|\?)/i.test(resolved)) {
          if (!sources.some((s) => s.src === resolved)) sources.push({ src: resolved, type: 'video/webm' });
        }

        return React.createElement(
          'div',
          { className: 'not-prose w-full', style: containerStyle },
          React.createElement(
            'video',
            {
              controls,
              loop,
              autoPlay: autoplay,
              muted: autoplay ? true : undefined,
              playsInline: true,
              preload: preloadAttr ?? 'metadata',
              poster,
              className: 'w-full h-auto rounded-md',
              onLoadedMetadata:
                startSec != null
                  ? (e: React.SyntheticEvent<HTMLVideoElement>) => {
                      try {
                        const v = e.currentTarget as HTMLVideoElement;
                        if (v && v.readyState >= 1) v.currentTime = startSec;
                      } catch {}
                    }
                  : undefined,
            },
            sources.map((s, i) => React.createElement('source', { key: i, src: s.src, type: s.type })),
          ),
        );
      }

      case 'github':
        return React.createElement(GithubButtonMarkdown, { ...a, key: undefined }, children);
      case 'download':
        return React.createElement(DownloadButtonMarkdown, { ...a, key: undefined }, children);
      case 'linux':
        return React.createElement(LinuxButtonMarkdown, { ...a, key: undefined }, children);
      case 'windows':
        return React.createElement(WindowsButtonMarkdown, { ...a, key: undefined }, children);
      case 'macos':
        return React.createElement(MacosButtonMarkdown, { ...a, key: undefined }, children);
      case 'firefox':
        return React.createElement(FirefoxButtonMarkdown, { ...a, key: undefined }, children);
      case 'chrome':
        return React.createElement(ChromeButtonMarkdown, { ...a, key: undefined }, children);
      case 'website':
        return React.createElement(WebsiteButtonMarkdown, { ...a, key: undefined }, children);
      case 'linkedin':
        return React.createElement(LinkedInButtonMarkdown, { ...a, key: undefined }, children);
      case 'btn':
        return React.createElement(IconButtonMarkdown, { ...a, key: undefined }, children);

      case 'email': {
        const profileEmail: string | undefined = (resumeData as any)?.profile?.email;
        const rawHref = a.href ?? a['data-href'];
        const email = rawHref || profileEmail || '';
        const mailto = email ? (email.startsWith('mailto:') ? email : `mailto:${email}`) : undefined;
        return React.createElement(
          'a',
          {
            href: mailto,
            className:
              'not-prose inline-flex items-center gap-2 rounded-md border app-border px-3 py-1.5 text-sm font-semibold shadow-sm no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 bg-[var(--color-surface)] text-[var(--color-primary)] hover:bg-[var(--color-surface-solid)]',
          },
          React.createElement(FaEnvelope, { 'aria-hidden': true, key: 'icon' }),
          React.createElement('span', { className: 'leading-none', key: 'label' }, children ?? 'Email Me'),
        );
      }

      case 'highlight':
        return React.createElement(HighlightMarkdown, { ...a, key: undefined }, children);

      case 'dot-graph':
        return React.createElement(DotGraphMarkdown, { ...a, key: undefined } as any);

      case 'img': {
        const src = a.src;
        const resolved = resolveMarkdownImage(originPath, src) || src;
        const parsedStyle = parseStyleString(a.style);
        const explicitWidth = normalizeSize(a.width ?? parsedStyle.width);
        const explicitHeight = normalizeSize(a.height ?? parsedStyle.height);
        const hasExplicitSize = !!(explicitWidth || explicitHeight);
        const style: Record<string, any> = {
          ...parsedStyle,
          ...(hasExplicitSize ? { width: '100%' } : {}),
          ...(explicitWidth ? { maxWidth: explicitWidth } : {}),
          ...(explicitHeight ? { maxHeight: explicitHeight } : {}),
        };
        const className = hasExplicitSize ? 'w-full h-auto rounded-md' : 'max-w-full h-auto rounded-md';
        return React.createElement('img', { ...a, src: resolved, className, style });
      }

      default:
        return undefined;
    }
  }
  return replace;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type AsciidocRendererProps = {
  html: string;
  originPath?: string;
  className?: string;
};

/**
 * Renders an HTML string produced by asciidocLoader into React,
 * mapping custom tags to their corresponding components.
 */
const AsciidocRenderer: React.FC<AsciidocRendererProps> = ({ html, originPath = '', className }) => {
  const replace = React.useMemo(() => createReplace(originPath), [originPath]);
  const content = React.useMemo(() => parse(html, { replace }), [html, replace]);

  return React.createElement(
    'div',
    { className: className ?? '' },
    content,
  );
};

export default AsciidocRenderer;
