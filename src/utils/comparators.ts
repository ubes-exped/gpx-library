function isUppercase(word: string) {
  return /^\p{Lu}/u.test(word);
}

export const tagComparator = (a: string, b: string) => (
  +b.includes(":") - +a.includes(":")
  || +isUppercase(b) - +isUppercase(a)
  || a.localeCompare(b)
);
