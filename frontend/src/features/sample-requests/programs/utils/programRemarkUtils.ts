// Utilities for encoding and decoding column highlight flags in SAMP program remarks

export function parseSampRemark(raw?: string): { text: string; highlightedCols: string[] } {
  if (!raw) return { text: "", highlightedCols: [] };
  const match = raw.match(/^\[\[flags:([a-z0-9_,-]+)\]\]\s*(.*)$/i);
  if (match) {
    const cols = match[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    return { text: match[2] || "", highlightedCols: cols };
  }
  return { text: raw, highlightedCols: [] };
}

export function formatSampRemark(text: string, highlightedCols: string[]): string {
  const cleanText = text.trim();
  if (highlightedCols.length === 0) return cleanText;
  return `[[flags:${highlightedCols.join(",")}]] ${cleanText}`;
}
