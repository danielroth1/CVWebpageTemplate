import React, { useEffect, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FaSearchPlus, FaSearchMinus, FaExpand, FaTimes } from 'react-icons/fa';

// Singleton promise — load Graphviz WASM once and reuse
let _vizPromise: Promise<{ renderString: (src: string, opts: Record<string, string>) => string }> | null = null;

function getViz() {
  if (!_vizPromise) {
    _vizPromise = import('@viz-js/viz').then((m) => m.instance() as any);
  }
  return _vizPromise;
}

function decodeDotSrc(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return encoded;
  }
}

/** Remove the XML declaration and DOCTYPE preamble graphviz prepends, and strip
 *  explicit pt-based width/height from the root svg element so the viewBox
 *  controls sizing and CSS can make it responsive. */
function makeResponsiveSvg(svgStr: string): string {
  let s = svgStr
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<!DOCTYPE[^>]*>\s*/g, '')
    .trim();
  // Strip "pt" unit from width/height so the browser uses them as px values.
  // Keeping numeric dimensions lets the browser size the SVG correctly and
  // allows centerOnInit to measure the content. CSS then scales it as needed.
  s = s.replace(/(<svg\b[^>]*?)\s+width="([0-9.]+)pt"\s+height="([0-9.]+)pt"/, '$1 width="$2" height="$3"');
  return s;
}

// ---------------------------------------------------------------------------
// Full-screen lightbox with pan / zoom
// ---------------------------------------------------------------------------

interface LightboxProps {
  svg: string;
  caption?: string;
  onClose: () => void;
}

function DotGraphLightbox({ svg, caption, onClose }: LightboxProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? 'Graph diagram'}
    >
      {/* toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-[var(--color-text)] font-medium truncate">
          {caption ?? 'Graph diagram'}
        </span>
        <button
          onClick={onClose}
          className="ml-4 p-1.5 rounded hover:bg-[var(--color-surface-solid)] text-[var(--color-text)] transition-colors"
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>

      {/* pan/zoom canvas */}
      <div className="overflow-hidden relative" style={{ flex: '1 1 0', minHeight: 0 }} onClick={(e) => e.stopPropagation()}>
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={10}
          wheel={{ step: 0.0025 }}
          centerOnInit
          limitToBounds={false}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* zoom controls */}
              <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                {[
                  { icon: <FaSearchPlus />, action: () => zoomIn(), label: 'Zoom in' },
                  { icon: <FaSearchMinus />, action: () => zoomOut(), label: 'Zoom out' },
                  { icon: <FaExpand />, action: () => resetTransform(), label: 'Reset' },
                ].map(({ icon, action, label }) => (
                  <button
                    key={label}
                    onClick={action}
                    aria-label={label}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] shadow hover:bg-[var(--color-surface-solid)] transition-colors"
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%', overflow: 'hidden', cursor: 'grab' }}
                contentStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div
                  className="dot-graph-svg dot-graph-lightbox"
                  // SVG produced by viz.js (Graphviz WASM) from author-supplied DOT — not user input
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* hint */}
      <div className="shrink-0 py-1.5 text-center text-xs text-white/50 select-none pointer-events-none">
        Scroll to zoom · Drag to pan · Esc to close
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface DotGraphProps {
  src: string;            // base64-encoded DOT source (set by the block processor)
  caption?: string;       // optional figure caption
  'max-width'?: string;   // max pixel width, e.g. "700" or "700px"
  align?: string;         // "left" | "right" | default center
  engine?: string;        // graphviz layout engine: dot|neato|fdp|sfdp|circo|twopi
}

export function DotGraphMarkdown({
  src,
  caption,
  'max-width': maxWidth,
  align,
  engine = 'dot',
}: DotGraphProps) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const dot = decodeDotSrc(src);
    getViz()
      .then((viz) => {
        if (!cancelled) setSvg(makeResponsiveSvg(viz.renderString(dot, { format: 'svg', engine })));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => { cancelled = true; };
  }, [src, engine]);

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  if (error) {
    return (
      <div className="text-sm p-2 rounded border border-red-400 text-red-600 dark:border-red-600 dark:text-red-400">
        Graph render error: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="text-sm text-[var(--color-muted)] p-4 text-center animate-pulse">
        Rendering graph…
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {};
  if (maxWidth) containerStyle.maxWidth = /^\d+$/.test(maxWidth) ? `${maxWidth}px` : maxWidth;

  const marginClass = align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : 'mx-auto';

  return (
    <>
      <figure className="not-prose my-4 flex flex-col group">
        <button
          type="button"
          onClick={openLightbox}
          className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-md"
          aria-label={`Expand diagram${caption ? `: ${caption}` : ''}`}
          title="Click to expand"
        >
          <div
            className={`dot-graph-svg overflow-hidden rounded-md ${marginClass}`}
            style={containerStyle}
            // SVG produced by viz.js (Graphviz WASM) from author-supplied DOT — not user input
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {/* hover overlay */}
          <div className="absolute inset-0 rounded-md bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
            <FaExpand className="text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow text-2xl" />
          </div>
        </button>
        {caption && (
          <figcaption className="text-sm text-center mt-1 text-[var(--color-muted)]">
            {caption}
          </figcaption>
        )}
      </figure>

      {lightboxOpen && <DotGraphLightbox svg={svg} caption={caption} onClose={closeLightbox} />}
    </>
  );
}
