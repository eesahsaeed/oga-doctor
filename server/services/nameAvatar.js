function sanitizeName(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getInitials(name = '') {
  const parts = sanitizeName(name).split(' ').filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return 'DR';
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

function pickPalette(name = '') {
  const palettes = [
    { bg: '#0f172a', fg: '#f8fafc' },
    { bg: '#1d4ed8', fg: '#eff6ff' },
    { bg: '#0f766e', fg: '#ecfeff' },
    { bg: '#7c3aed', fg: '#f5f3ff' },
    { bg: '#be123c', fg: '#fff1f2' },
    { bg: '#92400e', fg: '#fffbeb' },
  ];

  const normalized = sanitizeName(name) || 'doctor';
  const hash = [...normalized].reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );

  return palettes[hash % palettes.length];
}

export function buildNameAvatarDataUrl(name = '') {
  const safeName = sanitizeName(name) || 'Doctor';
  const initials = getInitials(safeName);
  const palette = pickPalette(safeName);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img" aria-label="${safeName}">
      <rect width="320" height="320" rx="64" fill="${palette.bg}" />
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="${palette.fg}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="118"
        font-weight="700"
        letter-spacing="4"
      >${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
