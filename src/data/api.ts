import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { byteLength, fieldLines, jsonLines, linesToText, type Endpoint } from '../lib/http';
import { getWriteups } from '../lib/writeups';
import { path, profile, type PathItem, type PathStatus } from './profile';

/**
 * The small JSON "API" this site publishes as static files (/whoami.json and friends).
 * The request panel on the home page shows these same responses.
 */

/** "OverTheWire Bandit", "PortSwigger SQL injection" */
const title = (item: PathItem) => `${item.platform.split(' ')[0]} ${item.name}`;

function titles(status: PathStatus) {
  const list = path.filter((item) => item.status === status).map(title);
  return list.length > 1 ? list : list[0];
}

export function whoami() {
  return { handle: profile.handle, focus: 'web application security', now: profile.now };
}

export function progress() {
  const next = path.find((item) => item.status === 'next');
  return {
    completed: titles('done'),
    in_progress: titles('active'),
    paused: titles('paused'),
    next: next && title(next),
  };
}

export async function writeups() {
  const all = await getWriteups();
  return { count: all.length, latest: all[0] && `/writeups/${all[0].id}/` };
}

/** Read at build time; the build runs from the project root. */
const securityTxt = readFileSync(resolve('public/.well-known/security.txt'), 'utf8');

function json(value: Parameters<typeof jsonLines>[0]) {
  const body = jsonLines(value);
  return { body, bytes: byteLength(linesToText(body)) };
}

const contentType = (value: string) => ({ name: 'content-type', value });

/** Tabs for the panel on the home page. Header values are the ones in public/_headers. */
export async function heroEndpoints(): Promise<Endpoint[]> {
  const index = await writeups();
  const ok = { status: 200, statusText: 'OK' };
  const endpoints: Endpoint[] = [
    {
      id: 'whoami',
      label: 'whoami.json',
      path: '/whoami.json',
      ...ok,
      headers: [contentType('application/json'), { name: 'content-security-policy', value: "default-src 'none'; …" }],
      ...json(whoami()),
    },
    {
      id: 'progress',
      label: 'progress.json',
      path: '/progress.json',
      ...ok,
      headers: [contentType('application/json'), { name: 'x-content-type-options', value: 'nosniff' }],
      ...json(progress()),
    },
  ];
  if (index.count > 0) {
    endpoints.push({
      id: 'writeups',
      label: 'writeups.json',
      path: '/writeups.json',
      ...ok,
      headers: [contentType('application/json'), { name: 'referrer-policy', value: 'no-referrer' }],
      ...json(index),
    });
  }
  endpoints.push({
    id: 'security',
    label: 'security.txt',
    path: '/.well-known/security.txt',
    ...ok,
    headers: [contentType('text/plain; charset=utf-8'), { name: 'x-frame-options', value: 'DENY' }],
    body: fieldLines(securityTxt),
    bytes: byteLength(securityTxt),
  });
  return endpoints;
}
