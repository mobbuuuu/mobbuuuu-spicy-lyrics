import { StripZeroWidth } from "./StripZeroWidth.ts";
import { SpotifyPlayer } from "../../../../components/Global/SpotifyPlayer.ts";
import { onAnimationFrame } from "../../../AnimationFrameLoop.ts";

// --- Synced romanization rows ---

type SyncedRow = {
  spans: HTMLElement[];
  starts: number[];
  ends: number[];
  fills: number[];
  start: number;
  end: number;
  phase: number | null;
};

const rows = new Map<HTMLElement, SyncedRow>();

export function clearSyncedRows(): void {
  rows.clear();
}

onAnimationFrame(() => {
  if (rows.size === 0) return;
  const position = SpotifyPlayer.GetPosition();
  for (const [el, row] of rows) {
    if (!el.isConnected) {
      row.phase = null;
      continue;
    }
    const phase = position < row.start ? -1 : position >= row.end ? 1 : 0;
    if (phase === row.phase && phase !== 0) continue;
    row.phase = phase;
    for (let i = 0; i < row.spans.length; i++) {
      const progress = (position - row.starts[i]) / (row.ends[i] - row.starts[i]);
      const fill = Math.min(1, Math.max(0, progress));
      if (row.fills[i] === fill) continue;
      row.fills[i] = fill;
      row.spans[i].style.setProperty("--SL_RomanFill", fill.toFixed(3));
    }
  }
});

// --- Shared types ---

export interface SyllableTiming {
  Text: string;
  TransliteratedText?: string;
  IsPartOfWord?: boolean;
  StartTime: number;
  EndTime: number;
}

// --- Append functions ---

function toMs(seconds: number): number {
  return Math.max(0, Math.round(seconds * 1000));
}

export function appendSubText(
  lineElem: HTMLElement,
  romanizedText: string | undefined,
  translatedText: string | undefined,
  syllables?: SyllableTiming[]
): void {
  if (translatedText) {
    const div = document.createElement("div");
    div.classList.add("lyrics-sub-text", "lyrics-translation");
    div.textContent = StripZeroWidth(translatedText);
    lineElem.appendChild(div);
  }
  if (romanizedText) {
    const div = document.createElement("div");
    div.classList.add("lyrics-sub-text", "lyrics-romanization");
    if (syllables && syllables.some(s => s.TransliteratedText)) {
      const entry: SyncedRow = { spans: [], starts: [], ends: [], fills: [], start: Infinity, end: 0, phase: null };
      for (const s of syllables) {
        const text = s.TransliteratedText || s.Text;
        if (!s.IsPartOfWord && entry.spans.length > 0) {
          div.appendChild(document.createTextNode(" "));
        }
        const span = document.createElement("span");
        span.className = "SL_RomanPart";
        span.textContent = StripZeroWidth(text);
        div.appendChild(span);
        const start = toMs(s.StartTime);
        const end = Math.max(start + 1, toMs(s.EndTime));
        entry.spans.push(span);
        entry.starts.push(start);
        entry.ends.push(end);
        entry.fills.push(-1);
        entry.start = Math.min(entry.start, start);
        entry.end = Math.max(entry.end, end);
      }
      div.classList.add("SL_RomanSynced");
      rows.set(div, entry);
    } else {
      div.textContent = StripZeroWidth(romanizedText);
    }
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
