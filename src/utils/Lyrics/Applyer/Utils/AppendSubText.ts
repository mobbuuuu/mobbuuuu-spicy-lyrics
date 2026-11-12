import { StripZeroWidth } from "./StripZeroWidth.ts";

export function appendSubText(
  lineElem: HTMLElement,
  romanizedText: string | undefined,
  translatedText: string | undefined
): void {
  if (romanizedText) {
    const div = document.createElement("div");
    div.classList.add("lyrics-sub-text", "lyrics-romanization");
    div.textContent = StripZeroWidth(romanizedText);
    lineElem.appendChild(div);
  }
  if (translatedText) {
    const div = document.createElement("div");
    div.classList.add("lyrics-sub-text", "lyrics-translation");
    div.textContent = StripZeroWidth(translatedText);
    lineElem.appendChild(div);
  }
}

export function buildSyllableRomanization(syllables: { Text: string; TransliteratedText?: string; IsPartOfWord?: boolean }[]): string | undefined {
  if (!syllables.some(s => s.TransliteratedText)) return undefined;
  let text = "";
  for (const s of syllables) {
    const part = s.TransliteratedText || s.Text;
    if (text && !s.IsPartOfWord) text += " ";
    text += part;
  }
  return text;
}
