/**
 * Every string in a file is a candidate for holding class names, so the
 * plugin checks the words in all of them rather than trying to recognise
 * which string is a class list. A colour written anywhere in the source is
 * a colour the reviewer has to see.
 */

/**
 * Split a string into the words that could be class names.
 * @param {string} value
 * @returns {string[]}
 */
function toWords(value) {
  return value.split(/[\s'"`]+/).filter(Boolean);
}

/**
 * The class name without its variants and opacity modifier.
 * `hover:bg-primary/50` → `bg-primary`
 * @param {string} word
 * @returns {string}
 */
function stripVariants(word) {
  let depth = 0;
  let lastColon = -1;
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    else if (ch === ':' && depth === 0) lastColon = i;
  }
  let base = lastColon === -1 ? word : word.slice(lastColon + 1);
  const slash = base.indexOf('/');
  if (slash !== -1) base = base.slice(0, slash);
  return base;
}

/**
 * The words in a string that look like a utility with a colour-ish prefix.
 * An arbitrary value is left to the raw-colour rule.
 * @param {string} value
 * @returns {string[]}
 */
function colourCandidates(value) {
  return toWords(value)
    .map(stripVariants)
    .filter((word) => /^[a-z][a-z0-9-]*$/.test(word) && word.includes('-'));
}

module.exports = { colourCandidates, stripVariants, toWords };
