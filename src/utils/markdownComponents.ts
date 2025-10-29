import React from 'react';
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
} from '../components/IconButton';
import { FaEnvelope } from 'react-icons/fa';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import resumeData from '../data/RESUME.json';
import ReactMarkdown from 'react-markdown';
import { HighlightMarkdown } from './Highlight';

export type MarkdownComponents = Parameters<typeof ReactMarkdown>[0]['components'];

export function createMarkdownComponents(originPath: string): MarkdownComponents {
	const components: any = {
		// <webm src="./clip.webm" max-width="720px" autoplay auto-loop controls>
		// Embeds a responsive .webm/.mp4 video with optional autoplay/loop and adjustable max width.
		// Supports start (in seconds): <webm src="..." start="2.5" />
		webm: (props: any) => {
			const node = props.node as any;
			const srcAttr = props.src ?? node?.properties?.src;
			const styleAttr = node?.properties?.style ?? props.style;
			const widthAttr = props.width ?? node?.properties?.width; // may be numeric or css unit
			const maxWidthAttr = (props['max-width'] ?? props.maxWidth ?? node?.properties?.['max-width'] ?? node?.properties?.maxWidth) as any;
			const autoplayAttr = props.autoplay ?? node?.properties?.autoplay;
			const loopAttr = (props['auto-loop'] ?? props.autoloop ?? props.loop ?? node?.properties?.['auto-loop'] ?? node?.properties?.autoloop ?? node?.properties?.loop) as any;
			const controlsAttr = props.controls ?? node?.properties?.controls;
            const posterAttr = props.poster ?? node?.properties?.poster; // optional poster image
            const preloadAttr = props.preload ?? node?.properties?.preload; // allow override
            const startAttr = props.start ?? node?.properties?.start; // optional start time in seconds

            const resolved = resolveMarkdownVideo(originPath, srcAttr as string | undefined) || srcAttr;
            const variants = resolveVideoVariants(originPath, srcAttr as string | undefined);
            const poster = posterAttr ? resolveMarkdownImage(originPath, String(posterAttr)) || String(posterAttr) : undefined;

			if (!resolved) {
				return React.createElement('div', { className: 'not-prose text-red-600 text-sm' }, 'Video source not found');
			}

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
			const maxWidth = normalizeSize(maxWidthAttr ?? parsedStyle?.maxWidth ?? widthAttr ?? parsedStyle?.width);

			// Determine booleans: presence of attribute (even empty) should enable the feature
			const hasAttr = (v: any) => v !== undefined && v !== null && v !== false && v !== 'false';
			const autoplay = hasAttr(autoplayAttr);
			const loop = hasAttr(loopAttr);
			// Default to showing controls (with progress bar) unless explicitly set to false
			const controls = !(controlsAttr === false || controlsAttr === 'false');

			const containerStyle: Record<string, any> = {
				...(parsedStyle as Record<string, any>),
				width: '100%',
				...(maxWidth ? { maxWidth } : {}),
			};

			// For autoplay to work across browsers, set muted and playsInline
			const videoProps: Record<string, any> = {
				controls,
				loop,
				autoPlay: autoplay,
				muted: autoplay ? true : undefined,
				playsInline: true,
                preload: preloadAttr ?? 'metadata',
                poster,
				className: 'w-full h-auto rounded-md',
			};

            // Parse start time (seconds)
            const parseStartSeconds = (val: any): number | undefined => {
                if (val == null) return undefined;
                const n = Number(val);
                return Number.isFinite(n) && n >= 0 ? n : undefined;
            };
            const startSec = parseStartSeconds(startAttr);

            // Build <source> list preferring MP4 for Safari
            const sources: Array<Record<string, any>> = [];
            if (variants.mp4Min) sources.push({ src: variants.mp4Min, type: 'video/mp4' });
            if (variants.mp4) sources.push({ src: variants.mp4, type: 'video/mp4' });
            // Also include resolved (legacy) if it's an mp4 url
            if (typeof resolved === 'string' && /\.mp4($|\?)/i.test(String(resolved))) {
                sources.push({ src: resolved as string, type: 'video/mp4' });
            }
            if (variants.webmMin) sources.push({ src: variants.webmMin, type: 'video/webm' });
            if (variants.webm) sources.push({ src: variants.webm, type: 'video/webm' });
            // Finally include the original resolved (legacy) if it's webm and not already included
            if (typeof resolved === 'string' && /\.webm($|\?)/i.test(String(resolved))) {
                const already = sources.some((s) => s.src === resolved);
                if (!already) sources.push({ src: resolved as string, type: 'video/webm' });
            }

			return React.createElement(
				'div',
				{ className: 'not-prose w-full', style: containerStyle },
                [
                    React.createElement(
                        'video',
						{
							key: 'v',
							...videoProps,
							onLoadedMetadata: startSec != null ? (e: any) => {
								try {
									const v = e.currentTarget as HTMLVideoElement;
									if (v && v.readyState >= 1) v.currentTime = startSec;
								} catch {}
							} : undefined,
						},
                        sources.length
                            ? sources.map((s, i) => React.createElement('source', { key: `src-${i}`, ...s }))
                            : undefined,
                    ),
                ],
			);
		},
		skill: SkillBadgeMarkdown,
		youtube: YouTubeEmbedMarkdown,
		btn: IconButtonMarkdown,
		github: GithubButtonMarkdown,
		website: WebsiteButtonMarkdown,
		linkedin: LinkedInButtonMarkdown,
		download: DownloadButtonMarkdown,
		windows: WindowsButtonMarkdown,
		macos: MacosButtonMarkdown,
		linux: LinuxButtonMarkdown,
		// <highlight title="Optional" shadow>Content</highlight>
		highlight: HighlightMarkdown,
		// <email href="custom@domain.com">Label</email>
		email: (props: any) => {
			const profileEmail: string | undefined = (resumeData as any)?.profile?.email;
			const rawHref: string | undefined = props.href || props['data-href'];
			const email = rawHref || profileEmail || '';
			const mailto = email ? (email.startsWith('mailto:') ? email : `mailto:${email}`) : undefined;
			const children = props.children || 'Email Me';
			return React.createElement(
				'a',
				{
					href: mailto,
					className:
						'not-prose inline-flex items-center gap-2 rounded-md border app-border px-3 py-1.5 text-sm font-semibold shadow-sm no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 bg-[var(--color-surface)] text-[var(--color-primary)] hover:bg-[var(--color-surface-solid)]',
				},
				[
					React.createElement(FaEnvelope, { 'aria-hidden': true, key: 'icon' }),
					React.createElement('span', { className: 'leading-none', key: 'label' }, children),
				],
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
				...(explicitHeight ? { maxHeight: explicitHeight } : {}),
			};
			const className = hasExplicitSize ? 'w-full h-auto rounded-md' : 'max-w-full h-auto rounded-md';
			return React.createElement('img', { src: resolved, alt: alt as string | undefined, className, style });
		},
	};
	return components as MarkdownComponents;
}

export function useMarkdownComponents(originPath: string): MarkdownComponents {
	return React.useMemo(() => createMarkdownComponents(originPath), [originPath]);
}
