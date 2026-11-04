# whoami

Source for [essible.pages.dev](https://essible.pages.dev): writeups and notes on penetration testing and web application security.

Built with [Astro](https://astro.build). The output is static HTML and CSS, with no cookies or trackers. The only JavaScript is `public/copy.js`, which adds Copy buttons to code blocks on writeup pages.

## Run locally

Requires Node.js 22.23.4 or newer.

```sh
npm ci
npm run dev      # http://localhost:4321, drafts included
npm run build    # production build in dist/, drafts excluded
```

## Add a writeup

1. Copy `templates/writeup.md` into `src/content/writeups/`. The file name becomes the URL, e.g. `sqli-where-clause.md` → `/writeups/sqli-where-clause/`.
2. Fill in the front matter and the sections.
3. Set `draft: false` to publish. Drafts only show up in `npm run dev`.

The Writeups page and menu link appear automatically once the first writeup is published.

Before publishing:

- Only write up retired machines and finished events. Platforms ban spoilers for active ones.
- Never publish OverTheWire passwords or flags that a platform asks you to keep private.
- This repository is public, including its history. Don't commit drafts that you can't publish.

## Edit the profile

Name, intro, progress and skills are in `src/data/profile.ts`.

The request panel on the home page shows real files: `/whoami.json`, `/progress.json` and
`/writeups.json`, which the build writes from `src/data/api.ts`, and `public/.well-known/security.txt`.
The panel reads the same sources, so it always shows what the server sends.

## How it works

- The panel's tabs are radio buttons. Each pane plays its animation when it is shown.
- The spotlight that follows the pointer over the hero and contact backgrounds is CSS too: an invisible grid of cells lies over the section's background and text (below links, buttons and the panel), and the hovered cell sets the light's position (`src/components/Spotlight.astro`).
- Scroll effects (the frosted header, reading progress, the highlighted menu item, the side rail
  on writeups) use CSS scroll-driven animations. Browsers without them get the static version.
- Moving between pages uses CSS view transitions where supported.
- Visitors who prefer reduced motion get a still page: no entrance animations, parallax or page transitions.
- Code blocks get a Copy button from `public/copy.js`, the one script on the site. It loads only on writeup pages, and without it the code can still be selected by hand.
- The layout is tested from smartwatch width (about 160px) up to 4K screens.

## Deploy on Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- The Node.js version is read from `.node-version`.

Security headers are set in `public/_headers`. Scripts may only come from this site (`script-src 'self'`), and Trusted Types (`require-trusted-types-for 'script'`) blocks HTML injection into the page from scripts. The footer links to this repository, so keep it public. Keep Cloudflare Web Analytics turned off, or allow its script in the Content-Security-Policy, otherwise the browser will block it.

`public/.well-known/security.txt` expires on 2027-10-31. Update the `Expires` date before then.
