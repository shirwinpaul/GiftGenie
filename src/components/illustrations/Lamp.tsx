import { useId } from "react";

/** Original magic oil-lamp illustration (no characters, no brands). */
export function LampIllustration({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 260" className={className} role="img" aria-label="A glowing magic lamp with sparkles">
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#7f3ff0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7f3ff0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-smoke`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="120" rx="150" ry="110" fill={`url(#${id}-glow)`} />

      {/* Magic swirl rising from the spout */}
      <path
        d="M236 150 C 262 120, 222 100, 246 74 C 268 50, 232 34, 252 12"
        fill="none"
        stroke={`url(#${id}-smoke)`}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Base */}
      <ellipse cx="150" cy="226" rx="70" ry="12" fill="#5821ae" opacity="0.25" />
      <path d="M118 196 h64 l10 24 h-84 z" fill={`url(#${id}-gold)`} />
      {/* Body */}
      <path
        d="M70 168 C 70 128, 230 128, 230 168 C 230 196, 190 204, 150 204 C 110 204, 70 196, 70 168 z"
        fill={`url(#${id}-gold)`}
      />
      {/* Spout */}
      <path d="M222 160 C 246 156, 250 148, 262 138 L 268 146 C 256 164, 244 176, 222 180 z" fill={`url(#${id}-gold)`} />
      {/* Handle */}
      <path d="M78 156 C 40 150, 40 196, 84 186" fill="none" stroke="#d97706" strokeWidth="10" strokeLinecap="round" />
      {/* Lid */}
      <path d="M118 140 C 118 116, 182 116, 182 140 z" fill={`url(#${id}-gold)`} />
      <circle cx="150" cy="112" r="9" fill="#fbbf24" />
      {/* Decorative band with teal gems */}
      <path d="M84 170 C 120 182, 180 182, 216 170" fill="none" stroke="#7f3ff0" strokeWidth="5" />
      <circle cx="120" cy="177" r="5" fill="#14b8a6" />
      <circle cx="150" cy="180" r="6" fill="#14b8a6" />
      <circle cx="180" cy="177" r="5" fill="#14b8a6" />

      {/* Sparkles */}
      <Sparkle x={60} y={60} size={14} />
      <Sparkle x={270} y={36} size={10} />
      <Sparkle x={286} y={110} size={8} />
      <Sparkle x={36} y={130} size={9} />
    </svg>
  );
}

function Sparkle({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size;
  return (
    <path
      className="origin-center animate-twinkle"
      style={{ transformBox: "fill-box" }}
      d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} z`}
      fill="#fbbf24"
    />
  );
}

/** Small lamp mark for the header. */
export function LampIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M30 22 C 36 16, 32 10, 38 4" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 30 C 8 22, 38 22, 38 30 C 38 35, 31 37, 23 37 C 15 37, 8 35, 8 30 z" fill="#f59e0b" />
      <path d="M36 28 C 40 27, 41 25, 44 23 L 45 25 C 43 29, 40 32, 36 33 z" fill="#f59e0b" />
      <path d="M16 37 h14 l2 5 h-18 z" fill="#d97706" />
      <path d="M17 24 C 17 19, 29 19, 29 24 z" fill="#fbbf24" />
      <circle cx="23" cy="18.5" r="2" fill="#7f3ff0" />
    </svg>
  );
}
