import React from 'react';

/**
 * Accessible tooltip component.
 *
 * Usage:
 * <Tooltip content="Hello" delay={600}><button>i</button></Tooltip>
 *
 * Features:
 * - Hover & focus trigger.
 * - Optional delay before showing.
 * - Hides on Escape.
 * - ARIA: wrapper sets aria-describedby on child if tooltip visible.
 * - Positions relative to trigger; supports basic placement prop (top|bottom|left|right) with center alignment.
 */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement; // single element to clone with aria attrs
  className?: string; // extra classes for tooltip panel
  delay?: number; // ms before showing (default 500)
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  /** Tailwind width class (e.g., 'w-64') OR custom inline style width when using styleWidth. */
  widthClass?: string;
  /** Optional explicit max width class (e.g., 'max-w-lg'). Overrides default max width. */
  maxWidthClass?: string;
  /** Optional numeric pixel width applied via style attribute instead of a Tailwind class. */
  styleWidth?: number;
  /** Optional Tailwind min-width class (e.g., 'min-w-[12rem]') */
  minWidthClass?: string;
  /** If true, stretch tooltip to fit content up to max width; if false it hugs content. */
  fullWidth?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = '',
  delay = 500,
  placement = 'bottom',
  disabled = false,
  widthClass,
  maxWidthClass,
  styleWidth,
  minWidthClass,
  fullWidth = false,
}) => {
  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);
  const id = React.useId();
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = () => {
    if (disabled) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    clearTimer();
    setVisible(false);
  };

  // Hide on Escape when focused within trigger
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  React.useEffect(() => () => clearTimer(), []);

  // Build child with aria-describedby if visible
  const child = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      triggerRef.current = node;
      // Preserve existing ref if any
      const { ref } = children as any;
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref === 'object') (ref as any).current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hide();
    },
    'aria-describedby': visible ? id : undefined,
  });

  // Compute placement styles
  const basePlacementClasses = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-1';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-1';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-1';
      default:
        return 'top-full left-1/2 -translate-x-1/2 mt-1';
    }
  };

  return (
    <span className="relative inline-flex">
      {child}
      {visible && !disabled && (
        <span
          id={id}
          role="tooltip"
          className={
            'absolute z-20 whitespace-normal text-[11px] p-2 rounded border app-border bg-[var(--color-bg)] shadow-lg ' +
            (maxWidthClass || 'max-w-lg') + ' ' +
            (minWidthClass ? minWidthClass + ' ' : '') +
            (widthClass ? widthClass + ' ' : '') +
            (fullWidth ? 'w-full ' : '') +
            basePlacementClasses() + ' ' +
            className
          }
          style={styleWidth ? { width: styleWidth } : undefined}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;