import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    `# robots.txt is a polite request to crawlers, not access control.
# Nothing on this site is hidden, so there is nothing to disallow.

User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', site).href}
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
