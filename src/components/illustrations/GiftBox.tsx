/** Original gift box illustration. `open` lifts the lid (used by the reveal). */
export function GiftBox({ className = "", open = false }: { className?: string; open?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <rect x="18" y="52" width="84" height="58" rx="8" fill="#7f3ff0" />
      <rect x="54" y="52" width="12" height="58" fill="#fbbf24" />
      <g
        style={{
          transform: open ? "translate(10px, -26px) rotate(18deg)" : "none",
          transformOrigin: "60px 44px",
          transition: "transform 500ms cubic-bezier(.3,1.6,.5,1)",
        }}
      >
        <rect x="12" y="36" width="96" height="20" rx="6" fill="#5821ae" />
        <rect x="54" y="36" width="12" height="20" fill="#f59e0b" />
        <path d="M60 36 C 44 16, 26 26, 40 36 z" fill="#14b8a6" />
        <path d="M60 36 C 76 16, 94 26, 80 36 z" fill="#14b8a6" />
      </g>
    </svg>
  );
}

/** Decorative twinkling sparkle used in micro-interactions. */
export function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 z" fill="#fbbf24" />
    </svg>
  );
}
