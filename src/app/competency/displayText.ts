/** Format interface labels only; never apply to user-entered names or stored values. */
export function titleCaseLabel(value: string): string {
  const minorWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "per", "the", "to", "via", "with"]);
  const words = [...value.matchAll(/[A-Za-z]+/g)];
  return value.replace(/[A-Za-z]+/g, (word, index: number) => {
    if (word === word.toUpperCase() || /[A-Z].*[A-Z]/.test(word)) return word;
    if (index !== words[0]?.index && index !== words[words.length - 1]?.index && minorWords.has(word.toLowerCase())) return word.toLowerCase();
    return word[0].toUpperCase() + word.slice(1);
  });
}

/** Presentation only: canonical status and filter values stay unchanged. */
export const statusText = titleCaseLabel;
