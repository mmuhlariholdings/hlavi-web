import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")          // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")       // bold
    .replace(/\*(.+?)\*/g, "$1")           // italic
    .replace(/__(.+?)__/g, "$1")           // bold alt
    .replace(/_(.+?)_/g, "$1")             // italic alt
    .replace(/~~(.+?)~~/g, "$1")           // strikethrough
    .replace(/`{3}[\s\S]*?`{3}/g, "")      // fenced code blocks
    .replace(/`(.+?)`/g, "$1")             // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "")       // images
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")    // links
    .replace(/^[-*+]\s+/gm, "")           // unordered list markers
    .replace(/^\d+\.\s+/gm, "")           // ordered list markers
    .replace(/^>\s+/gm, "")               // blockquotes
    .replace(/^[-*_]{3,}$/gm, "")         // hr
    .replace(/\n{2,}/g, " ")              // collapse newlines
    .trim();
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
