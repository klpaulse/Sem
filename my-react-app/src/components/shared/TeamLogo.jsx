function getInitials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ShieldPlaceholder({ name, size }) {
  const initials = getInitials(name);
  const h = size * 1.15;
  const fontSize = size * 0.34;

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 115"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M50 5 L90 22 L90 65 C90 88 72 103 50 112 C28 103 10 88 10 65 L10 22 Z"
        fill="#444"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2"
      />
      <path
        d="M50 13 L83 27 L83 65 C83 84 67 97 50 105 C33 97 17 84 17 65 L17 27 Z"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1.5"
      />
      <text
        x="50"
        y="65"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.75)"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        letterSpacing="1"
      >
        {initials}
      </text>
    </svg>
  );
}

export default function TeamLogo({ logoUrl, name, size = 28 }) {
  const style = {
    width: size,
    height: size * 1.15,
    borderRadius: 0,
    flexShrink: 0,
    objectFit: "contain",
  };

  if (logoUrl) {
    return <img src={logoUrl} alt="" style={style} />;
  }

  return <ShieldPlaceholder name={name} size={size} />;
}
