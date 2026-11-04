import { getCollection, type CollectionEntry } from 'astro:content';

export type Writeup = CollectionEntry<'writeups'>;

/** Writeups sorted newest first. Drafts are only included in `astro dev`. */
export async function getWriteups(): Promise<Writeup[]> {
  const entries = await getCollection('writeups', ({ data }) => import.meta.env.DEV || !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Reading time in minutes at about 220 words a minute. Code blocks count half: people skim them. */
export function readingMinutes(markdown = ''): number {
  const fence = /```[\s\S]*?```/g;
  const words = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const code = words((markdown.match(fence) ?? []).join(' '));
  const prose = words(markdown.replace(fence, ' '));
  return Math.max(1, Math.round((prose + code / 2) / 220));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export type Level = 'low' | 'medium' | 'high' | 'neutral';

/** Maps platform difficulty names (PortSwigger, HackTheBox, TryHackMe) to a colour level. */
export function levelOf(difficulty?: string): Level {
  switch ((difficulty ?? '').toLowerCase()) {
    case 'apprentice':
    case 'easy':
      return 'low';
    case 'practitioner':
    case 'medium':
      return 'medium';
    case 'expert':
    case 'hard':
    case 'insane':
      return 'high';
    default:
      return 'neutral';
  }
}
