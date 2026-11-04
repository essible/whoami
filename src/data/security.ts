import { profile } from './profile';

/** RFC 9116 asks for an Expires date at most a year ahead. Move it forward before it passes. */
export const securityExpires = '2027-10-31T23:59:59.000Z';

/** The body of /.well-known/security.txt, also shown in the request panel. */
export function securityTxt(site: URL): string {
  return [
    `Contact: mailto:${profile.email}`,
    `Expires: ${securityExpires}`,
    'Preferred-Languages: en',
    `Canonical: ${new URL('/.well-known/security.txt', site).href}`,
  ].join('\n') + '\n';
}
