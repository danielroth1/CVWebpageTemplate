import React from 'react';

// Supported props for markdown usage:
//
// Important!
// use <br> after each to ensure spacing in markdown rendering or else the following content is cropped.
//
// Usage:
// <youtube id="VIDEO_ID" /><br>
// <youtube src="https://www.youtube.com/watch?v=VIDEO_ID" start="120" title="Intro" /><br>
// <youtube video="VIDEO_ID" aspect="4:3" /><br>
// If 'id' missing but 'src' provided, we attempt to extract the ID from typical YouTube URL formats.
// Accepts: https://www.youtube.com/watch?v=ID, https://youtu.be/ID, https://www.youtube.com/embed/ID
// Optional 'start' (seconds) to start playback at given time.
// Optional 'title' becomes iframe title for accessibility.
// Optional 'aspect' can be "16:9" (default), "4:3", "1:1".

export interface YouTubeEmbedProps {
  id?: string;
  video?: string; // alias for id
  src?: string; // full youtube URL
  start?: string | number;
  title?: string;
  aspect?: string; // e.g. 16:9
  width?: string | number; // custom width (e.g. 640, '640px', '80%', '32rem', 'full')
  className?: string;
  children?: React.ReactNode; // optional caption text if using <youtube>...</youtube>
}

function extractId(props: YouTubeEmbedProps): string | null {
  const direct = props.id || props.video;
  if (direct) return String(direct);
  if (!props.src) return null;
  const src = props.src.trim();
  // Patterns
  // watch?v=ID
  const watchMatch = src.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch) return watchMatch[1];
  // youtu.be/ID
  const shortMatch = src.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return shortMatch[1];
  // embed/ID
  const embedMatch = src.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

function aspectToClass(aspect?: string): string {
  switch ((aspect || '16:9').trim()) {
    case '4:3':
      return 'aspect-[4/3]';
    case '1:1':
      return 'aspect-square';
    default:
      return 'aspect-video'; // 16:9
  }
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = (props) => {
  const id = extractId(props);
  if (!id) {
    return (
      <div className="text-sm text-red-600">Invalid YouTube embed: missing video id.</div>
    );
  }
  const start = props.start ? Number(props.start) : undefined;
  const params = new URLSearchParams();
  if (start && !isNaN(start) && start > 0) {
    params.set('start', String(start));
  } else {
    // Force explicit start=0 so video does not resume midway from cached state.
    params.set('start', '0');
  }
  // modestbranding for cleaner look
  params.set('modestbranding', '1');
  params.set('rel', '0');
  // Consider enabling lazy loading by not requesting until visible in future improvement.
  const src = `https://www.youtube.com/embed/${id}?${params.toString()}`;

  // Compute width style if provided.
  let widthStyle: React.CSSProperties | undefined;
  if (props.width !== undefined) {
    const raw = props.width;
    if (typeof raw === 'number') {
      widthStyle = { width: `${raw}px` };
    } else if (typeof raw === 'string') {
      if (raw === 'full') widthStyle = { width: '100%' };
      else widthStyle = { width: raw };
    }
  }

  const captionChildren = React.Children.toArray(props.children).filter((c) => typeof c === 'string' || React.isValidElement(c));

  return (
    <>
      <figure
        className={`my-4 ${props.width === undefined ? 'w-full' : ''} ${aspectToClass(props.aspect)} overflow-hidden rounded-lg shadow-md bg-black ${props.className || ''}`}
        style={widthStyle}
      >
        <iframe
          src={src}
          title={props.title || 'YouTube video player'}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
        {captionChildren.length > 0 && (
          <figcaption className="mt-2 text-center text-xs text-slate-600">{captionChildren}</figcaption>
        )}
      </figure>
    </>
  );
};

// Markdown wrapper simply forwards props
export const YouTubeEmbedMarkdown: React.FC<YouTubeEmbedProps> = (props) => <YouTubeEmbed {...props} />;

export default YouTubeEmbed;
