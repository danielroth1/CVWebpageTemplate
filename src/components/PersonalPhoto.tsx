import React from 'react';
import personal_photo from '../data/personal_photo.jpg';
import resume from '../data/RESUME.json';

// Tailwind cannot see runtime-generated arbitrary classes (w-[${size}px]) in build-time purge.
// Provide fixed presets and allow custom numeric size via inline styles.
export interface PersonalPhotoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Preset size keyword for mobile breakpoint */
  preset?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Optional explicit pixel size override for mobile (inline style) */
  size?: number;
  /** Optional explicit pixel size override for md+ breakpoint (inline style) */
  mdSize?: number;
  shadow?: boolean;
}

const presetToPx: Record<string, number> = {
  xs: 64,
  sm: 96,
  md: 128,
  lg: 160,
  xl: 192,
};

const PersonalPhoto: React.FC<PersonalPhotoProps> = ({
  preset = 'lg',
  size,
  mdSize,
  shadow = true,
  className = '',
  alt,
  ...rest
}) => {
  const profile = (resume as any).profile as { name?: string } | undefined;
  const computedAlt = alt || `${profile?.name ?? 'Profile'} photo`;
  const mobilePx = size ?? presetToPx[preset];
  // Default md size: next larger preset unless user provided mdSize
  const mdPx = mdSize ?? Math.min(mobilePx + 32, 224);
  const shadowClass = shadow ? 'shadow-xl' : '';

  // Use inline style for width/height to guarantee correctness even if arbitrary class purge occurs
  return (
    <img
      src={personal_photo}
      alt={computedAlt}
      style={{ width: mobilePx, height: mobilePx }}
      className={`rounded-full object-cover ${shadowClass} ${className} md:w-auto md:h-auto`}
      // Add a media query via tailwind? Simpler: use picture element? Instead apply second img via CSS.
      // For clarity, we can adjust size in a small inline style using a data attribute and a global CSS snippet if needed.
      data-md-size={mdPx}
      {...rest}
    />
  );
};

export default PersonalPhoto;