// Violet-family hues so avatars belong to the palette while staying distinguishable.
const PALETTE = ['#7c3aed', '#9333ea', '#6d28d9', '#a855f7', '#5b21b6', '#c026d3', '#4f46e5', '#7e22ce'];

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

// FNV-1a hash: the same name always gets the same color.
const colorFor = (name = '') => {
  let hash = 2166136261;
  for (const char of name) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

export default function Avatar({ name, size = 'md' }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ background: colorFor(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
