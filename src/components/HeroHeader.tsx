import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import resume from '../data/RESUME.json';
import personal_photo from '../data/personal_photo.jpg';
import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
// Removed LOC data flair

/*
 HeroHeader
 - Non-sticky hero that visually shrinks as user scrolls down.
 - Implements parallax: background gradient & noise move slower than foreground.
 - Blur reduction: starts with heavier blur, decreases on scroll.
 - Dynamic color shift: gradient interpolates from deep navy -> bright azure.
 - Noise texture overlay via CSS pseudo-element.
 - Navigation fades in only after threshold shrink.

 Performance considerations:
 - Scroll listener uses requestAnimationFrame to batch updates.
 - Derived progress clamped between 0 and 1 based on a shrinkRange (default 320px scroll).
 - MotionValues drive transforms without re-render for smoother animation.
*/

interface HeroHeaderProps {
  shrinkRange?: number; // Pixels of scroll over which hero shrinks
  minHeight?: number; // Final compact height
  maxHeight?: number; // Initial height
  navFadeThreshold?: number; // progress at which nav fades in
}

// Scroll progress hook (0 -> 1) using RAF throttle; avoids React state by using a MotionValue
function useScrollProgress(range: number) {
  const mv = useMotionValue(0);
  const scrollYRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const update = () => {
      rafRef.current = null;
      const raw = Math.min(scrollYRef.current, range);
      mv.set(raw / range);
    };
    const onScroll = () => {
      scrollYRef.current = window.scrollY;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [range, mv]);
  return mv;
}

const HeroHeader: React.FC<HeroHeaderProps> = ({
  shrinkRange = 320,
  minHeight = 120,
  maxHeight = 420,
  navFadeThreshold = 0.45,
}) => {
  const profile = (resume as any).profile as { name: string; title: string; skills: string[] } | undefined;
  const progress = useScrollProgress(shrinkRange);
  const height = useTransform(progress, [0, 1], [maxHeight, minHeight]);

  // Derived transforms using framer-motion
  const scaleImg = useTransform(height, [minHeight, maxHeight], [0.4, 1]);
  const scaleText = useTransform(height, [minHeight, maxHeight], [0.75, 1]);
  const yParallaxBg = useTransform(height, [minHeight, maxHeight], [0, -40]); // subtle upward

  // We'll also drive gradient color shift via progress
  const gradient = useTransform(height, (h: number) => {
    const t = 1 - (h - minHeight) / (maxHeight - minHeight); // 0 at top -> 1 shrunk
    // Interpolate colors
    const startColor = { r: 5, g: 20, b: 60 };
    const endColor = { r: 10, g: 120, b: 255 };
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
    const c1 = `rgb(${mix(startColor.r, endColor.r)}, ${mix(startColor.g, endColor.g)}, ${mix(startColor.b, endColor.b)})`;
    const c2 = `rgb(${mix(startColor.r * 0.5, endColor.r * 0.8)}, ${mix(startColor.g * 0.5, endColor.g * 0.8)}, ${mix(startColor.b * 0.5, endColor.b * 0.8)})`;
    return `linear-gradient(135deg, ${c1}, ${c2})`;
  });

  // nav opacity and translate based on progress
  const navOpacity = useTransform(progress, [navFadeThreshold, 1], [0, 1]);
  const navY = useTransform(progress, [navFadeThreshold, 1], [20, 0]);

  const containerStyle = { height, backgroundImage: gradient };
  // Remove overflow-hidden so content (nav) isn't clipped as height shrinks
  const baseClass = 'relative w-full text-white';
  return (
    <motion.div
      style={containerStyle}
      className={baseClass}
    >
      {/* Noise overlay using pseudo-element via a nested div */}
      <motion.div
        aria-hidden
        style={{ y: yParallaxBg }}
        className="absolute inset-0"
      >
        <div
          className="w-full h-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 60%)',
            mixBlendMode: 'overlay',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" fill=\"none\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/></filter><rect width=\"200\" height=\"200\" filter=\"url(#noise)\" opacity=\"0.4\"/></svg>")',
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
            pointerEvents: 'none',
            opacity: 0.35 + progress.get() * 0.25,
          }}
        />
      </motion.div>

  {/* Container: flex column; nav anchored to bottom via mt-auto to remain visible when hero shrinks */}
  <div className="relative max-w-6xl mx-auto h-full px-6 flex flex-col">
        {/* Persistent theme toggle positioned in top-right within hero bounds */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle className="theme-toggle-hero" />
        </div>
  <div className="flex items-center gap-6 pt-4">
          <motion.img
            src={personal_photo}
            alt={`${profile?.name ?? 'Profile'} photo`}
            style={{ scale: scaleImg }}
            className="rounded-full object-cover shadow-xl w-40 h-40 md:w-48 md:h-48"
          />
          <div className="flex-1">
            <motion.h1
              style={{ scale: scaleText }}
              className="font-bold tracking-tight"
            >
              <span className="block text-4xl md:text-5xl">{profile?.name}</span>
            </motion.h1>
            <motion.p
              style={{ opacity: useTransform(progress, [0, 1], [1, 0.75]) }}
              className="mt-2 text-lg text-blue-100"
            >
              {profile?.title}
            </motion.p>
            <motion.div
              style={{ opacity: useTransform(progress, [0, 1], [1, 0.4]) }}
              className="mt-4 hidden md:block text-sm text-blue-50 max-w-xl"
            >
              {(profile?.skills || []).slice(0, 10).join(' • ')}
            </motion.div>
          </div>
        </div>
        {/* LOC flair removed */}

        {/* Navigation that fades in once threshold met and stays visible (anchored bottom) */}
        {/* Commented out, because it's pretty bugged */}
        {/* <motion.nav
          style={{ opacity: navOpacity, y: navY }}
          className="mt-auto mb-4 flex items-center justify-start gap-4 px-4 py-2 rounded-xl nav-surface/50 backdrop-blur-md bg-[var(--color-surface)]/60 shadow-elevate-sm border app-border"
        >
          <ul className="flex flex-wrap gap-2 text-sm font-medium pr-12">
            {['/','/projects','/about','/resume'].map((path, idx) => {
              const label = ['Home','Projects','About','Resume'][idx];
              return (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) => `px-3 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--color-primary)] ${isActive ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)]' : 'hover:bg-[var(--color-surface-solid)]/70 text-[var(--color-text)]'}`}
                  >
                    {label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </motion.nav> */}
      </div>

      {/* Foreground overlay gradient fade at bottom to smoothly transition into page content */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)'
      }} />
    </motion.div>
  );
};

export default HeroHeader;
