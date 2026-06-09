export default function BrandLogo({ height = 42 }) {
  return (
    <svg
      height={height}
      viewBox="0 0 250 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Breddefotball Live"
    >
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff3b3b" />
          <stop offset="100%" stopColor="#ff7b3b" />
        </linearGradient>
      </defs>

      {/* Fotball-ikon */}
      <circle cx="21" cy="23" r="18" stroke="white" strokeWidth="1.8" opacity="0.9" />
      <path d="M21 7 L29 12 L26 21 L16 21 L13 12 Z" stroke="white" strokeWidth="1.4" fill="none" opacity="0.9" />
      <path d="M21 39 L29 34 L26 25 L16 25 L13 34 Z" stroke="white" strokeWidth="1.4" fill="none" opacity="0.9" />
      <path d="M4 17 L11 15 L14 21 L10 28 L3 26 Z" stroke="white" strokeWidth="1.4" fill="none" opacity="0.9" />
      <path d="M38 17 L31 15 L28 21 L32 28 L39 26 Z" stroke="white" strokeWidth="1.4" fill="none" opacity="0.9" />

      {/* BREDDEFOTBALL i gradient */}
      <text
        x="48"
        y="22"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="18"
        fontWeight="900"
        fill="url(#brandGrad)"
        letterSpacing="0.5"
      >
        BREDDEFOTBALL
      </text>

      {/* Tynn skillelinje */}
      <rect x="48" y="27" width="196" height="1.5" rx="1" fill="url(#brandGrad)" opacity="0.25" />

      {/* Live-prikk */}
      <circle cx="52" cy="39" r="3.5" fill="#ff3b3b">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* LIVE tekst */}
      <text
        x="62"
        y="43"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="white"
        letterSpacing="5"
        opacity="0.65"
      >
        LIVE
      </text>
    </svg>
  );
}
