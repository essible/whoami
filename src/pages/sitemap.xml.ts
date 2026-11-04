import type { APIRoute } from 'astro';
import { getWriteups, isoDate } from '../lib/writeups';

export const GET: APIRoute = async ({ site }) => {
  const writeups = await getWriteups();
  const pages = [
    { path: '/' },
    ...(writeups.length > 0 ? [{ path: '/writeups/' }] : []),
    ...writeups.map((w) => ({ path: `/writeups/${w.id}/`, lastmod: isoDate(w.data.date) })),
  ];
  const urls = pages.map(({ path, lastmod }) => {
    const loc = new URL(path, site).href;
    return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
