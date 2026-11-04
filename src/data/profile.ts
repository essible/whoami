export const profile = {
  handle: 'essible',
  headline: 'Penetration testing & web application security',
  focusAreas: ['Penetration testing', 'Web application security'],
  intro:
    "I'm focused on penetration testing, starting with web applications. I train on PortSwigger's Web Security Academy and OverTheWire's wargames, and this is where I publish my writeups: how each vulnerability works, how I exploited it in a lab, and how to fix it.",
  description: 'Writeups and notes on penetration testing and web application security.',
  now: 'SQL injection labs',
  email: 'essible@proton.me',
  github: 'https://github.com/essible',
  source: 'https://github.com/essible/whoami',
  githubLabel: 'github.com/essible',
};

export type PathStatus = 'done' | 'active' | 'paused' | 'next';

export interface PathItem {
  name: string;
  platform: string;
  url: string;
  status: PathStatus;
  /** Short, factual note for the item in progress, e.g. "About half of the labs". */
  detail?: string;
  /** Percent complete for the item in progress, 0 to 100. */
  value?: number;
}

/** In order. The first "active" item is shown in the Now tile. "next" items are plans. */
export const path: PathItem[] = [
  {
    name: 'Bandit',
    platform: 'OverTheWire',
    url: 'https://overthewire.org/wargames/bandit/',
    status: 'done',
  },
  {
    name: 'Natas',
    platform: 'OverTheWire',
    url: 'https://overthewire.org/wargames/natas/',
    status: 'paused',
    detail: 'Levels 0–8',
  },
  {
    name: 'SQL injection',
    platform: 'PortSwigger Web Security Academy',
    url: 'https://portswigger.net/web-security/sql-injection',
    status: 'active',
    detail: 'About half of the labs',
    value: 50,
  },
  {
    name: 'Authentication',
    platform: 'PortSwigger Web Security Academy',
    url: 'https://portswigger.net/web-security/authentication',
    status: 'next',
  },
  {
    name: 'Path traversal',
    platform: 'PortSwigger Web Security Academy',
    url: 'https://portswigger.net/web-security/file-path-traversal',
    status: 'next',
  },
  {
    name: 'Command injection',
    platform: 'PortSwigger Web Security Academy',
    url: 'https://portswigger.net/web-security/os-command-injection',
    status: 'next',
  },
];

export const toolkit: { group: string; items: string[] }[] = [
  { group: 'Systems', items: ['Linux command line', 'Bash'] },
  { group: 'Web', items: ['HTTP', 'HTML, CSS & JavaScript'] },
];
