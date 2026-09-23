// Detects whether a string is written primarily in a Latin script by analysing
// the Unicode script property of its characters (not the locale). Returns true
// when Latin letters are not outnumbered by other-script letters. Used to choose
// vertical vs horizontal layout for the PDF cover title.
const LATIN_SCRIPT = /\p{Script=Latin}/u;
const LETTER = /\p{Letter}/u;

export function isLatinText(text: string): boolean {
  if (!text) return true;

  const counts = { latin: 0, other: 0 };
  Array.from(text).forEach((char) => {
    if (LETTER.test(char)) {
      if (LATIN_SCRIPT.test(char)) counts.latin += 1;
      else counts.other += 1;
    }
  });

  if (counts.latin + counts.other === 0) return true;
  return counts.latin >= counts.other;
}
