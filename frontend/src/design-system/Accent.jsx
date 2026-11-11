/**
 * Renders text where *words between asterisks* get the editorial accent
 * (italic serif, as in "your studio is on a *roll*"). Used with i18n strings.
 */
export default function Accent({ text }) {
  return String(text)
    .split(/(\*[^*]+\*)/)
    .map((part, i) =>
      part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
        <em key={i} className="accent">
          {part.slice(1, -1)}
        </em>
      ) : (
        part
      ),
    );
}

/** Plain text without the accent markers (for aria labels, titles, etc.). */
export const plain = (text) => String(text).replace(/\*/g, '');
