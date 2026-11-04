import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';

/**
 * Images in writeups are never wider than the text column (42rem). Telling the browser so
 * (the `sizes` attribute) lets it download a smaller file instead of one sized for the screen.
 */
const writeupImageSizes = {
  name: 'writeup-image-sizes',
  element: {
    filter: ['img'],
    visit(node, ctx) {
      if (!node.properties?.sizes) {
        ctx.setProperty(node, 'sizes', '(min-width: 44.5rem) 42rem, calc(100vw - 2.5rem)');
      }
    },
  },
};

export default defineConfig({
  // The site's address. Canonical links, link previews, the sitemap, robots.txt, security.txt and
  // the request panel's Host line all use it, so this is the one place to change it.
  site: 'https://essible.pages.dev',
  build: {
    // Keep all CSS in external files so the Content-Security-Policy can stay strict.
    inlineStylesheets: 'never',
  },
  image: {
    // Images get several widths (srcset), converted to WebP; the build also drops their metadata.
    layout: 'constrained',
  },
  markdown: {
    // Prism marks tokens with classes; the default highlighter uses inline styles, which the CSP blocks.
    syntaxHighlight: 'prism',
    processor: satteri({ hastPlugins: [writeupImageSizes] }),
  },
  devToolbar: {
    enabled: false,
  },
  vite: {
    build: {
      // Emit every asset as a file: inlined data: URLs would be blocked by the CSP (font-src 'self').
      assetsInlineLimit: 0,
      // The CSS minifier folds animation-timeline into the animation shorthand, which
      // browsers reject, so scroll-driven animations silently disappear. Keep CSS unminified.
      cssMinify: false,
    },
  },
});
