function stripNoise(raw: string): string {
  return raw
    .replace(/\[\d[\d,\s–-]*\]/g, "")
    .replace(
      /\[(citation needed|edit|update|clarification needed|nb \d+|note \d+)\]/gi,
      "",
    )
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[­​‌‍﻿ ]/g, " ")
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, " - ")
    .replace(/\^/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isJunk(sentence: string): boolean {
  const words = sentence.split(/\s+/);
  if (words.length < 5) return true;
  const alphaRatio =
    sentence.replace(/[^a-zA-Z]/g, "").length / sentence.length;
  return alphaRatio < 0.5;
}

function cutAtReferences(sentences: string[]): string[] {
  if (sentences.length < 20) return sentences;

  const WINDOW = 8;
  const bodySlice = sentences.slice(0, Math.floor(sentences.length / 3));
  const bodyAvg =
    bodySlice.reduce((n, s) => n + s.split(/\s+/).length, 0) / bodySlice.length;
  const start = Math.floor(sentences.length * 0.3);

  for (let i = start; i <= sentences.length - WINDOW; i++) {
    const windowAvg =
      sentences
        .slice(i, i + WINDOW)
        .reduce((n, s) => n + s.split(/\s+/).length, 0) / WINDOW;
    if (windowAvg < bodyAvg * 0.35) return sentences.slice(0, i);
  }

  return sentences;
}

export function prepareText(raw: string): string {
  const sentences = toSentences(stripNoise(raw));
  const trimmed = cutAtReferences(sentences);
  return trimmed.filter((s) => !isJunk(s)).join(" ");
}
