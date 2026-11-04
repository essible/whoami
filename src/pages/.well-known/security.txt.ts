import type { APIRoute } from 'astro';
import { securityTxt } from '../../data/security';

export const GET: APIRoute = ({ site }) =>
  new Response(securityTxt(site!), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
